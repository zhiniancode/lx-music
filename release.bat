@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ================================
echo 留声音乐 - 自动发布脚本
echo ================================
echo.

REM 获取版本号参数，如果没有则自动递增
set VERSION=%1

REM 步骤 1: 更新版本号
echo [1/6] 📝 更新版本信息...
if "%VERSION%"=="" (
    call npm run publish
) else (
    call npm run publish %VERSION%
)
if errorlevel 1 (
    echo ❌ 版本更新失败！
    pause
    exit /b 1
)
echo ✅ 版本更新完成
echo.

REM 读取新版本号
for /f "tokens=2 delims=:, " %%a in ('findstr /C:"\"version\"" package.json') do (
    set NEW_VERSION=%%a
    set NEW_VERSION=!NEW_VERSION:"=!
    goto :found_version
)
:found_version
echo 📌 新版本: %NEW_VERSION%
echo.

REM 步骤 2: 清理旧构建
echo [2/6] 🧹 清理旧构建...
call npm run clear
echo ✅ 清理完成
echo.

REM 步骤 3: 构建 APK
echo [3/6] 📦 构建 Release APK...
echo 这可能需要几分钟，请耐心等待...
call npm run pack:android
if errorlevel 1 (
    echo ❌ APK 构建失败！
    pause
    exit /b 1
)
echo ✅ APK 构建完成
echo.

REM 步骤 4: 上传到服务器
echo [4/6] ⬆️  上传文件到服务器...

REM 读取服务器配置
if not exist "release.config.json" (
    echo ❌ 未找到 release.config.json 配置文件
    echo 请复制 release.config.example.json 为 release.config.json 并填写你的服务器信息
    pause
    exit /b 1
)

REM 从配置文件读取服务器信息（需要安装 jq 或使用 PowerShell 脚本）
REM 这里使用简单的 PowerShell 命令读取
for /f "usebackq tokens=*" %%a in (`powershell -Command "& {(Get-Content 'release.config.json' | ConvertFrom-Json).server.user}"`) do set SERVER_USER=%%a
for /f "usebackq tokens=*" %%a in (`powershell -Command "& {(Get-Content 'release.config.json' | ConvertFrom-Json).server.host}"`) do set SERVER_HOST=%%a
for /f "usebackq tokens=*" %%a in (`powershell -Command "& {(Get-Content 'release.config.json' | ConvertFrom-Json).server.path}"`) do set SERVER_PATH=%%a

REM 上传 version.json
echo 上传 version.json...
scp publish\version.json %SERVER_USER%@%SERVER_HOST%:%SERVER_PATH%/version.json
if errorlevel 1 (
    echo ❌ version.json 上传失败！
    pause
    exit /b 1
)

REM 创建 apk 目录（如果不存在）
ssh %SERVER_USER%@%SERVER_HOST% "mkdir -p %SERVER_PATH%/apk"

REM 只上传 arm64-v8a 版本的 APK
set APK_FILE=android\app\build\outputs\apk\release\liusheng-music-v%NEW_VERSION%-arm64-v8a.apk
echo 上传 APK: %APK_FILE%
scp %APK_FILE% %SERVER_USER%@%SERVER_HOST%:%SERVER_PATH%/apk/
if errorlevel 1 (
    echo ❌ APK 上传失败！
    pause
    exit /b 1
)
echo ✅ 文件上传完成
echo.

REM 步骤 5: 验证上传
echo [5/6] 🔍 验证服务器文件...
ssh %SERVER_USER%@%SERVER_HOST% "cat %SERVER_PATH%/version.json | head -n 5"
ssh %SERVER_USER%@%SERVER_HOST% "ls -lh %SERVER_PATH%/apk/liusheng-music-v%NEW_VERSION%-arm64-v8a.apk"
echo.

REM 步骤 6: 提交到 Git
echo [6/6] 💾 提交到 Git...
git add .
git commit -m "chore: release v%NEW_VERSION%"
git tag v%NEW_VERSION%
git push origin main
git push origin v%NEW_VERSION%
if errorlevel 1 (
    echo ⚠️  Git 提交可能失败，请手动检查
)
echo ✅ Git 提交完成
echo.

echo ================================
echo ✅ 发布完成！
echo ================================
echo.
echo 📱 新版本: v%NEW_VERSION%
echo 🌐 用户可以在应用内检测到更新
echo 📦 APK 位置: %APK_FILE%
echo.
pause

