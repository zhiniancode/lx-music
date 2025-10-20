import { memo, useRef, useEffect, useState } from 'react'
import { View, AppState, ImageBackground, Dimensions, StatusBar, Platform } from 'react-native'

import Header from './components/Header'
import Player from './Player'
import Pic from './Pic'
import Lyric from './Lyric'
import { screenkeepAwake, screenUnkeepAwake } from '@/utils/nativeModules/utils'
import commonState, { type InitState as CommonState } from '@/store/common/state'
import { createStyle } from '@/utils/tools'
import { usePlayMusicInfo } from '@/store/player/hook'
import { scaleSizeW } from '@/utils/pixelRatio'

// global.iskeep = false
export default memo(({ componentId }: { componentId: string }) => {
  const showLyricRef = useRef(true) // 始终显示歌词
  const playMusicInfo = usePlayMusicInfo()
  const [bottomInset, setBottomInset] = useState(0)

  useEffect(() => {
    // 计算底部安全区域（屏幕高度 - 可见区域高度）
    const screenHeight = Dimensions.get('screen').height
    const windowHeight = Dimensions.get('window').height
    const statusBarHeight = StatusBar.currentHeight || 0
    const calculatedBottomInset = screenHeight - windowHeight - statusBarHeight
    
    // 只在Android上设置底部inset，并确保是正数
    if (Platform.OS === 'android' && calculatedBottomInset > 0) {
      setBottomInset(calculatedBottomInset)
    }
  }, [])

  useEffect(() => {
    // 进入播放页面时保持屏幕常亮
    screenkeepAwake()
    
    let appstateListener = AppState.addEventListener('change', (state) => {
      switch (state) {
        case 'active':
          if (!commonState.componentIds.comment) screenkeepAwake()
          break
        case 'background':
          screenUnkeepAwake()
          break
      }
    })

    const handleComponentIdsChange = (ids: CommonState['componentIds']) => {
      if (ids.comment) screenUnkeepAwake()
      else if (AppState.currentState == 'active') screenkeepAwake()
    }

    global.state_event.on('componentIdsUpdated', handleComponentIdsChange)

    return () => {
      global.state_event.off('componentIdsUpdated', handleComponentIdsChange)
      appstateListener.remove()
      screenUnkeepAwake()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <View style={styles.container}>
      {/* 背景图片 */}
      {playMusicInfo.musicInfo?.img ? (
        <ImageBackground
          source={{ uri: playMusicInfo.musicInfo.img }}
          style={styles.backgroundImage}
          blurRadius={50}
        >
          <View style={styles.overlay} />
        </ImageBackground>
      ) : (
        <View style={[styles.backgroundImage, { backgroundColor: '#1a1a1a' }]}>
          <View style={styles.overlay} />
        </View>
      )}
      
      {/* Header 和内容区域 */}
      <View style={styles.content}>
        <Header />
        <Pic componentId={componentId} />
        <Lyric />
      </View>
      
      <Player bottomInset={bottomInset} />
    </View>
  )
})

const styles = createStyle({
  container: {
    flex: 1,
    flexDirection: 'column',
    position: 'relative',
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // 半透明遮罩
  },
  content: {
    flex: 1,
    flexDirection: 'column',
    zIndex: 1,
    position: 'relative',
  },
})
