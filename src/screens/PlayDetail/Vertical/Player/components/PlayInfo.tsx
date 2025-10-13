import { memo } from 'react'
import { View } from 'react-native'

import Progress from '@/components/player/ProgressBar'
import Status from './Status'
import { useProgress, usePlayMusicInfo } from '@/store/player/hook'
import { useTheme } from '@/store/theme/hook'
import { createStyle } from '@/utils/tools'
import Text from '@/components/common/Text'
import { useBufferProgress } from '@/plugins/player'
import { scaleSizeW } from '@/utils/pixelRatio'

// const FONT_SIZE = 13

const PlayTimeCurrent = ({ timeStr }: { timeStr: string }) => {
  const theme = useTheme()
  // console.log(timeStr)
  return <Text color={theme['c-500']}>{timeStr}</Text>
}

const PlayTimeMax = memo(({ timeStr }: { timeStr: string }) => {
  const theme = useTheme()
  return <Text color={theme['c-500']}>{timeStr}</Text>
})

export default ({ renderLikeButton }: { renderLikeButton?: () => React.ReactNode }) => {
  const { maxPlayTimeStr, nowPlayTimeStr, progress, maxPlayTime } = useProgress()
  const buffered = useBufferProgress()
  const playMusicInfo = usePlayMusicInfo()
  const theme = useTheme()

  // console.log('render playInfo')

  return (
    <>
      {/* 喜爱按钮 */}
      {renderLikeButton && (
        <View style={styles.likeButtonContainer}>
          {renderLikeButton()}
        </View>
      )}

      <View style={styles.progressContainer}>
        <View style={styles.progress}><Progress progress={progress} duration={maxPlayTime} buffered={buffered} /></View>
        <View style={styles.info}>
          <PlayTimeCurrent timeStr={nowPlayTimeStr} />
          <View style={styles.status} >
            <Status />
          </View>
          <PlayTimeMax timeStr={maxPlayTimeStr} />
        </View>
      </View>
    </>
  )
}


const styles = createStyle({
  likeButtonContainer: {
    alignSelf: 'flex-end',
    paddingBottom: scaleSizeW(10),
  },
  musicInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: scaleSizeW(10),
  },
  musicTextInfo: {
    flex: 1,
    paddingRight: scaleSizeW(10),
  },
  progressContainer: {
    paddingHorizontal: scaleSizeW(15), // 左右各留15的间距
  },
  progress: {
    flexGrow: 1,
    flexShrink: 0,
    flexDirection: 'column',
    justifyContent: 'center',
  },
  info: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    // alignItems: 'center',
    // backgroundColor: '#ccc',
  },
  status: {
    flexGrow: 1,
    flexShrink: 1,
    paddingLeft: 10,
    paddingRight: 10,
  },
})
