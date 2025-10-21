# 播放器全屏功能实现说明

## 问题分析

底部白边是 **Android 系统的手势导航条**（Gesture Navigation Bar），这是 Android 10+ 全面屏手势导航模式下显示的一条白色或灰色横条，用于手势操作提示。

## 解决方案

实现了播放器页面的全屏沉浸式模式，可以隐藏：
- ✅ 状态栏（顶部）
- ✅ 导航栏（底部）
- ✅ 手势提示条（底部白边）

## 修改内容

### 1. 启用原生全屏方法
**文件**: `android/app/src/main/java/cn/liusheng/music/utils/UtilsModule.java`

取消注释了全屏相关方法，并使用 `IMMERSIVE_STICKY` 模式：
- `onFullScreen()`: 启用全屏
- `offFullScreen()`: 退出全屏

```java
@ReactMethod
public void onFullScreen() {
  UiThreadUtil.runOnUiThread(() -> {
    Activity currentActivity = reactContext.getCurrentActivity();
    if (currentActivity == null) return;
    currentActivity.getWindow().getDecorView().setSystemUiVisibility(
      View.SYSTEM_UI_FLAG_LAYOUT_STABLE
        | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
        | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
        | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION // 隐藏导航栏
        | View.SYSTEM_UI_FLAG_FULLSCREEN // 隐藏状态栏
        | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY // 沉浸式粘性模式
    );
  });
}
```

### 2. TypeScript 接口
**文件**: `src/utils/nativeModules/utils.ts`

添加了全屏方法的导出：
```typescript
export const enableFullScreen = (): void => {
  UtilsModule.onFullScreen()
}

export const disableFullScreen = (): void => {
  UtilsModule.offFullScreen()
}
```

### 3. 播放器页面集成
**文件**: `src/screens/PlayDetail/Vertical/index.tsx`

在播放器页面进入时启用全屏，离开时退出全屏：
```typescript
useEffect(() => {
  // 进入播放页面时保持屏幕常亮并启用全屏
  screenkeepAwake()
  if (Platform.OS === 'android') {
    enableFullScreen()
  }
  
  return () => {
    screenUnkeepAwake()
    // 离开播放页面时退出全屏
    if (Platform.OS === 'android') {
      disableFullScreen()
    }
  }
}, [])
```

### 4. 导航栏颜色调整
**文件**: `android/app/src/main/res/values/styles.xml`

将导航栏默认颜色设置为黑色：
```xml
<item name="android:navigationBarColor">@android:color/black</item>
```

### 5. 播放器背景优化
**文件**: `src/screens/PlayDetail/Vertical/index.tsx`

添加了黑色背景色，确保任何间隙都显示黑色：
```typescript
container: {
  flex: 1,
  flexDirection: 'column',
  position: 'relative',
  backgroundColor: '#000000',
}
```

## 使用说明

### 编译应用

修改了 Java 代码，需要重新编译应用：

```bash
# 方式 1：快速编译
npm run dev

# 方式 2：完全重新编译（如果遇到问题）
cd android
gradlew.bat clean
cd ..
npm run dev
```

### 功能特性

1. **自动全屏**: 进入播放器页面时自动进入全屏模式
2. **自动退出**: 离开播放器页面时自动退出全屏模式
3. **沉浸式体验**: 使用 `IMMERSIVE_STICKY` 模式，用户滑动手势后系统栏会自动隐藏
4. **后台处理**: 应用切换到后台时正确处理全屏状态

### 用户体验

- 🎵 进入播放器页面 → 全屏沉浸式体验
- 👆 向下滑动屏幕顶部 → 临时显示状态栏，几秒后自动隐藏
- 👆 向上滑动屏幕底部 → 临时显示导航栏，几秒后自动隐藏
- 🔙 返回其他页面 → 自动退出全屏，恢复正常显示

## 技术细节

### IMMERSIVE_STICKY 模式

这种模式的特点：
- 隐藏状态栏和导航栏
- 用户可以通过滑动手势临时显示系统栏
- 系统栏会在几秒后自动隐藏
- 适合音乐播放器、视频播放器等沉浸式应用

### Android 版本兼容性

- ✅ Android 5.0+ (API 21+): 完全支持
- ✅ Android 10+ (手势导航): 完美隐藏手势提示条
- ✅ Android 11+ (API 30+): 支持最新的沉浸式 API

## 测试建议

1. 测试不同 Android 版本的设备
2. 测试三键导航和手势导航两种模式
3. 测试应用前后台切换
4. 测试页面跳转时的全屏切换

## 注意事项

⚠️ **重要**: 修改了 Java 原生代码，必须重新编译应用才能生效！热重载无效。

📱 **仅 Android**: 全屏功能目前仅在 Android 平台实现，iOS 需要另外处理。

