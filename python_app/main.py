import sys
import os
import psutil

# Windows-specific imports
try:
    import winreg
    import wmi
except ImportError:
    pass

from PyQt5.QtWidgets import (QApplication, QLabel, QMenu, QAction, 
                             QMainWindow, QSystemTrayIcon, QGraphicsDropShadowEffect)
from PyQt5.QtCore import Qt, QTimer, QPoint
from PyQt5.QtGui import QPixmap, QIcon, QColor

def get_resource_path(relative_path):
    """ Get absolute path to resource, works for dev and for PyInstaller """
    try:
        # PyInstaller creates a temp folder and stores path in _MEIPASS
        base_path = sys._MEIPASS
    except Exception:
        base_path = os.path.abspath(".")

    return os.path.join(base_path, relative_path)

class CatWidget(QMainWindow):
    def __init__(self):
        super().__init__()
        
        # Initialize WMI once (it's slow to initialize every second)
        self.wmi_obj = None
        try:
            if 'wmi' in sys.modules:
                self.wmi_obj = wmi.WMI(namespace="root\\wmi")
        except Exception as e:
            print(f"WMI Initialization failed: {e}")

        # Load frames
        self.frames = []
        self.current_frame = 0
        self.load_frames()

        self.animation_enabled = True
        self.initUI()
        self.setup_tray()
        self.setup_autostart()

    def load_frames(self):
        # Load all PNG files from the 'frames' directory using the PyInstaller-safe path
        frame_dir = get_resource_path('frames')
        
        if os.path.exists(frame_dir):
            for file in sorted(os.listdir(frame_dir)):
                if file.endswith('.png'):
                    self.frames.append(QPixmap(os.path.join(frame_dir, file)))
        
        # Fallback if no frames found
        if not self.frames:
            print("Warning: No frames found in 'frames' folder. Using empty pixmap.")
            # Create a transparent placeholder
            placeholder = QPixmap(100, 100)
            placeholder.fill(Qt.transparent)
            self.frames.append(placeholder)

    def initUI(self):
        # Frameless, always on top, hide from taskbar
        self.setWindowFlags(Qt.FramelessWindowHint | Qt.WindowStaysOnTopHint | Qt.Tool)
        self.setAttribute(Qt.WA_TranslucentBackground)

        self.label = QLabel(self)
        self.label.setPixmap(self.frames[0])
        
        # Setup Glow Effect
        self.glow = QGraphicsDropShadowEffect(self)
        self.glow.setBlurRadius(20)
        self.glow.setOffset(0, 0)
        self.label.setGraphicsEffect(self.glow)

        self.setCentralWidget(self.label)

        # CPU & Temp monitoring timer (1 second)
        self.monitor_timer = QTimer(self)
        self.monitor_timer.timeout.connect(self.update_stats)
        self.monitor_timer.start(1000)

        # Animation timer
        self.anim_timer = QTimer(self)
        self.anim_timer.timeout.connect(self.next_frame)
        self.anim_timer.start(100) # Default speed

        # Position at bottom right (above system tray)
        screen = QApplication.primaryScreen().geometry()
        self.resize(self.frames[0].width(), self.frames[0].height())
        # Offset by 20px from right and 60px from bottom to sit above taskbar
        self.move(screen.width() - self.width() - 20, screen.height() - self.height() - 60)

        self.show()
        self.update_stats() # Initial call

    def next_frame(self):
        if not self.animation_enabled or not self.frames:
            return
        
        # Advance to the next frame
        self.current_frame = (self.current_frame + 1) % len(self.frames)
        current_pixmap = self.frames[self.current_frame]
        
        # Update the desktop widget
        self.label.setPixmap(current_pixmap)
        
        # Update the system tray icon to animate it as well!
        if hasattr(self, 'tray_icon'):
            self.tray_icon.setIcon(QIcon(current_pixmap))

    def get_cpu_temp(self):
        if not self.wmi_obj:
            return "N/A"
            
        try:
            # MSAcpi_ThermalZoneTemperature returns temp in tenths of degrees Kelvin
            temp_k = self.wmi_obj.MSAcpi_ThermalZoneTemperature()[0].CurrentTemperature
            temp_c = (temp_k / 10.0) - 273.15
            return round(temp_c, 1)
        except Exception:
            # WMI temperature often requires admin rights or specific drivers
            return "N/A"

    def update_stats(self):
        cpu = psutil.cpu_percent()
        temp = self.get_cpu_temp()
        
        # Determine speed, status, and glow color
        if cpu <= 10:
            speed = 200      # Idle / Slow
            status = "Idle"
            color = QColor(16, 185, 129, 200) # Green
        elif cpu <= 30:
            speed = 100      # Normal walk
            status = "Walking"
            color = QColor(59, 130, 246, 200) # Blue
        elif cpu <= 60:
            speed = 60       # Jogging
            status = "Jogging"
            color = QColor(234, 179, 8, 200)  # Yellow
        elif cpu <= 85:
            speed = 30       # Running fast
            status = "Running"
            color = QColor(249, 115, 22, 200) # Orange
        else:
            speed = 15       # Stressed / Very fast
            status = "Stressed"
            color = QColor(239, 68, 68, 255)  # Red

        self.anim_timer.setInterval(speed)
        self.glow.setColor(color)
        
        # Update Tooltip
        tooltip_text = f"CPU Usage: {cpu}%\nTemperature: {temp}°C\nStatus: {status}"
        self.label.setToolTip(tooltip_text)
        if hasattr(self, 'tray_icon'):
            self.tray_icon.setToolTip(tooltip_text)

    def setup_tray(self):
        self.tray_icon = QSystemTrayIcon(self)
        
        # Use the first frame as the initial tray icon
        if self.frames:
            self.tray_icon.setIcon(QIcon(self.frames[0]))
        
        tray_menu = QMenu()
        
        # Show Stats Action
        stats_action = QAction("Show Statistics", self)
        stats_action.triggered.connect(self.show_stats_msg)
        tray_menu.addAction(stats_action)
        
        # Toggle Animation Action
        self.toggle_anim_action = QAction("Disable Animation", self)
        self.toggle_anim_action.triggered.connect(self.toggle_animation)
        tray_menu.addAction(self.toggle_anim_action)
        
        tray_menu.addSeparator()
        
        # Exit Action
        exit_action = QAction("Exit", self)
        exit_action.triggered.connect(QApplication.instance().quit)
        tray_menu.addAction(exit_action)
        
        self.tray_icon.setContextMenu(tray_menu)
        self.tray_icon.show()

    def show_stats_msg(self):
        cpu = psutil.cpu_percent()
        temp = self.get_cpu_temp()
        self.tray_icon.showMessage(
            "CPU Cat Stats",
            f"CPU Usage: {cpu}%\nTemperature: {temp}°C",
            QSystemTrayIcon.Information,
            2000
        )

    def toggle_animation(self):
        self.animation_enabled = not self.animation_enabled
        if self.animation_enabled:
            self.toggle_anim_action.setText("Disable Animation")
        else:
            self.toggle_anim_action.setText("Enable Animation")

    def setup_autostart(self):
        # Add to Windows Registry for auto-launch on boot
        if 'winreg' not in sys.modules:
            return
            
        try:
            key = winreg.OpenKey(winreg.HKEY_CURRENT_USER, 
                                 r"Software\Microsoft\Windows\CurrentVersion\Run", 
                                 0, winreg.KEY_SET_VALUE)
            
            # If running as a PyInstaller bundle, sys.executable is the .exe
            # Otherwise, it's python.exe
            if getattr(sys, 'frozen', False):
                exe_path = sys.executable
            else:
                exe_path = sys.executable.replace("python.exe", "pythonw.exe")
                script_path = os.path.abspath(__file__)
                exe_path = f'"{exe_path}" "{script_path}"'
            
            winreg.SetValueEx(key, "CPUCatMonitor", 0, winreg.REG_SZ, exe_path)
            winreg.CloseKey(key)
        except Exception as e:
            print(f"Failed to set auto-start: {e}")

    # Allow dragging the widget around the screen
    def mousePressEvent(self, event):
        if event.button() == Qt.LeftButton:
            self.oldPos = event.globalPos()

    def mouseMoveEvent(self, event):
        if event.buttons() == Qt.LeftButton:
            delta = QPoint(event.globalPos() - self.oldPos)
            self.move(self.x() + delta.x(), self.y() + delta.y())
            self.oldPos = event.globalPos()

if __name__ == '__main__':
    app = QApplication(sys.argv)
    # Ensure the app doesn't close if the main window is hidden
    app.setQuitOnLastWindowClosed(False) 
    ex = CatWidget()
    sys.exit(app.exec_())
