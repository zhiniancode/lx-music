# 开发模式测试 APK 安装修复

## 🚀 快速测试步骤

### 1. 启动开发环境

```powershell
# 确保手机已通过USB连接并开启USB调试

# 启动Metro服务器
npm start
```

### 2. 在另一个终端运行应用

```powershell
# 运行Android应用（开发模式）
npm run dev
```

### 3. 在应用中测试

1. 打开应用
2. 进入 **设置** 页面
3. 找到 **版本信息** 选项
4. 你会看到一个 **🧪 测试APK安装（开发者）** 按钮（仅开发模式显示）
5. 点击该按钮
6. 确认测试提示
7. 等待下载完成
8. **关键验证点**：

   - ✅ **如果弹出了安装界面** → FileProvider修复成功！
   - ❌ **如果提示错误** → FileProvider配置仍有问题

## 🔍 测试原理

测试按钮会：

1. 从服务器下载 v1.0.3 的APK文件
2. 保存到应用临时目录
3. 调用 `installApk(savePath, APP_PROVIDER_NAME)`
4. 验证 FileProvider 是否能正确生成 `content://` URI
5. 尝试弹出系统安装界面

## ✅ 预期结果

### 修复成功的表现：

```
1. 点击"开始测试"
2. 显示"正在下载"
3. 下载完成后
4. 📱 弹出系统安装界面
5. 显示"✅ 测试成功"对话框
```

### 如果失败：

```
1. 点击"开始测试"
2. 显示"正在下载"  
3. 下载完成后
4. ❌ 显示"测试失败"错误信息
5. 不会弹出安装界面
```

## 🛠️ 测试代码位置

**文件**: `src/screens/Home/Views/Setting/settings/Version.tsx`

**关键代码**:
```typescript
const handleTestInstall = async () => {
  // 下载APK
  const { promise } = downloadFile(url, savePath, {...})
  await promise
  
  // 测试安装 - 验证FileProvider
  await installApk(savePath, APP_PROVIDER_NAME)
  
  // 如果能弹出安装界面，说明修复成功
}
```

## 📱 测试环境要求

- Android 7.0+ 设备（因为FileProvider是为Android 7.0+设计的）
- 开发模式（`__DEV__ = true`）
- 已开启USB调试
- 网络连接正常（需要下载APK）

## 🔧 故障排查

### 如果测试按钮不显示：

- 检查是否在**开发模式**运行（`npm run dev`）
- 检查是否在**版本信息**页面

### 如果下载失败：

- 检查网络连接
- 确认服务器 `http://your-server/apk/` 可访问
- 检查APK文件是否存在

### 如果安装失败：

- 查看错误信息
- 检查 `APP_PROVIDER_NAME` 是否正确：`cn.liusheng.music.provider`
- 检查 AndroidManifest.xml 中的 FileProvider 配置

## 📊 测试后的操作

### 如果测试成功 ✅

说明FileProvider修复生效，可以：

1. 删除测试代码（可选）
2. 准备发布新版本
3. 清理并编译Release版本：
   ```powershell
   npm run clear
   npm run pack:android
   ```

### 如果测试失败 ❌

需要检查：

1. `src/config/constant.ts` 中的 `APP_PROVIDER_NAME`
2. `android/app/build.gradle` 中的 `applicationId`  
3. `android/app/src/main/AndroidManifest.xml` 中的 FileProvider 配置
4. 确保三者一致

## 🗑️ 测试完成后清理

测试成功后，如果不需要保留测试功能：

1. 打开 `src/screens/Home/Views/Setting/settings/Version.tsx`
2. 删除 `handleTestInstall` 函数
3. 删除测试按钮UI代码（第124-128行）
4. 删除相关import

或者保留它，正式发布时由于 `__DEV__ = false`，按钮会自动隐藏。

## 💡 提示

- 测试按钮**仅在开发模式**显示，不会出现在Release版本中
- 测试会下载约40MB的APK文件
- 测试不会真的安装（除非你点击安装界面的确认按钮）
- 可以多次测试验证稳定性

---

**测试时间**: < 1分钟  
**网络消耗**: ~40MB  
**风险**: 无（仅测试，不强制安装）

