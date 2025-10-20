import { useRef, useEffect, useState, useCallback } from 'react'
import ConfirmDialog, { type ConfirmDialogType } from './ConfirmDialog'

interface ConfirmDialogConfig {
  title?: string
  message: string
  cancelButtonText?: string
  confirmButtonText?: string
  bgHide?: boolean
  onResult?: (confirmed: boolean) => void
  timestamp?: number // 添加时间戳以区分不同的弹窗请求
}

let globalShowDialog: ((config: ConfirmDialogConfig) => void) | null = null
let currentDialogTimestamp: number = 0

export const showConfirmDialog = (config: ConfirmDialogConfig) => {
  if (globalShowDialog) {
    // 为每个弹窗请求添加唯一时间戳
    globalShowDialog({ ...config, timestamp: Date.now() })
  }
}

export default function ConfirmDialogManager() {
  const dialogRef = useRef<ConfirmDialogType>(null)
  const [config, setConfig] = useState<ConfirmDialogConfig>({ 
    message: '', 
    title: '',
    cancelButtonText: '取消',
    confirmButtonText: '确定',
    bgHide: true,
    timestamp: 0
  })
  const mountedRef = useRef(true)
  const activeTimestampRef = useRef<number>(0)
  const resultHandledRef = useRef(false) // 标记结果是否已处理

  useEffect(() => {
    mountedRef.current = true
    
    globalShowDialog = (newConfig: ConfirmDialogConfig) => {
      // 只在组件仍然挂载时处理
      if (!mountedRef.current || !dialogRef.current) return
      
      // 记录当前弹窗的时间戳
      activeTimestampRef.current = newConfig.timestamp || 0
      currentDialogTimestamp = newConfig.timestamp || 0
      
      // 重置结果处理标记
      resultHandledRef.current = false
      
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
      
      // 只在这是最新的 DialogManager 实例时才清理全局引用
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

  const handleCancel = useCallback(() => {
    // 如果结果已处理，忽略
    if (resultHandledRef.current) return
    resultHandledRef.current = true
    
    // 清除配置，防止状态残留
    const callback = config.onResult
    setConfig({ 
      message: '', 
      title: '',
      cancelButtonText: '取消',
      confirmButtonText: '确定',
      bgHide: true,
      timestamp: 0
    })
    // 延迟调用回调，确保对话框已关闭
    setTimeout(() => {
      callback?.(false)
    }, 100)
  }, [config.onResult])

  const handleConfirm = useCallback(() => {
    // 如果结果已处理，忽略
    if (resultHandledRef.current) return
    resultHandledRef.current = true
    
    // 清除配置，防止状态残留
    const callback = config.onResult
    setConfig({ 
      message: '', 
      title: '',
      cancelButtonText: '取消',
      confirmButtonText: '确定',
      bgHide: true,
      timestamp: 0
    })
    // 延迟调用回调，确保对话框已关闭
    setTimeout(() => {
      callback?.(true)
    }, 100)
  }, [config.onResult])

  const handleHide = useCallback(() => {
    // 当用户点击背景关闭对话框时，视为取消操作
    // 只在结果未被处理时才调用（避免与确认/取消按钮冲突）
    if (!resultHandledRef.current) {
      handleCancel()
    }
  }, [handleCancel])

  return (
    <ConfirmDialog
      ref={dialogRef}
      title={config.title}
      message={config.message}
      cancelButtonText={config.cancelButtonText || '取消'}
      confirmButtonText={config.confirmButtonText || '确定'}
      bgHide={config.bgHide}
      onCancel={handleCancel}
      onConfirm={handleConfirm}
      onHide={handleHide}
    />
  )
}

