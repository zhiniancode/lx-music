import { useRef, useEffect, useState } from 'react'
import TipDialog, { type TipDialogType } from './TipDialog'

interface TipDialogConfig {
  message: string
  btnText?: string
  bgHide?: boolean
}

let globalShowDialog: ((config: TipDialogConfig) => void) | null = null

export const showTipDialog = (config: TipDialogConfig) => {
  if (globalShowDialog) {
    globalShowDialog(config)
  }
}

export default function TipDialogManager() {
  const dialogRef = useRef<TipDialogType>(null)
  const [config, setConfig] = useState<TipDialogConfig>({ 
    message: '', 
    btnText: '确定',
    bgHide: true 
  })

  useEffect(() => {
    globalShowDialog = (newConfig: TipDialogConfig) => {
      setConfig(newConfig)
      setTimeout(() => {
        dialogRef.current?.setVisible(true)
      }, 50)
    }
    return () => {
      globalShowDialog = null
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

