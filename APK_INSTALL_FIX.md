# APK 安装失败问题修复

## 问题现象

用户在应用内检查更新时：
- ✅ 能检测到新版本
- ✅ 能成功下载APK
- ❌ **下载完成后提示"下载失败"，无法安装**

## 根本原因

**FileProvider Authority 配置错误**

### 错误配置：

```typescript
// src/config/constant.ts
export const APP_PROVIDER_NAME = 'cn.toside.music.mobile.provider'  // ❌ 错误
```

### 实际配置：

```xml
<!-- AndroidManifest.xml -->
<provider
  android:authorities="${applicationId}.provider"
  ...
/>
```

其中 `applicationId = "cn.liusheng.music"`

所以实际的 authority 应该是：`cn.liusheng.music.provider`

### 为什么会导致安装失败？

1. 应用下载APK到临时目录：`/data/data/cn.liusheng.music/cache/lx-music-mobile.apk`
2. Android 7.0+ 不允许直接使用 `file://` URI 安装APK
3. 必须使用 FileProvider 转换为 `content://` URI
4. 调用 `FileProvider.getUriForFile()` 时，authority 不匹配
5. 抛出异常，安装失败

## 已修复

✅ 已将 `APP_PROVIDER_NAME` 修改为 `'cn.liusheng.music.provider'`

## 操作步骤

### 方式1: 使用发布脚本（推荐）

```powershell
# 发布新版本 1.0.4
.\release.ps1 -Version "1.0.4"
```

### 方式2: 手动操作

#### 步骤1：更新版本号

编辑 `package.json`：

```json
{
  "version": "1.0.4",
  "versionCode": 104
}
```

#### 步骤2：清理并编译

```powershell
npm run clear
npm run pack:android
```

#### 步骤3：上传到服务器

```powershell
# 上传version.json
scp publish\version.json root@your-server:/var/www/liusheng-music/

# 上传APK
scp android\app\build\outputs\apk\release\liusheng-music-v1.0.4-arm64-v8a.apk root@your-server:/var/www/liusheng-music/apk/
```

#### 步骤4：提交代码

```powershell
git add .
git commit -m "fix: 修复应用更新安装失败问题"
git push
```

## 验证修复

### 1. 在服务器上检查

```bash
ssh root@your-server "cat /var/www/liusheng-music/version.json"
ssh root@your-server "ls -lh /var/www/liusheng-music/apk/liusheng-music-v1.0.4-*.apk"
```

### 2. 在应用中测试

1. 安装当前版本（1.0.1或1.0.3）
2. 在设置中检查更新
3. 下载新版本
4. 验证能否正常安装

## 技术细节

### FileProvider 工作原理

Android 7.0+ 引入了严格的文件访问限制：

```java
// ❌ Android 7.0+ 不允许
Uri uri = Uri.fromFile(new File("/path/to/app.apk"));
Intent intent = new Intent(Intent.ACTION_VIEW);
intent.setData(uri);  // 会抛出 FileUriExposedException

// ✅ 正确方式
Uri uri = FileProvider.getUriForFile(context, 
    "cn.liusheng.music.provider",  // 必须与AndroidManifest中的authority一致
    new File("/path/to/app.apk"));
Intent intent = new Intent(Intent.ACTION_INSTALL_PACKAGE);
intent.setData(uri);
```

### FileProvider 配置文件

`android/app/src/main/res/xml/file_paths.xml`:

```xml
<paths>
  <cache-path name="cache" path="/" />
</paths>
```

这允许通过FileProvider访问应用的cache目录（`/data/data/cn.liusheng.music/cache/`）

### 安装流程

```
下载APK
  ↓
保存到 cache 目录
  ↓
使用 FileProvider 获取 content:// URI
  ↓
启动安装 Intent
  ↓
用户确认安装
```

## 预防措施

### 1. 确保配置一致性

```typescript
// src/config/constant.ts
export const APP_PROVIDER_NAME = '${applicationId}.provider'
```

```xml
<!-- AndroidManifest.xml -->
<provider
  android:authorities="${applicationId}.provider"
  ...
/>
```

### 2. 本地测试更新流程

在发布前，测试完整的更新流程：

```powershell
# 1. 构建旧版本并安装
# 2. 修改version.json为新版本
# 3. 在应用中检查更新
# 4. 验证下载和安装
```

### 3. 添加错误日志

在 `installApk` 调用时捕获异常：

```typescript
try {
  await installApk(apkSavePath, APP_PROVIDER_NAME)
} catch (error) {
  console.error('Install failed:', error)
  // 上报错误
}
```

## 相关文件

- `src/config/constant.ts` - APP_PROVIDER_NAME 定义
- `android/app/src/main/AndroidManifest.xml` - FileProvider 配置
- `android/app/src/main/res/xml/file_paths.xml` - 文件路径配置
- `android/app/src/main/java/cn/liusheng/music/utils/UtilsModule.java` - installApk 实现
- `src/utils/version.js` - 下载和安装逻辑

## 常见问题

### Q: 用户已经下载了损坏的1.0.3怎么办？

A: 发布1.0.4版本，用户会检测到新版本并重新下载。

### Q: 能否原地修复1.0.3？

A: 可以，但不推荐。因为：
1. 用户无法检测到版本变化
2. 需要手动卸载重装
3. 会丢失用户数据

### Q: 如何确认修复成功？

A: 
1. 在真机上安装旧版本
2. 检查更新
3. 完整走一遍更新流程
4. 验证能否正常安装

---

**修复时间**: 2025-10-21  
**影响版本**: v1.0.3  
**修复版本**: v1.0.4

