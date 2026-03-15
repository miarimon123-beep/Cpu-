import express from "express";
import { createServer as createViteServer } from "vite";
import os from "os";
import path from "path";

function getCpuUsage() {
  const cpus = os.cpus();
  let user = 0, nice = 0, sys = 0, idle = 0, irq = 0;
  for (let cpu in cpus) {
    user += cpus[cpu].times.user;
    nice += cpus[cpu].times.nice;
    sys += cpus[cpu].times.sys;
    irq += cpus[cpu].times.irq;
    idle += cpus[cpu].times.idle;
  }
  const total = user + nice + sys + idle + irq;
  return { idle, total };
}

let startMeasure = getCpuUsage();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.get("/api/cpu", (req, res) => {
    const endMeasure = getCpuUsage();
    const idleDifference = endMeasure.idle - startMeasure.idle;
    const totalDifference = endMeasure.total - startMeasure.total;
    const percentageCpu = 100 - ~~(100 * idleDifference / totalDifference);
    startMeasure = endMeasure;
    
    // Simulate temperature based on CPU usage for the web preview
    const baseTemp = 40;
    const tempVariance = Math.random() * 2 - 1;
    const simulatedTemp = Math.round(baseTemp + (percentageCpu * 0.4) + tempVariance);

    res.json({ cpu: percentageCpu, temp: simulatedTemp });
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
