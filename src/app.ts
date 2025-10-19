import '@/utils/errorHandle'
import { init as initLog } from '@/utils/log'
import { bootLog, getBootLog } from '@/utils/bootLog'
import '@/config/globalData'
import { getFontSize } from '@/utils/data'
import { exitApp } from './utils/nativeModules/utils'
import { windowSizeTools } from './utils/windowSizeTools'
import { listenLaunchEvent } from './navigation/regLaunchedEvent'
import { tipDialog } from './utils/tools'

console.log('starting app...')

// 必须在最开始就注册启动事件监听器
listenLaunchEvent()

void Promise.all([getFontSize(), windowSizeTools.init()]).then(async([fontSize]) => {
  global.lx.fontSize = fontSize
  bootLog('Font size setting loaded.')

  let isInited = false
  let handlePushedHomeScreen: () => void | Promise<void>

  const tryGetBootLog = () => {
    try {
      return getBootLog()
    } catch (err) {
      return 'Get boot log failed.'
    }
  }

  const handleInit = async() => {
    if (isInited) return
    void initLog()
    const { default: init } = await import('@/core/init')
    try {
      handlePushedHomeScreen = await init()
    } catch (err: any) {
      void tipDialog({
        title: '初始化失败 (Init Failed)',
        message: `Boot Log:\n${tryGetBootLog()}\n\n${(err.stack ?? err.message) as string}`,
        btnText: 'Exit',
        bgClose: false,
      }).then(() => {
        exitApp()
      })
      return
    }
    isInited ||= true
  }
  const { init: initNavigation, navigations } = await import('@/navigation')

  initNavigation(async() => {
    // 先显示加载屏幕
    await navigations.pushLoadingScreen().catch((err: any) => {
      console.error('Failed to show loading screen:', err)
    })

    // 开始计时，确保加载屏幕至少显示一段时间
    const { createMinLoadingTimeWaiter, preloadData } = await import('@/core/init/preload')
    const waitForMinTime = createMinLoadingTimeWaiter(1000) // 至少显示1秒

    // 并行执行：初始化 + 预加载数据
    await Promise.all([
      handleInit(),
      preloadData(), // 预加载热门搜索、排行榜等数据
    ])

    if (!isInited) return
    // import('@/utils/nativeModules/cryptoTest')

    // 等待最小显示时间（确保动画效果完整展示）
    await waitForMinTime()

    // 检查登录状态，决定显示哪个页面
    const authState = await import('@/store/auth/state')
    const isLoggedIn = authState.default.isLoggedIn

    // 根据登录状态显示不同的页面
    if (isLoggedIn) {
      // 已登录，显示主页
      await navigations.pushHomeScreen().then(() => {
        void handlePushedHomeScreen()
      }).catch((err: any) => {
        void tipDialog({
          title: 'Error',
          message: err.message,
          btnText: 'Exit',
          bgClose: false,
        }).then(() => {
          exitApp()
        })
      })
    } else {
      // 未登录，显示登录页面
      await navigations.pushLoginScreen().catch((err: any) => {
        void tipDialog({
          title: 'Error',
          message: err.message,
          btnText: 'Exit',
          bgClose: false,
        }).then(() => {
          exitApp()
        })
      })
    }
  })
}).catch((err) => {
  void tipDialog({
    title: '初始化失败 (Init Failed)',
    message: `Boot Log:\n\n${(err.stack ?? err.message) as string}`,
    btnText: 'Exit',
    bgClose: false,
  }).then(() => {
    exitApp()
  })
})
