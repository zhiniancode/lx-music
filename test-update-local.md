# 本地测试应用更新流程

## 准备工作

### 1. 编译当前版本的Debug APK

```powershell
# 编译Debug版本（带签名）
cd android
.\gradlew.bat assembleDebug
cd ..
```

APK位置：`android/app/build/outputs/apk/debug/app-debug.apk`

### 2. 创建本地测试服务器

在项目根目录创建测试文件：

**test-version.json**（模拟服务器上的version.json）
```json
{
  "version": "1.0.4",
  "desc": "### 修复\n\n- 修复应用内更新下载后无法安装的问题\n- 修复 FileProvider 配置错误导致的安装失败\n\n### 优化\n\n- 优化应用更新安装流程",
  "history": []
}
```

### 3. 搭建简易HTTP服务器

```powershell
# 方式1：使用Python（如果已安装）
python -m http.server 8000

# 方式2：使用Node.js
npx http-server -p 8000

# 方式3：使用PowerShell
# 下载并运行 simple-http-server
```

## 测试步骤

### 步骤1：修改更新URL为本地服务器

临时修改 `src/utils/version.js`：

```javascript
// 获取你的电脑IP地址
const address = [
  ['http://192.168.x.x:8000/test-version.json', 'direct'],
]

// APK下载地址也改为本地
const url = `http://192.168.x.x:8000/android/app/build/outputs/apk/debug/app-debug.apk`
```

### 步骤2：安装旧版本

```powershell
# 安装当前版本
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

### 步骤3：启动开发服务器

```powershell
# 启动Metro
npm start
```

### 步骤4：运行应用并测试

```powershell
# 在另一个终端运行
npm run dev
```

### 步骤5：触发更新检查

1. 打开应用
2. 进入"设置"
3. 找到"版本信息"
4. 点击"检查更新"
5. 观察是否能检测到新版本
6. 点击"立即更新"
7. 观察下载进度
8. **关键：下载完成后是否能弹出安装界面**

## 验证点

- [ ] 能检测到新版本（1.0.4）
- [ ] 能显示更新说明
- [ ] 下载进度正常显示
- [ ] **下载完成后能弹出安装界面**（这是关键！）
- [ ] 能成功安装（覆盖旧版本）
- [ ] 安装后版本号正确

## 预期结果

### 修复前（会失败）：
```
✅ 检测更新成功
✅ 下载成功（100%）
❌ 提示"下载失败"
❌ 无法弹出安装界面
```

### 修复后（应该成功）：
```
✅ 检测更新成功
✅ 下载成功（100%）
✅ 弹出安装界面
✅ 用户点击安装后成功覆盖
```

## 快速验证FileProvider

如果只想验证FileProvider是否正确配置，可以使用最简单的方法。

