import { useEffect, useRef } from 'react'
import { View, TouchableOpacity } from 'react-native'
import { createStyle } from '@/utils/tools'

import LeftBar, { type LeftBarType, type LeftBarProps } from './LeftBar'
import MusicList, { type MusicListType } from '../MusicList'
import { getLeaderboardSetting, saveLeaderboardSetting } from '@/utils/data'
import { BorderWidths } from '@/theme'
import { useTheme } from '@/store/theme/hook'
import { Icon } from '@/components/common/Icon'
import Text from '@/components/common/Text'
import { handlePlay } from '../listAction'
import leaderboardState from '@/store/leaderboard/state'


export default () => {
  const leftBarRef = useRef<LeftBarType>(null)
  const musicListRef = useRef<MusicListType>(null)
  const isUnmountedRef = useRef(false)
  const theme = useTheme()

  const handleChangeBound: LeftBarProps['onChangeList'] = (source, id) => {
    musicListRef.current?.loadList(source, id)
    void saveLeaderboardSetting({
      source,
      boardId: id,
    })
  }

  // 播放全部功能
  const handlePlayAll = () => {
    const listDetailInfo = leaderboardState.listDetailInfo
    if (listDetailInfo.list.length > 0) {
      void handlePlay(listDetailInfo.id, listDetailInfo.list, 0)
    }
  }

  useEffect(() => {
    isUnmountedRef.current = false
    void getLeaderboardSetting().then(({ source, boardId }) => {
      leftBarRef.current?.setBound(source, boardId)
      musicListRef.current?.loadList(source, boardId)
    })

    return () => {
      isUnmountedRef.current = true
    }
  }, [])


  return (
    <View style={styles.container}>
      <LeftBar
        ref={leftBarRef}
        onChangeList={handleChangeBound}
      />
      <View style={styles.content}>
        <View style={{ ...styles.header, borderBottomColor: theme['c-border-background'] }}>
          <TouchableOpacity 
            onPress={handlePlayAll}
            style={styles.playAllButton}
          >
            <Icon name="play" size={14} color={theme['c-button-font']} />
            <Text size={13} color={theme['c-button-font']} style={styles.playAllText}>播放全部</Text>
          </TouchableOpacity>
        </View>
        <MusicList
          ref={musicListRef}
        />
      </View>
    </View>
  )
}

const styles = createStyle({
  container: {
    width: '100%',
    flex: 1,
    flexDirection: 'row',
    // borderTopWidth: BorderWidths.normal,
  },
  content: {
    flex: 1,
    flexDirection: 'column',
  },
  header: {
    flexDirection: 'row',
    height: 38,
    alignItems: 'center',
    paddingHorizontal: 10,
    borderBottomWidth: BorderWidths.normal,
  },
  playAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  playAllText: {
    marginLeft: 4,
  },
})
