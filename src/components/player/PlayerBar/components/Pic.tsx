import { StyleSheet, TouchableOpacity, View, Animated } from 'react-native'
import { navigations } from '@/navigation'
import { usePlayerMusicInfo, useIsPlay } from '@/store/player/hook'
import { scaleSizeH } from '@/utils/pixelRatio'
import commonState from '@/store/common/state'
import playerState from '@/store/player/state'
import { LIST_IDS, NAV_SHEAR_NATIVE_IDS } from '@/config/constant'
import Image from '@/components/common/Image'
import { useCallback, useEffect, useRef } from 'react'
import { setLoadErrorPicUrl, setMusicInfo } from '@/core/player/playInfo'

const PIC_HEIGHT = scaleSizeH(40)

const styles = StyleSheet.create({
  container: {
    borderRadius: PIC_HEIGHT / 2, // 圆形
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  image: {
    width: PIC_HEIGHT,
    height: PIC_HEIGHT,
  },
})

export default ({ isHome }: { isHome: boolean }) => {
  const musicInfo = usePlayerMusicInfo()
  const isPlay = useIsPlay()
  const rotateAnim = useRef(new Animated.Value(0)).current

  // 旋转动画
  useEffect(() => {
    let animation: Animated.CompositeAnimation | null = null

    if (isPlay) {
      // 创建循环旋转动画
      rotateAnim.setValue(0)
      animation = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 10000, // 10秒转一圈
          useNativeDriver: true,
        })
      )
      animation.start()
    } else {
      // 停止播放时停止动画
      rotateAnim.stopAnimation()
    }

    return () => {
      if (animation) {
        animation.stop()
      }
    }
  }, [isPlay, rotateAnim])

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  })

  const handlePress = () => {
    // console.log('')
    // console.log(playMusicInfo)
    if (!musicInfo.id) return
    navigations.pushPlayDetailScreen(commonState.componentIds.home!)

    // toast(global.i18n.t('play_detail_todo_tip'), 'long')
  }

  const handleLongPress = () => {
    if (!isHome) return
    const listId = playerState.playMusicInfo.listId
    if (!listId || listId == LIST_IDS.DOWNLOAD) return
    global.app_event.jumpListPosition()
  }

  const handleError = useCallback((url: string | number) => {
    setLoadErrorPicUrl(url as string)
    setMusicInfo({
      pic: null,
    })
  }, [])

  return (
    <TouchableOpacity onLongPress={handleLongPress} onPress={handlePress} activeOpacity={0.8} >
      <Animated.View style={[styles.container, { transform: [{ rotate }] }]}>
        <Image url={musicInfo.pic} nativeID={NAV_SHEAR_NATIVE_IDS.playDetail_pic} style={styles.image} onError={handleError} />
      </Animated.View>
    </TouchableOpacity>
  )
}


// const styles = StyleSheet.create({
//   playInfoImg: {

//   },
// })
