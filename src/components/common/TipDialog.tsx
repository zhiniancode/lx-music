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
    alignSelf: 'center',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 20,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  buttonText: {
    fontWeight: '500',
    textAlign: 'center',
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
      bgColor="rgba(0,0,0,0.2)" 
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
              backgroundColor: theme['c-primary-light-100'],
              borderColor: theme['c-primary-light-100'],
            }}
            activeOpacity={0.85}
            onPress={handleClose}
          >
            <Text 
              style={styles.buttonText} 
              size={14} 
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




