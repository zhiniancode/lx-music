import { useRef, useEffect, useState } from 'react'
import TipDialog, { type TipDialogType } from './TipDialog'

interface TipDialogConfig {
  message: string
  btnText?: string
  bgHide?: boolean
  timestamp?: number
}

let globalShowDialog: ((config: TipDialogConfig) => void) | null = null

export const showTipDialog = (config: TipDialogConfig) => {
  if (globalShowDialog) {
    // 为每个弹窗请求添加唯一时间戳
    globalShowDialog({ ...config, timestamp: Date.now() })
  }
}

export default function TipDialogManager() {
  const dialogRef = useRef<TipDialogType>(null)
  const [config, setConfig] = useState<TipDialogConfig>({ 
    message: '', 
    btnText: '确定',
    bgHide: true,
    timestamp: 0
  })
  const mountedRef = useRef(true)
  const activeTimestampRef = useRef<number>(0)

  useEffect(() => {
    mountedRef.current = true
    
    globalShowDialog = (newConfig: TipDialogConfig) => {
      // 只在组件仍然挂载时处理
      if (!mountedRef.current || !dialogRef.current) return
      
      // 记录当前弹窗的时间戳
      activeTimestampRef.current = newConfig.timestamp || 0
      
      setConfig(newConfig)
      // 使用 requestAnimationFrame 替代 setTimeout，确保在下一帧显示
      requestAnimationFrame(() => {
        if (mountedRef.current && dialogRef.current) {
          dialogRef.current.setVisible(true)
        }
      })
    }
    
    return () => {
      mountedRef.current = false
      activeTimestampRef.current = 0
      
      // 清理全局引用
      if (globalShowDialog) {
        globalShowDialog = null
      }
      
      // 确保卸载时关闭对话框
      if (dialogRef.current) {
        try {
          dialogRef.current.setVisible(false)
        } catch (e) {
          // 忽略错误
        }
      }
    }
  }, [])

  return (
    <TipDialog
      ref={dialogRef}
      message={config.message}
      btnText={config.btnText || '确定'}
      bgHide={config.bgHide}
    />
  )
}

