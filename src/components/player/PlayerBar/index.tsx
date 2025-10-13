import { memo, useMemo, useState, useCallback, useRef } from 'react'
import { View, Modal, TouchableOpacity, FlatList, Animated, PanResponder } from 'react-native'
import { useKeyboard } from '@/utils/hooks'

import Pic from './components/Pic'
import Title from './components/Title'
// import PlayInfo from './components/PlayInfo'
import ControlBtn from './components/ControlBtn'
import { createStyle } from '@/utils/tools'
// import { useSettingValue } from '@/store/setting/hook'
import { useTheme } from '@/store/theme/hook'
import { useSettingValue } from '@/store/setting/hook'
import { usePlayMusicInfo, usePlayInfo } from '@/store/player/hook'
import { getListMusics, removeListMusics } from '@/core/list'
import { useEffect } from 'react'
import { Icon } from '@/components/common/Icon'
import Text from '@/components/common/Text'
import { scaleSizeW } from '@/utils/pixelRatio'
import { playList } from '@/core/player/player'

// 可滑动的播放列表项组件
interface SwipeableItemProps {
  music: LX.Music.MusicInfo
  index: number
  isPlaying: boolean
  theme: any
  onPress: () => void
  onDelete: () => void
}

const SwipeablePlaylistItem = memo(({ music, index, isPlaying, theme, onPress, onDelete }: SwipeableItemProps) => {
  const translateX = useRef(new Animated.Value(0)).current
  const [isDeleting, setIsDeleting] = useState(false)

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // 必须是快速的明确横向滑动
        // 要求：向左滑动超过25px，且横向距离至少是纵向的4倍，且移动速度足够快
        const isLeftSwipe = gestureState.dx < -25 
          && Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 4
          && Math.abs(gestureState.vx) > 0.1  // 需要有一定的滑动速度
        
        // 或者删除按钮已打开，允许向右滑动关闭
        const currentValue = (translateX as any)._value || 0
        const isClosingSwipe = currentValue < -10 && gestureState.dx > 15
        
        return isLeftSwipe || isClosingSwipe
      },
      onMoveShouldSetPanResponderCapture: (_, gestureState) => {
        // 同样严格的判断
        const isLeftSwipe = gestureState.dx < -25 
          && Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 4
          && Math.abs(gestureState.vx) > 0.1
        
        const currentValue = (translateX as any)._value || 0
        const isClosingSwipe = currentValue < -10 && gestureState.dx > 15
        
        return isLeftSwipe || isClosingSwipe
      },
      onPanResponderGrant: () => {
        translateX.stopAnimation()
      },
      onPanResponderMove: (_, gestureState) => {
        const currentValue = (translateX as any)._value || 0
        
        // 向左滑动
        if (gestureState.dx < 0) {
          translateX.setValue(Math.max(gestureState.dx, -80))
        } 
        // 向右滑动，只有在已打开时才允许
        else if (gestureState.dx > 0 && currentValue < 0) {
          translateX.setValue(Math.min(currentValue + gestureState.dx, 0))
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        const currentValue = (translateX as any)._value || 0
        
        // 向左滑动超过40px，展开删除按钮
        if (gestureState.dx < -40) {
          Animated.timing(translateX, {
            toValue: -80,
            duration: 200,
            useNativeDriver: true,
          }).start()
        } 
        // 向右滑动或当前值大于-40，收起删除按钮
        else if (gestureState.dx > 0 || currentValue > -40) {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }).start()
        }
        // 其他情况保持打开
        else {
          Animated.timing(translateX, {
            toValue: -80,
            duration: 200,
            useNativeDriver: true,
          }).start()
        }
      },
    })
  ).current

  const handleDelete = () => {
    setIsDeleting(true)
    Animated.timing(translateX, {
      toValue: -400,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onDelete()
    })
  }

  const handlePress = () => {
    const currentValue = (translateX as any)._value || 0
    // 如果删除按钮已打开，点击收起
    if (currentValue < -10) {
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
      }).start()
    } else {
      // 否则播放歌曲
      onPress()
    }
  }

  if (isDeleting) return null

  return (
    <View style={styles.swipeableContainer} {...panResponder.panHandlers}>
      <View style={styles.deleteBackground}>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDelete}
          activeOpacity={0.7}
        >
          <Icon name="remove" size={20} color="#FFFFFF" />
          <Text size={12} style={{ color: '#FFFFFF', marginTop: 2 }}>删除</Text>
        </TouchableOpacity>
      </View>
      <Animated.View
        style={[
          styles.swipeableContent,
          { 
            transform: [{ translateX }],
            backgroundColor: theme['c-content-background']
          }
        ]}
      >
        <TouchableOpacity
          style={{ 
            ...styles.playlistItem, 
            borderBottomColor: theme['c-border-background'],
            backgroundColor: theme['c-content-background'],
            borderLeftWidth: isPlaying ? 3 : 0,
            borderLeftColor: isPlaying ? theme['c-primary-font'] : 'transparent',
          }}
          activeOpacity={0.9}
          onPress={handlePress}
        >
          {isPlaying && (
            <View style={{ 
              ...styles.playingOverlay, 
              backgroundColor: theme['c-primary-font'],
              opacity: 0.05,
            }} />
          )}
          <View style={styles.playlistItemRank}>
            <Text>
              {index + 1}
            </Text>
          </View>
          <View style={styles.playlistItemInfo}>
            <Text numberOfLines={1}>{music.name}</Text>
            <Text numberOfLines={1} size={12} color={theme['c-font-label']}>
              {music.singer}
            </Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  )
})

export default memo(({ isHome = false }: { isHome?: boolean }) => {
  // const { onLayout, ...layout } = useLayout()
  const { keyboardShown } = useKeyboard()
  const theme = useTheme()
  const autoHidePlayBar = useSettingValue('common.autoHidePlayBar')
  const [showPlaylist, setShowPlaylist] = useState(false)
  const [playlist, setPlaylist] = useState<LX.Music.MusicInfo[]>([])
  const playMusicInfo = usePlayMusicInfo()
  const playInfo = usePlayInfo()
  const slideAnim = useRef(new Animated.Value(500)).current

  // 预加载播放列表数据
  useEffect(() => {
    if (playInfo.playerListId) {
      void getListMusics(playInfo.playerListId).then(setPlaylist)
    }
  }, [playInfo.playerListId])

  // 弹窗动画
  useEffect(() => {
    if (showPlaylist) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        speed: 20,
        bounciness: 0,
      }).start()
    } else {
      slideAnim.setValue(500)
    }
  }, [showPlaylist, slideAnim])

  const handlePlaylistPress = useCallback(() => {
    setShowPlaylist(true)
  }, [])

  const handlePlayMusic = useCallback((index: number) => {
    if (playInfo.playerListId) {
      void playList(playInfo.playerListId, index)
      setShowPlaylist(false)
    }
  }, [playInfo.playerListId])

  const handleDeleteMusic = useCallback(async (music: LX.Music.MusicInfo) => {
    if (!playInfo.playerListId) return
    await removeListMusics(playInfo.playerListId, [music.id])
    // 重新加载播放列表
    const newList = await getListMusics(playInfo.playerListId)
    setPlaylist(newList)
  }, [playInfo.playerListId])

  const playerComponent = useMemo(() => (
    <View style={{ 
      ...styles.container, 
      backgroundColor: theme['c-content-background'],
      borderColor: theme['c-border-background'],
    }}>
      <Pic isHome={isHome} />
      <View style={styles.center}>
        <Title isHome={isHome} />
      </View>
      <View style={styles.right}>
        <ControlBtn onPlaylistPress={handlePlaylistPress} />
      </View>
    </View>
  ), [theme, isHome, handlePlaylistPress])

  // console.log('render pb')

  if (autoHidePlayBar && keyboardShown) return null

  return (
    <>
      {playerComponent}

      {/* 播放列表弹窗 */}
      <Modal
        visible={showPlaylist}
        transparent
        animationType="none"
        onRequestClose={() => setShowPlaylist(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowPlaylist(false)}
        >
          <View style={styles.playlistContainer}>
            <TouchableOpacity
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
              style={{ flex: 1 }}
            >
              <Animated.View
                style={[
                  styles.playlistModal,
                  { 
                    backgroundColor: theme['c-content-background'],
                    transform: [{ translateY: slideAnim }]
                  }
                ]}
              >
              {/* 标题栏 */}
            <View style={{ ...styles.playlistHeader, borderBottomColor: theme['c-border-background'] }}>
              <Text size={18} style={{ fontWeight: 'bold' }}>当前播放列表 ({playlist.length})</Text>
              <TouchableOpacity onPress={() => setShowPlaylist(false)} style={styles.closeButton}>
                <Icon name="close" size={24} color={theme['c-font']} />
              </TouchableOpacity>
            </View>

            {/* 播放列表 */}
            <View style={styles.playlistContent}>
              {playlist.length === 0 ? (
                <View style={styles.emptyPlaylist}>
                  <Icon name="album" size={60} color={theme['c-font-label']} />
                  <Text color={theme['c-font-label']} style={{ marginTop: scaleSizeW(15) }}>
                    播放列表为空
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={playlist}
                  keyExtractor={(item) => item.id}
                  initialNumToRender={15}
                  maxToRenderPerBatch={10}
                  windowSize={5}
                  removeClippedSubviews={true}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: scaleSizeW(20) }}
                  renderItem={({ item: music, index }) => (
                    <SwipeablePlaylistItem
                      music={music}
                      index={index}
                      isPlaying={index === playInfo.playIndex}
                      theme={theme}
                      onPress={() => handlePlayMusic(index)}
                      onDelete={() => handleDeleteMusic(music)}
                    />
                  )}
                />
              )}
            </View>
            </Animated.View>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  )
})


const styles = createStyle({
  container: {
    width: '90%',
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginTop: 4,
    borderRadius: 8,
    borderWidth: 0.5,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  left: {
    flexGrow: 0,
    flexShrink: 0,
  },
  center: {
    flexDirection: 'column',
    flexGrow: 1,
    flexShrink: 1,
    paddingLeft: 8,
    paddingRight: 4,
    justifyContent: 'center',
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    flexGrow: 0,
    flexShrink: 0,
    paddingLeft: 4,
  },
  // 播放列表弹窗样式
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  playlistContainer: {
    flex: 1,
    marginTop: scaleSizeW(80),
  },
  playlistModal: {
    flex: 1,
    borderTopLeftRadius: scaleSizeW(20),
    borderTopRightRadius: scaleSizeW(20),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 20,
  },
  playlistHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scaleSizeW(20),
    paddingVertical: scaleSizeW(16),
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: scaleSizeW(4),
  },
  playlistContent: {
    flex: 1,
    paddingHorizontal: scaleSizeW(10),
  },
  playlistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: scaleSizeW(12),
    paddingHorizontal: scaleSizeW(12),
    borderBottomWidth: 0.5,
    position: 'relative',
  },
  playingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  playlistItemRank: {
    width: scaleSizeW(40),
    alignItems: 'center',
    zIndex: 1,
  },
  playlistItemInfo: {
    flex: 1,
    marginLeft: scaleSizeW(12),
    marginRight: scaleSizeW(10),
    zIndex: 1,
  },
  emptyPlaylist: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: scaleSizeW(60),
  },
  // 滑动删除样式
  swipeableContainer: {
    position: 'relative',
    overflow: 'hidden',
    marginBottom: 0,
  },
  swipeableContent: {
    width: '100%',
    zIndex: 2,
  },
  deleteBackground: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 80,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  deleteButton: {
    width: 80,
    height: '100%',
    backgroundColor: '#ff4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
})
