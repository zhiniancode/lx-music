import { TouchableOpacity } from 'react-native'
import { Icon } from '@/components/common/Icon'
import { useIsPlay } from '@/store/player/hook'
import { useTheme } from '@/store/theme/hook'
import { playNext, playPrev, togglePlay } from '@/core/player/player'
import { createStyle } from '@/utils/tools'
import { useHorizontalMode } from '@/utils/hooks'

const BTN_SIZE = 18
const PLAY_BTN_SIZE = 20

interface ControlBtnProps {
  onPlaylistPress?: () => void
}
const handlePlayPrev = () => {
  void playPrev()
}
const handlePlayNext = () => {
  void playNext()
}

const PlayPrevBtn = () => {
  const theme = useTheme()

  return (
    <TouchableOpacity 
      style={styles.cotrolBtn} 
      activeOpacity={0.7} 
      onPress={handlePlayPrev}
    >
      <Icon name='prevMusic' color={theme['c-font']} size={BTN_SIZE} />
    </TouchableOpacity>
  )
}

const PlayNextBtn = () => {
  const theme = useTheme()

  return (
    <TouchableOpacity 
      style={styles.cotrolBtn} 
      activeOpacity={0.7} 
      onPress={handlePlayNext}
    >
      <Icon name='nextMusic' color={theme['c-font']} size={BTN_SIZE} />
    </TouchableOpacity>
  )
}

const TogglePlayBtn = () => {
  const isPlay = useIsPlay()
  const theme = useTheme()

  return (
    <TouchableOpacity 
      style={styles.playBtn} 
      activeOpacity={0.7} 
      onPress={togglePlay}
    >
      <Icon 
        name={isPlay ? 'pause' : 'play'} 
        color={theme['c-font']} 
        size={PLAY_BTN_SIZE} 
      />
    </TouchableOpacity>
  )
}

const PlaylistBtn = ({ onPress }: { onPress?: () => void }) => {
  const theme = useTheme()

  return (
    <TouchableOpacity 
      style={styles.cotrolBtn} 
      activeOpacity={0.7} 
      onPress={onPress}
    >
      <Icon name='menu' color={theme['c-font']} size={BTN_SIZE} />
    </TouchableOpacity>
  )
}

export default ({ onPlaylistPress }: ControlBtnProps = {}) => {
  const isHorizontalMode = useHorizontalMode()
  return (
    <>
      {/* <TouchableOpacity activeOpacity={0.5} onPress={toggleNextPlayMode}>
        <Text style={{ ...styles.cotrolBtn }}>
          <Icon name={playModeIcon} style={{ color: theme.secondary10 }} size={18} />
        </Text>
      </TouchableOpacity>
    */}
      {/* {btnPrev} */}
      { isHorizontalMode ? <PlayPrevBtn /> : null }
      <TogglePlayBtn />
      <PlayNextBtn />
      <PlaylistBtn onPress={onPlaylistPress} />
    </>
  )
}


const styles = createStyle({
  cotrolBtn: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 2,
  },
  playBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 3,
  },
})
