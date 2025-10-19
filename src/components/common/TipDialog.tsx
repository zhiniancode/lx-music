import { forwardRef, useImperativeHandle, useRef } from 'react'
import { View, TouchableOpacity } from 'react-native'
import Modal, { type ModalType } from './Modal'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import Text from './Text'

const styles = createStyle({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  modalView: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 20,
    paddingTop: 28,
    paddingBottom: 20,
    paddingHorizontal: 24,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  messageContainer: {
    marginBottom: 24,
    alignItems: 'center',
  },
  messageText: {
    textAlign: 'center',
    lineHeight: 24,
    letterSpacing: 0.3,
  },
  button: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    elevation: 2,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  buttonText: {
    fontWeight: '600',
    letterSpacing: 0.5,
  },
})

export interface TipDialogProps {
  message: string
  btnText?: string
  onHide?: () => void
  bgHide?: boolean
}

export interface TipDialogType {
  setVisible: (visible: boolean) => void
}

export default forwardRef<TipDialogType, TipDialogProps>(({
  message,
  btnText = '确定',
  onHide,
  bgHide = true,
}: TipDialogProps, ref) => {
  const theme = useTheme()
  const modalRef = useRef<ModalType>(null)

  useImperativeHandle(ref, () => ({
    setVisible(visible: boolean) {
      modalRef.current?.setVisible(visible)
    },
  }))

  const handleClose = () => {
    modalRef.current?.setVisible(false)
  }

  return (
    <Modal 
      onHide={onHide} 
      keyHide={true} 
      bgHide={bgHide} 
      bgColor="rgba(0,0,0,0.5)" 
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
          <View style={styles.messageContainer}>
            <Text 
              style={styles.messageText} 
              size={16} 
              color={theme['c-font']}
            >
              {message}
            </Text>
          </View>
          
          <TouchableOpacity
            style={{
              ...styles.button,
              backgroundColor: theme['c-primary-font-active'],
            }}
            activeOpacity={0.85}
            onPress={handleClose}
          >
            <Text 
              style={styles.buttonText} 
              size={16} 
              color="#FFFFFF"
            >
              {btnText}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
})




