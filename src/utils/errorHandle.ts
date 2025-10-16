import { Alert } from 'react-native'
// import { exitApp } from '@/utils/common'
import { setJSExceptionHandler, setNativeExceptionHandler } from 'react-native-exception-handler'
import { log } from '@/utils/log'

const errorHandler = (e: Error, isFatal: boolean) => {
  if (isFatal) {
    Alert.alert(
      '💥Unexpected error occurred💥',
      `
应用出 bug 了😭，以下是错误异常信息。请截图并在 GitHub 反馈（并附上刚才你进行了什么操作）。现在应用可能会出现异常，若出现异常请尝试强制结束应用后重新启动！

Error:
${isFatal ? 'Fatal:' : ''} ${e.name} ${e.message}
`,
      [{
        text: '关闭 (Close)',
        onPress: () => {
          // exitApp()
        },
      }],
    )
  }
  log.error(e.stack)
}

if (process.env.NODE_ENV !== 'development') {
  setJSExceptionHandler(errorHandler)

  setNativeExceptionHandler((errorString) => {
    log.error(errorString)
    console.log('+++++', errorString, '+++++')
  }, false)
}

// 处理未捕获的 Promise rejection（开发和生产环境都需要）
global.HermesInternal?.enablePromiseRejectionTracker?.(
  (id, rejection) => {
    // 记录错误但不显示弹窗，避免干扰用户
    console.warn('未处理的 Promise rejection (id: ' + id + '):', rejection?.message || rejection)
    if (rejection?.stack) {
      log.error(rejection.stack)
    }
  }
)