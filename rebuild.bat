@echo off
echo ========================================
echo 重新编译应用
echo ========================================
echo.

echo [1/4] 卸载旧应用...
adb uninstall cn.liusheng.music
echo.

echo [2/4] 清理编译缓存...
cd android
call gradlew.bat clean
cd ..
echo.

echo [3/4] 清理 node 缓存...
rd /s /q node_modules\.cache 2>nul
echo.

echo [4/4] 重新编译并安装...
call npm run dev

echo.
echo ========================================
echo 编译完成！
echo ========================================
pause

