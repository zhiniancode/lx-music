import { forwardRef, useImperativeHandle, useRef, useEffect } from 'react'
import { View, TouchableOpacity } from 'react-native'

// import { useGetter, useDispatch } from '@/store'
// import Tag from './Tag'
// import OpenList from './OpenList'
import { createStyle } from '@/utils/tools'
// import { BorderWidths } from '@/theme'
import SourceSelector, {
  type SourceSelectorType,
} from './SourceSelector'
import { useTheme } from '@/store/theme/hook'
// import { BorderWidths } from '@/theme'
import ActiveListName, { type ActiveListNameType } from './ActiveListName'
import { BorderWidths } from '@/theme'
import leaderboardState from '@/store/leaderboard/state'
import { Icon } from '@/components/common/Icon'
import Text from '@/components/common/Text'
import { handlePlay } from '../../listAction'

export interface HeaderBarProps {
  onShowBound: () => void
  onSourceChange: (source: LX.OnlineSource) => void
  currentSource: LX.OnlineSource
}

export interface HeaderBarType {
  setBound: (source: LX.OnlineSource, id: string, name: string) => void
}


export default forwardRef<HeaderBarType, HeaderBarProps>(({ onShowBound, onSourceChange, currentSource }, ref) => {
  const activeListNameRef = useRef<ActiveListNameType>(null)
  const sourceSelectorRef = useRef<SourceSelectorType>(null)
  const theme = useTheme()

  // 组件挂载时初始化音源列表
  useEffect(() => {
    if (sourceSelectorRef.current && leaderboardState.sources.length > 0) {
      sourceSelectorRef.current.setSource(currentSource)
    }
  }, [currentSource])

  useImperativeHandle(ref, () => ({
    setBound(source, id, name) {
      sourceSelectorRef.current?.setSource(source)
      activeListNameRef.current?.setBound(id, name)
    },
  }), [])

  // 播放全部功能
  const handlePlayAll = () => {
    const listDetailInfo = leaderboardState.listDetailInfo
    if (listDetailInfo.list.length > 0) {
      void handlePlay(listDetailInfo.id, listDetailInfo.list, 0)
    }
  }

  return (
    <View style={{ ...styles.currentList, borderBottomColor: theme['c-border-background'] }}>
      <SourceSelector ref={sourceSelectorRef} onSourceChange={onSourceChange} />
      <ActiveListName ref={activeListNameRef} onShowBound={onShowBound} />
      <TouchableOpacity 
        onPress={handlePlayAll}
        style={styles.playAllButton}
      >
        <Icon name="play" size={14} color={theme['c-button-font']} />
        <Text size={13} color={theme['c-button-font']} style={styles.playAllText}>播放全部</Text>
      </TouchableOpacity>
    </View>
  )
})

const styles = createStyle({
  currentList: {
    flexDirection: 'row',
    height: 38,
    zIndex: 2,
    // paddingRight: 10,
    borderBottomWidth: BorderWidths.normal,
  },
  selector: {
    width: 86,
  },
  playAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 10,
  },
  playAllText: {
    marginLeft: 4,
  },
})
