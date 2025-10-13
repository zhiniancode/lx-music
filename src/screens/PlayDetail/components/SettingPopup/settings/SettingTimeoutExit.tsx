import { useRef } from 'react'
import { View, TouchableOpacity } from 'react-native'
import { useTheme } from '@/store/theme/hook'
import Text from '@/components/common/Text'
import TimeoutExitEditModal, { type TimeoutExitEditModalType, useTimeInfo } from '@/components/TimeoutExitEditModal'
import { useI18n } from '@/lang'
import styles from './style'

const SettingTimeoutExit = () => {
  const theme = useTheme()
  const t = useI18n()
  const modalRef = useRef<TimeoutExitEditModalType>(null)
  const timeInfo = useTimeInfo()

  const handleShow = () => {
    modalRef.current?.show()
  }

  return (
    <>
      <TouchableOpacity 
        onPress={handleShow}
        activeOpacity={0.7}
        style={styles.container}
      >
        <Text>定时停止播放</Text>
        <View style={styles.content}>
          <Text style={styles.label} color={theme['c-font-label']}>
            {timeInfo.active ? '已开启' : '未设置'}
          </Text>
        </View>
      </TouchableOpacity>
      <TimeoutExitEditModal ref={modalRef} timeInfo={timeInfo} />
    </>
  )
}

export default SettingTimeoutExit

