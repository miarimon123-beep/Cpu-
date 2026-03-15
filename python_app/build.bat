@echo off
echo Installing requirements...
pip install -r requirements.txt

echo.
echo Building CPU Cat Monitor...
pyinstaller --noconfirm --onedir --windowed --add-data "frames;frames/"  "main.py"

echo.
echo Build complete!
echo You can find your executable in the "dist\main" folder.
pause
