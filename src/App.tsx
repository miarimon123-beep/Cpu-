import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Cat, Settings, X, Activity, Power, Info } from "lucide-react";

export default function App() {
  const [cpu, setCpu] = useState(0);
  const [temp, setTemp] = useState(40);
  const [isAlwaysOnTop, setIsAlwaysOnTop] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [animationEnabled, setAnimationEnabled] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/cpu");
        const data = await res.json();
        setCpu(data.cpu);
        setTemp(data.temp);
      } catch (err) {
        console.error("Failed to fetch CPU stats", err);
      }
    };
    fetchStats();
    const interval = setInterval(fetchStats, 1000);
    return () => clearInterval(interval);
  }, []);

  // Determine animation and glow based on CPU
  let animationProps = {};
  let statusText = "Idle";
  let glowColor = "drop-shadow-[0_0_15px_rgba(59,130,246,0.8)]"; // Blue glow
  let glowHex = "#3b82f6";
  let animationDuration = 2;

  if (cpu <= 10) {
    statusText = "Idle / Slow Walk";
    glowColor = "drop-shadow-[0_0_15px_rgba(16,185,129,0.8)]"; // Green
    glowHex = "#10b981";
    animationDuration = 2;
  } else if (cpu <= 30) {
    statusText = "Walking normally";
    glowColor = "drop-shadow-[0_0_15px_rgba(59,130,246,0.8)]"; // Blue
    glowHex = "#3b82f6";
    animationDuration = 1;
  } else if (cpu <= 60) {
    statusText = "Jogging";
    glowColor = "drop-shadow-[0_0_15px_rgba(234,179,8,0.8)]"; // Yellow
    glowHex = "#eab308";
    animationDuration = 0.6;
  } else if (cpu <= 85) {
    statusText = "Running fast";
    glowColor = "drop-shadow-[0_0_15px_rgba(249,115,22,0.8)]"; // Orange
    glowHex = "#f97316";
    animationDuration = 0.3;
  } else {
    statusText = "Stressed / Sprinting";
    glowColor = "drop-shadow-[0_0_15px_rgba(239,68,68,1)]"; // Red
    glowHex = "#ef4444";
    animationDuration = 0.15;
  }

  if (animationEnabled) {
    animationProps = {
      y: [0, -8, 0],
      scaleY: [1, 0.95, 1],
      transition: { duration: animationDuration, repeat: Infinity, ease: "easeInOut" }
    };
  } else {
    animationProps = { y: 0, scaleY: 1 };
  }

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    // Keep menu within screen bounds
    const x = Math.min(e.clientX, window.innerWidth - 200);
    const y = Math.min(e.clientY, window.innerHeight - 150);
    setMenuPos({ x, y });
    setShowMenu(true);
  };

  return (
    <div className="min-h-screen bg-[url('https://images.unsplash.com/photo-1617042375876-a13e36732a04?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center overflow-hidden relative font-sans">
      {/* Simulate a Windows Desktop Taskbar */}
      <div className="absolute inset-x-0 bottom-0 h-12 bg-black/80 backdrop-blur-xl border-t border-white/10 flex items-center justify-between px-4 z-0">
        <div className="flex space-x-2">
          <div className="w-8 h-8 rounded hover:bg-white/10 transition-colors flex items-center justify-center cursor-pointer">
            <div className="w-4 h-4 grid grid-cols-2 gap-0.5">
              <div className="bg-blue-400 rounded-sm"></div>
              <div className="bg-blue-400 rounded-sm"></div>
              <div className="bg-blue-400 rounded-sm"></div>
              <div className="bg-blue-400 rounded-sm"></div>
            </div>
          </div>
        </div>
        {/* System Tray Area */}
        <div className="flex items-center space-x-3 text-white/70 text-xs">
          <div className="hover:bg-white/10 p-1.5 rounded cursor-pointer" onContextMenu={handleContextMenu}>
            <Cat size={16} />
          </div>
          <div className="hover:bg-white/10 p-1.5 rounded cursor-pointer">ENG</div>
          <div className="hover:bg-white/10 p-1.5 rounded cursor-pointer flex flex-col items-end">
            <span>{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
            <span>{new Date().toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* The Widget (Bottom Right) */}
      <motion.div
        drag
        dragMomentum={false}
        onContextMenu={handleContextMenu}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`absolute bottom-16 right-4 flex flex-col items-center cursor-move ${isAlwaysOnTop ? 'z-50' : 'z-10'}`}
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        {/* Tooltip */}
        {isHovered && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-full mb-2 w-48 bg-zinc-900/95 backdrop-blur-md border border-white/10 rounded-lg shadow-2xl p-3 text-white text-xs pointer-events-none"
          >
            <div className="font-semibold mb-2 flex items-center gap-2 border-b border-white/10 pb-2">
              <Info size={14} className="text-blue-400" /> System Stats
            </div>
            <div className="flex justify-between mb-1">
              <span className="text-white/60">CPU Usage:</span>
              <span className="font-mono">{cpu}%</span>
            </div>
            <div className="flex justify-between mb-1">
              <span className="text-white/60">Temperature:</span>
              <span className="font-mono">{temp}°C</span>
            </div>
            <div className="flex justify-between mt-2 pt-2 border-t border-white/10">
              <span className="text-white/60">Status:</span>
              <span style={{ color: glowHex }} className="font-medium">{statusText}</span>
            </div>
          </motion.div>
        )}

        {/* Shadow Cat Character */}
        <motion.div 
          className={`relative text-zinc-950 ${glowColor} transition-all duration-500`}
          style={animationEnabled ? { animation: `body-bounce ${animationDuration / 2}s infinite alternate ease-in-out` } : {}}
        >
          {/* Animated SVG Silhouette */}
          <svg width="100" height="80" viewBox="0 0 100 80" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className="overflow-visible">
            {/* Tail */}
            <path 
              d="M 25 45 Q 5 20 10 10" 
              stroke="currentColor" 
              strokeWidth="6" 
              fill="none" 
              strokeLinecap="round" 
              className="origin-[25px_45px]" 
              style={animationEnabled ? { animation: `tail-wag ${animationDuration}s infinite alternate ease-in-out` } : {}} 
            />
            
            {/* Back Leg 1 (Background) */}
            <line 
              x1="30" y1="55" x2="30" y2="75" 
              stroke="currentColor" 
              strokeWidth="6" 
              strokeLinecap="round" 
              className="origin-[30px_55px] text-zinc-800" 
              style={animationEnabled ? { animation: `leg-swing ${animationDuration}s infinite alternate ease-in-out` } : {}} 
            />
            
            {/* Front Leg 1 (Background) */}
            <line 
              x1="65" y1="55" x2="65" y2="75" 
              stroke="currentColor" 
              strokeWidth="6" 
              strokeLinecap="round" 
              className="origin-[65px_55px] text-zinc-800" 
              style={animationEnabled ? { animation: `leg-swing ${animationDuration}s infinite alternate ease-in-out` } : {}} 
            />

            {/* Body */}
            <rect x="20" y="35" width="55" height="24" rx="12" fill="currentColor" />
            
            {/* Head */}
            <circle cx="80" cy="30" r="14" fill="currentColor" />
            
            {/* Ears */}
            <polygon points="73,18 68,5 82,12" fill="currentColor" />
            <polygon points="87,18 92,5 78,12" fill="currentColor" />

            {/* Back Leg 2 (Foreground) */}
            <line 
              x1="38" y1="55" x2="38" y2="75" 
              stroke="currentColor" 
              strokeWidth="6" 
              strokeLinecap="round" 
              className="origin-[38px_55px]" 
              style={animationEnabled ? { animation: `leg-swing-reverse ${animationDuration}s infinite alternate ease-in-out` } : {}} 
            />
            
            {/* Front Leg 2 (Foreground) */}
            <line 
              x1="73" y1="55" x2="73" y2="75" 
              stroke="currentColor" 
              strokeWidth="6" 
              strokeLinecap="round" 
              className="origin-[73px_55px]" 
              style={animationEnabled ? { animation: `leg-swing-reverse ${animationDuration}s infinite alternate ease-in-out` } : {}} 
            />
          </svg>
        </motion.div>
      </motion.div>

      {/* Context Menu */}
      {showMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} onContextMenu={(e) => { e.preventDefault(); setShowMenu(false); }}></div>
          <div 
            className="fixed z-50 bg-zinc-900 border border-white/10 rounded-lg shadow-2xl py-1 min-w-[180px] text-sm text-white backdrop-blur-xl"
            style={{ top: menuPos.y, left: menuPos.x }}
          >
            <div className="px-4 py-2 border-b border-white/10 mb-1 flex justify-between items-center">
              <span className="text-xs text-white/50 font-semibold uppercase tracking-wider">CPU Cat</span>
              <span className="text-xs font-mono text-blue-400">{cpu}%</span>
            </div>
            
            <button 
              className="w-full text-left px-4 py-2 hover:bg-white/10 flex items-center gap-2 transition-colors"
              onClick={() => { setShowMenu(false); }}
            >
              <Activity size={14} className="text-white/70" /> Show Statistics
            </button>
            
            <button 
              className="w-full text-left px-4 py-2 hover:bg-white/10 flex items-center justify-between transition-colors"
              onClick={() => { setAnimationEnabled(!animationEnabled); setShowMenu(false); }}
            >
              <div className="flex items-center gap-2">
                <Settings size={14} className="text-white/70" /> Animation
              </div>
              <span className={animationEnabled ? "text-emerald-400" : "text-white/30"}>
                {animationEnabled ? "ON" : "OFF"}
              </span>
            </button>
            
            <div className="h-px bg-white/10 my-1"></div>
            
            <button 
              className="w-full text-left px-4 py-2 hover:bg-red-500/20 text-red-400 flex items-center gap-2 transition-colors"
              onClick={() => setShowMenu(false)}
            >
              <Power size={14} /> Exit Application
            </button>
          </div>
        </>
      )}
    </div>
  );
}
