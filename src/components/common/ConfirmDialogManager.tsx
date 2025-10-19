import { useRef, useEffect, useState } from 'react'
import ConfirmDialog, { type ConfirmDialogType } from './ConfirmDialog'

interface ConfirmDialogConfig {
  title?: string
  message: string
  cancelButtonText?: string
  confirmButtonText?: string
  bgHide?: boolean
  onResult?: (confirmed: boolean) => void
}

let globalShowDialog: ((config: ConfirmDialogConfig) => void) | null = null

export const showConfirmDialog = (config: ConfirmDialogConfig) => {
  if (globalShowDialog) {
    globalShowDialog(config)
  }
}

export default function ConfirmDialogManager() {
  const dialogRef = useRef<ConfirmDialogType>(null)
  const [config, setConfig] = useState<ConfirmDialogConfig>({ 
    message: '', 
    title: '',
    cancelButtonText: '取消',
    confirmButtonText: '确定',
    bgHide: true 
  })

  useEffect(() => {
    globalShowDialog = (newConfig: ConfirmDialogConfig) => {
      setConfig(newConfig)
      setTimeout(() => {
        dialogRef.current?.setVisible(true)
      }, 50)
    }
    return () => {
      globalShowDialog = null
    }
  }, [])

  const handleCancel = () => {
    config.onResult?.(false)
  }

  const handleConfirm = () => {
    config.onResult?.(true)
  }

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
    />
  )
}

