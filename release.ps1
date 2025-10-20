# LiuSheng Music - Auto Release Script (PowerShell)
param(
    [string]$Version = ""
)

$ErrorActionPreference = "Stop"

Write-Host "================================" -ForegroundColor Cyan
Write-Host "LiuSheng Music - Release Script" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Load server config
if (-not (Test-Path "release.config.json")) {
    Write-Host "Error: release.config.json not found" -ForegroundColor Red
    Write-Host "Please copy release.config.example.json to release.config.json" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

$config = Get-Content "release.config.json" | ConvertFrom-Json
$SERVER_USER = $config.server.user
$SERVER_HOST = $config.server.host
$SERVER_PATH = $config.server.path

try {
    # Step 1: Update version
    Write-Host "[1/6] Updating version..." -ForegroundColor Yellow
    if ($Version) {
        npm run publish $Version
    } else {
        npm run publish
    }
    Write-Host "Version updated" -ForegroundColor Green
    Write-Host ""

    # Get new version
    $packageJson = Get-Content "package.json" | ConvertFrom-Json
    $newVersion = $packageJson.version
    Write-Host "New version: $newVersion" -ForegroundColor Cyan
    Write-Host ""

    # Step 2: Clean build
    Write-Host "[2/6] Cleaning old build..." -ForegroundColor Yellow
    npm run clear
    Write-Host "Clean completed" -ForegroundColor Green
    Write-Host ""

    # Step 3: Build APK
    Write-Host "[3/6] Building Release APK..." -ForegroundColor Yellow
    Write-Host "This may take a few minutes..." -ForegroundColor Gray
    npm run pack:android
    Write-Host "APK build completed" -ForegroundColor Green
    Write-Host ""

    # Step 4: Upload to server
    Write-Host "[4/6] Uploading to server..." -ForegroundColor Yellow
    
    # Upload version.json
    Write-Host "Uploading version.json..." -ForegroundColor Gray
    scp "publish\version.json" "${SERVER_USER}@${SERVER_HOST}:${SERVER_PATH}/version.json"
    
    # Create apk directory
    ssh "${SERVER_USER}@${SERVER_HOST}" "mkdir -p ${SERVER_PATH}/apk"
    
    # Upload arm64-v8a APK only
    $apkFile = "android\app\build\outputs\apk\release\liusheng-music-v${newVersion}-arm64-v8a.apk"
    Write-Host "Uploading APK: $apkFile" -ForegroundColor Gray
    scp $apkFile "${SERVER_USER}@${SERVER_HOST}:${SERVER_PATH}/apk/"
    
    Write-Host "Upload completed" -ForegroundColor Green
    Write-Host ""

    # Step 5: Verify
    Write-Host "[5/6] Verifying server files..." -ForegroundColor Yellow
    ssh "${SERVER_USER}@${SERVER_HOST}" "cat ${SERVER_PATH}/version.json | head -n 5"
    ssh "${SERVER_USER}@${SERVER_HOST}" "ls -lh ${SERVER_PATH}/apk/liusheng-music-v${newVersion}-arm64-v8a.apk"
    Write-Host ""

    # Step 6: Git commit
    Write-Host "[6/6] Committing to Git..." -ForegroundColor Yellow
    git add .
    git commit -m "chore: release v${newVersion}"
    git tag "v${newVersion}"
    git push origin main
    git push origin "v${newVersion}"
    Write-Host "Git commit completed" -ForegroundColor Green
    Write-Host ""

    # Success
    Write-Host "================================" -ForegroundColor Green
    Write-Host "Release completed successfully!" -ForegroundColor Green
    Write-Host "================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "New version: v${newVersion}" -ForegroundColor Cyan
    Write-Host "Users can update via app" -ForegroundColor Cyan
    Write-Host "APK location: $apkFile" -ForegroundColor Cyan
    Write-Host ""

} catch {
    Write-Host ""
    Write-Host "Release failed: $_" -ForegroundColor Red
    Write-Host ""
    exit 1
}

Read-Host "Press Enter to exit"
