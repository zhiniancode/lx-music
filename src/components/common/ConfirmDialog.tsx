import { forwardRef, useImperativeHandle, useRef } from 'react'
import { View, TouchableOpacity } from 'react-native'
import Modal, { type ModalType } from './Modal'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import Text from './Text'
import { scaleSizeW, scaleSizeH } from '@/utils/pixelRatio'

const styles = createStyle({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  modalView: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 16,
    paddingTop: 28,
    paddingBottom: 20,
    paddingHorizontal: 24,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  titleContainer: {
    marginBottom: 16,
    alignItems: 'center',
  },
  titleText: {
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  messageContainer: {
    marginBottom: 28,
    alignItems: 'center',
  },
  messageText: {
    textAlign: 'center',
    lineHeight: 22,
    letterSpacing: 0.3,
    opacity: 0.85,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  button: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: scaleSizeH(10),
    paddingHorizontal: scaleSizeW(16),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  buttonText: {
    fontWeight: '500',
    textAlign: 'center',
    fontSize: scaleSizeW(15),
  },
})

export interface ConfirmDialogProps {
  title?: string
  message: string
  cancelButtonText?: string
  confirmButtonText?: string
  onCancel?: () => void
  onConfirm?: () => void
  onHide?: () => void
  bgHide?: boolean
}

export interface ConfirmDialogType {
  setVisible: (visible: boolean) => void
}

export default forwardRef<ConfirmDialogType, ConfirmDialogProps>(({
  title = '',
  message,
  cancelButtonText = '取消',
  confirmButtonText = '确定',
  onCancel,
  onConfirm,
  onHide,
  bgHide = true,
}: ConfirmDialogProps, ref) => {
  const theme = useTheme()
  const modalRef = useRef<ModalType>(null)

  useImperativeHandle(ref, () => ({
    setVisible(visible: boolean) {
      modalRef.current?.setVisible(visible)
    },
  }))

  const handleCancel = () => {
    // 先调用回调，再关闭 Modal（避免时序问题）
    onCancel?.()
    modalRef.current?.setVisible(false)
  }

  const handleConfirm = () => {
    // 先调用回调，再关闭 Modal（避免时序问题）
    onConfirm?.()
    modalRef.current?.setVisible(false)
  }

  return (
    <Modal 
      onHide={onHide} 
      keyHide={true} 
      bgHide={bgHide} 
      bgColor="rgba(0,0,0,0.3)" 
      ref={modalRef}
    >
      <View style={styles.centeredView}>
        <View 
          style={{ 
            ...styles.modalView, 
            backgroundColor: theme['c-content-background'] 
          }} 
          onStartShouldSetResponder={() => true}
        >
          {title ? (
            <View style={styles.titleContainer}>
              <Text 
                style={styles.titleText} 
                size={18} 
                color={theme['c-font']}
              >
                {title}
              </Text>
            </View>
          ) : null}
          
          <View style={styles.messageContainer}>
            <Text 
              style={styles.messageText} 
              size={15} 
              color={theme['c-font']}
            >
              {message}
            </Text>
          </View>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={{
                ...styles.button,
                backgroundColor: theme['c-content-background'],
                borderColor: theme['c-border-background'],
              }}
              activeOpacity={0.8}
              onPress={handleCancel}
            >
              <Text 
                style={styles.buttonText} 
                color={theme['c-font-label']}
              >
                {cancelButtonText}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                ...styles.button,
                backgroundColor: theme['c-primary-light-100'],
                borderColor: theme['c-primary-light-100'],
              }}
              activeOpacity={0.8}
              onPress={handleConfirm}
            >
              <Text 
                style={styles.buttonText} 
                color="#FFFFFF"
              >
                {confirmButtonText}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
})

