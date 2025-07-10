@echo off
echo Démarrage du bot Discord en arrière-plan...
cd /d "%~dp0"
start /min node index.js
echo Bot lancé en arrière-plan !
echo Pour l'arrêter, ferme cette fenêtre ou utilise Ctrl+C
pause 