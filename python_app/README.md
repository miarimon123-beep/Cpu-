# CPU Cat Monitor

A lightweight Windows desktop widget that monitors your CPU usage and temperature, represented by an animated shadow cat.

## How to Build and Publish for Windows

Since this is a native Windows application using Windows-specific APIs (`WMI`, `winreg`), it must be compiled on a Windows machine.

### 1. Prerequisites
- Install [Python 3.8+](https://www.python.org/downloads/) on your Windows machine.
- Make sure to check "Add Python to PATH" during installation.

### 2. Add Your Cat Animation
1. Inside this folder, create a directory named `frames`.
2. Add your transparent PNG sequence of the running cat into the `frames` folder (e.g., `frame_0.png`, `frame_1.png`, `frame_2.png`).
   - *Note: If you don't add frames, the app will run with an invisible placeholder so it doesn't crash.*

### 3. Build the Executable (.exe)
Double-click the `build.bat` file. 

This script will:
1. Automatically install all required dependencies (PyQt5, psutil, WMI, PyInstaller).
2. Compile `main.py` into a standalone Windows application.
3. Bundle your `frames/` folder into the final build.

### 4. Run Your App
Once the build finishes, open the `dist/main` folder and double-click `main.exe`.

- The cat will appear at the bottom right.
- It will automatically add itself to the Windows startup registry.
- Right-click the system tray icon to view stats or exit.
