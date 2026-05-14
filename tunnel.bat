@echo off
cd /d "C:\Users\arone\Downloads\stitch_cookit_smart_meal_planner"
ssh -o StrictHostKeyChecking=no -o ServerAliveInterval=30 -R 80:127.0.0.1:3001 nokey@localhost.run
pause
