@echo off
setlocal enabledelayedexpansion

set "file=js\theme.js"
set "temp=temp_theme.js"

del "%temp%" 2>nul

for /f "usebackq delims=" %%a in ("%file%") do (
    set "line=%%a"
    echo !line! >> "%temp%"
    
    if "!line!"=="        cutecreatures: {" (
        echo             fab: '🌿', >> "%temp%"
        echo             navLedger: '🐾', >> "%temp%"
        echo             navWallet: '🌱', >> "%temp%"
        echo             navInvestment: '🍃', >> "%temp%"
        echo             navChart: '🌿', >> "%temp%"
        echo             navSettings: '🌿' >> "%temp%"
        echo         }, >> "%temp%"
        echo         spacegold: { >> "%temp%"
        echo             fab: '🚀', >> "%temp%"
        echo             navLedger: '🪐', >> "%temp%"
        echo             navWallet: '✨', >> "%temp%"
        echo             navInvestment: '💫', >> "%temp%"
        echo             navChart: '🌟', >> "%temp%"
        echo             navSettings: '🚀' >> "%temp%"
        echo         } >> "%temp%"
        
        rem Skip the next 6 lines (original cutecreatures content)
        for /l %%i in (1,1,6) do (
            set /p "skipline="
        )
    )
)

move "%temp%" "%file%" >nul 2>&1
echo Done!
