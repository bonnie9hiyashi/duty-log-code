@echo off
echo ========================================
echo   Duty Log - Install Dependencies
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

echo [INFO] กำลังติดตั้ง dependencies...
call npm install

if %ERRORLEVEL% EQU 0 (
    echo.
    echo [SUCCESS] ติดตั้ง dependencies สำเร็จ!
    echo.
    echo คุณสามารถรันโปรเจกต์ด้วยคำสั่ง:
    echo   npm run dev
    echo หรือดับเบิลคลิกที่ไฟล์: run-dev.bat
) else (
    echo.
    echo [ERROR] การติดตั้ง dependencies ล้มเหลว!
)

echo.
pause

