@echo off
echo ========================================
echo   Duty Log - Development Server
echo ========================================
echo.

REM ตรวจสอบว่า npm ติดตั้งหรือไม่
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] npm ไม่พบในระบบ!
    echo.
    echo กรุณาติดตั้ง Node.js จาก: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo [INFO] กำลังตรวจสอบ dependencies...
if not exist "node_modules" (
    echo [INFO] กำลังติดตั้ง dependencies...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] การติดตั้ง dependencies ล้มเหลว!
        pause
        exit /b 1
    )
)

echo.
echo [INFO] กำลังเริ่ม development server...
echo [INFO] เปิดเบราว์เซอร์ที่: http://localhost:5173
echo.
echo กด Ctrl+C เพื่อหยุด server
echo.

call npm run dev

pause

