@echo off
setlocal
set "PATH=C:\Program Files\Git\cmd;C:\Program Files\Git\bin;%PATH%"
cd /d "%~dp0"

echo ============================================================
echo Pushing Tyrosinase-PPO-Inhibitor-Discovery to GitHub...
echo Repository: https://github.com/Manohar12095/Tyrosinase-PPO-Inhibitor-Discovery.git
echo ============================================================
echo.

git add .
git commit -m "chore: push latest updates"
git push -u origin main

echo.
if %ERRORLEVEL% EQU 0 (
    echo ============================================================
    echo [SUCCESS] Code and data pushed to GitHub successfully!
    echo ============================================================
) else (
    echo ============================================================
    echo [NOTICE] If GitHub authentication window opened, please sign in.
    echo If you have a Personal Access Token (PAT), you can also run:
    echo git push https://YOUR_TOKEN@github.com/Manohar12095/Tyrosinase-PPO-Inhibitor-Discovery.git main
    echo ============================================================
)
echo.
pause
