import { memo, useMemo, useRef } from 'react'
import { View, TouchableOpacity } from 'react-native'
import { Icon } from '@/components/common/Icon'
import { useTheme } from '@/store/theme/hook'
import PlayInfo from './components/PlayInfo'
import { createStyle, toast } from '@/utils/tools'
import { NAV_SHEAR_NATIVE_IDS, MUSIC_TOGGLE_MODE_LIST, MUSIC_TOGGLE_MODE } from '@/config/constant'
import { playNext, playPrev, togglePlay } from '@/core/player/player'
import { useIsPlay, usePlayMusicInfo } from '@/store/player/hook'
import { useI18n } from '@/lang'
import { scaleSizeW } from '@/utils/pixelRatio'
import { useSettingValue } from '@/store/setting/hook'
import { updateSetting } from '@/core/common'
import MusicAddModal, { type MusicAddModalType } from '@/components/MusicAddModal'
import playerState from '@/store/player/state'
import SettingPopup, { type SettingPopupType } from '../../components/SettingPopup'

export default memo(({ bottomInset = 0 }: { bottomInset?: number }) => {
  const theme = useTheme()
  const isPlay = useIsPlay()
  const playMusicInfo = usePlayMusicInfo()
  const t = useI18n()
  const togglePlayMethod = useSettingValue('player.togglePlayMethod')
  const musicAddModalRef = useRef<MusicAddModalType>(null)
  const settingPopupRef = useRef<SettingPopupType>(null)

  // 播放模式图标
  const playModeIcon = useMemo(() => {
    switch (togglePlayMethod) {
      case MUSIC_TOGGLE_MODE.listLoop:
        return 'list-loop'
      case MUSIC_TOGGLE_MODE.random:
        return 'list-random'
      case MUSIC_TOGGLE_MODE.list:
        return 'list-order'
      case MUSIC_TOGGLE_MODE.singleLoop:
        return 'single-loop'
      default:
        return 'single'
    }
  }, [togglePlayMethod])

  // 切换播放模式
  const handleTogglePlayMode = () => {
    let index = MUSIC_TOGGLE_MODE_LIST.indexOf(togglePlayMethod)
    if (++index >= MUSIC_TOGGLE_MODE_LIST.length) index = 0
    const mode = MUSIC_TOGGLE_MODE_LIST[index]
    updateSetting({ 'player.togglePlayMethod': mode })
    let modeName: 'play_list_loop' | 'play_list_random' | 'play_list_order' | 'play_single_loop' | 'play_single'
    switch (mode) {
      case MUSIC_TOGGLE_MODE.listLoop:
        modeName = 'play_list_loop'
        break
      case MUSIC_TOGGLE_MODE.random:
        modeName = 'play_list_random'
        break
      case MUSIC_TOGGLE_MODE.list:
        modeName = 'play_list_order'
        break
      case MUSIC_TOGGLE_MODE.singleLoop:
        modeName = 'play_single_loop'
        break
      default:
        modeName = 'play_single'
        break
    }
    toast(t(modeName))
  }

  // 添加到列表
  const handleShowMusicAddModal = () => {
    const musicInfo = playerState.playMusicInfo.musicInfo
    if (!musicInfo) return
    musicAddModalRef.current?.show({
      musicInfo: 'progress' in musicInfo ? musicInfo.metadata.musicInfo : musicInfo,
      isMove: false,
      listId: playerState.playMusicInfo.listId!,
    })
  }

  const handlePlayPrev = () => {
    void playPrev()
  }

  const handlePlayNext = () => {
    void playNext()
  }

  const handleShowSetting = () => {
    settingPopupRef.current?.show()
  }

  const renderLikeButton = () => (
    <TouchableOpacity 
      style={styles.likeButton} 
      onPress={handleShowMusicAddModal} 
      activeOpacity={0.7}
    >
      <Icon name='add-music' color={theme['c-button-font']} size={22} />
    </TouchableOpacity>
  )

  return (
    <>
      <View style={[styles.container, { paddingBottom: bottomInset }]} nativeID={NAV_SHEAR_NATIVE_IDS.playDetail_player}>
        <PlayInfo renderLikeButton={renderLikeButton} />
        
        {/* 新的控制栏布局 - 5个按钮 */}
        <View style={styles.controlBar}>
          <View style={styles.leftButtons}>
            {/* 播放模式按钮 */}
            <TouchableOpacity style={styles.sideButton} onPress={handleTogglePlayMode} activeOpacity={0.7}>
              <Icon name={playModeIcon} color={theme['c-button-font']} size={24} />
            </TouchableOpacity>

            {/* 上一首 */}
            <TouchableOpacity style={styles.mainButton} onPress={handlePlayPrev} activeOpacity={0.7}>
              <Icon name='prevMusic' color={theme['c-button-font']} size={26} />
            </TouchableOpacity>
          </View>

          {/* 播放/暂停 */}
          <TouchableOpacity 
            style={{ ...styles.mainButton, ...styles.playButton }} 
            onPress={togglePlay} 
            activeOpacity={0.7}
          >
            <Icon name={isPlay ? 'pause' : 'play'} color={theme['c-button-font']} size={28} />
          </TouchableOpacity>

          <View style={styles.rightButtons}>
            {/* 下一首 */}
            <TouchableOpacity style={styles.mainButton} onPress={handlePlayNext} activeOpacity={0.7}>
              <Icon name='nextMusic' color={theme['c-button-font']} size={26} />
            </TouchableOpacity>

            {/* 播放器设置按钮 */}
            <TouchableOpacity style={styles.sideButton} onPress={handleShowSetting} activeOpacity={0.7}>
              <Icon name='slider' color={theme['c-button-font']} size={24} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
      
      <MusicAddModal ref={musicAddModalRef} />
      <SettingPopup ref={settingPopupRef} direction="vertical" />
    </>
  )
})

const styles = createStyle({
  container: {
    flex: 0,
    width: '100%',
    paddingHorizontal: 15,
    paddingBottom: 15, // 增加底部内边距，确保内容不会被裁剪
    paddingTop: 5,
    flexDirection: 'column',
    backgroundColor: 'transparent', // 确保背景透明
  },
  likeButton: {
    width: scaleSizeW(36),
    height: scaleSizeW(36),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: scaleSizeW(18),
    marginBottom: scaleSizeW(4),
  },
  controlBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scaleSizeW(15),
    paddingTop: scaleSizeW(20),
    paddingBottom: scaleSizeW(20), // 增加底部内边距
    width: '100%',
  },
  leftButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(15),
    flex: 1,
    justifyContent: 'flex-start',
  },
  rightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(15),
    flex: 1,
    justifyContent: 'flex-end',
  },
  sideButton: {
    width: scaleSizeW(46),
    height: scaleSizeW(46),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: scaleSizeW(23),
  },
  mainButton: {
    width: scaleSizeW(50),
    height: scaleSizeW(50),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: scaleSizeW(25),
  },
  playButton: {
    width: scaleSizeW(56),
    height: scaleSizeW(56),
    borderRadius: scaleSizeW(28),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
})
