import Content from './Content'
import PlayerBar from '@/components/player/PlayerBar'
import BottomTabBar from '@/components/common/BottomTabBar'
import { View } from 'react-native'
import { createStyle } from '@/utils/tools'
import { usePlayMusicInfo } from '@/store/player/hook'

export default () => {
  const playMusicInfo = usePlayMusicInfo()
  const hasPlayingMusic = !!playMusicInfo.musicInfo
  
  return (
    <View style={styles.container}>
      <Content />
      {hasPlayingMusic && (
        <View style={styles.playerBarWrapper}>
          <PlayerBar isHome />
        </View>
      )}
      <BottomTabBar />
    </View>
  )
}

const styles = createStyle({
  container: {
    flex: 1,
  },
  playerBarWrapper: {
    marginBottom: 4,
  },
})
