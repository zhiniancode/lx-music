import { useEffect, useMemo, useState, useRef } from 'react'
import { View, Animated } from 'react-native'
// import { useLayout } from '@/utils/hooks'
import { createStyle } from '@/utils/tools'
import { usePlayerMusicInfo, useIsPlay } from '@/store/player/hook'
import { useWindowSize } from '@/utils/hooks'
import { NAV_SHEAR_NATIVE_IDS } from '@/config/constant'
import { useNavigationComponentDidAppear } from '@/navigation'
import { HEADER_HEIGHT } from './components/Header'
import Image from '@/components/common/Image'
import { useStatusbarHeight } from '@/store/common/hook'
import commonState from '@/store/common/state'


export default ({ componentId }: { componentId: string }) => {
  const musicInfo = usePlayerMusicInfo()
  const { width: winWidth, height: winHeight } = useWindowSize()
  const statusBarHeight = useStatusbarHeight()
  const isPlay = useIsPlay()
  const rotateAnim = useRef(new Animated.Value(0)).current

  const [animated, setAnimated] = useState(!!commonState.componentIds.playDetail)
  const [pic, setPic] = useState(musicInfo.pic)
  useEffect(() => {
    if (animated) setPic(musicInfo.pic)
  }, [musicInfo.pic, animated])

  useNavigationComponentDidAppear(componentId, () => {
    setAnimated(true)
  })
  
  // 旋转动画
  useEffect(() => {
    if (isPlay) {
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 20000, // 20秒转一圈
          useNativeDriver: true,
        })
      ).start()
    } else {
      rotateAnim.stopAnimation()
    }
  }, [isPlay, rotateAnim])

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  })
  
  // console.log('render pic')

  const style = useMemo(() => {
    const imgWidth = Math.min(winWidth * 0.65, (winHeight - statusBarHeight - HEADER_HEIGHT) * 0.35)
    return {
      width: imgWidth,
      height: imgWidth,
      borderRadius: imgWidth / 2, // 圆形
    }
  }, [statusBarHeight, winHeight, winWidth])

  return (
    <View style={styles.container}>
      <Animated.View style={{ ...styles.content, elevation: animated ? 3 : 0, transform: [{ rotate }] }}>
        <Image url={pic} nativeID={NAV_SHEAR_NATIVE_IDS.playDetail_pic} style={style} />
      </Animated.View>
    </View>
  )
}

const styles = createStyle({
  container: {
    flexGrow: 0,
    flexShrink: 0,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 15,
  },
  content: {
    backgroundColor: 'rgba(0,0,0,0)',
    borderRadius: 9999, // 圆形
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
})
