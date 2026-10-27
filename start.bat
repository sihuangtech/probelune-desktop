@echo off
chcp 65001 >nul
title Probelune 桌面端启动脚本

echo 🚀 Probelune 桌面端启动脚本
echo ==================================

REM 检查Node.js是否安装
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 错误: 未找到Node.js，请先安装Node.js 26或更高版本
    echo    下载地址: https://nodejs.org/
    pause
    exit /b 1
)

REM 检查npm是否安装
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 错误: 未找到npm，请确保Node.js正确安装
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i

echo ✅ Node.js版本: %NODE_VERSION%
echo ✅ npm版本: %NPM_VERSION%

REM 检查是否已安装依赖
if not exist "node_modules" (
    echo 📦 正在安装依赖...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ 依赖安装失败，请检查到 https://registry.npmjs.org/ 的网络连接
        pause
        exit /b 1
    )
    echo ✅ 依赖安装完成
) else (
    echo ✅ 依赖已安装
)

REM 检查.env文件
if not exist ".env" (
    echo ⚠️  警告: 未找到.env文件
    echo    请创建.env文件并配置IP2Location API密钥
    echo    示例内容:
    echo    IP2LOCATION_API_KEY=your_api_key_here
    echo    NODE_ENV=development
    echo.
    echo    获取API密钥: https://www.ip2location.com/
    echo.
    set /p continue="是否继续启动？(y/n): "
    if /i not "%continue%"=="y" (
        exit /b 1
    )
)

echo 🚀 正在启动开发服务器...
echo    - Vite开发服务器将在 http://localhost:3000 启动
echo    - Electron应用将自动打开
echo    - 按 Ctrl+C 停止服务
echo.

REM 启动开发服务器
npm run electron:dev

pause
