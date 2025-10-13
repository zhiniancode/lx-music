import { memo } from 'react'

import { View, StyleSheet } from 'react-native'

import { pop } from '@/navigation'
import StatusBar from '@/components/common/StatusBar'
import { useTheme } from '@/store/theme/hook'
import { usePlayerMusicInfo } from '@/store/player/hook'
import Text from '@/components/common/Text'
import { scaleSizeH } from '@/utils/pixelRatio'
import { HEADER_HEIGHT as _HEADER_HEIGHT, NAV_SHEAR_NATIVE_IDS } from '@/config/constant'
import commonState from '@/store/common/state'
import { useStatusbarHeight } from '@/store/common/hook'
import Btn from './Btn'

export const HEADER_HEIGHT = scaleSizeH(_HEADER_HEIGHT)


const Title = () => {
  const theme = useTheme()
  const musicInfo = usePlayerMusicInfo()


  return (
    <View style={styles.titleContent}>
      <Text numberOfLines={1} style={styles.title} color="#FFFFFF">{musicInfo.name}</Text>
      <Text numberOfLines={1} style={[styles.title, styles.subtitle]} size={12} color="rgba(255, 255, 255, 0.8)">{musicInfo.singer}</Text>
    </View>
  )
}

export default memo(() => {
  const statusBarHeight = useStatusbarHeight()

  const back = () => {
    void pop(commonState.componentIds.playDetail!)
  }

  return (
    <View style={{ height: HEADER_HEIGHT + statusBarHeight, paddingTop: statusBarHeight }} nativeID={NAV_SHEAR_NATIVE_IDS.playDetail_header}>
      <StatusBar />
      <View style={styles.container}>
        <Btn icon="chevron-left" onPress={back} />
        <Title />
        <View style={styles.placeholder} />
      </View>
    </View>
  )
})


const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
  },
  titleContent: {
    flex: 1,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  subtitle: {
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  placeholder: {
    width: 44,
  },
  icon: {
    paddingLeft: 4,
    paddingRight: 4,
  },
})
