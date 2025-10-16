import { useEffect, useRef, useState } from 'react'
import { View } from 'react-native'
import { createStyle } from '@/utils/tools'

import MusicList, { type MusicListType } from '../MusicList'
import { getLeaderboardSetting, saveLeaderboardSetting } from '@/utils/data'
import DrawerLayoutFixed, { type DrawerLayoutFixedType } from '@/components/common/DrawerLayoutFixed'
import HeaderBar, { type HeaderBarType, type HeaderBarProps } from './HeaderBar'
import { scaleSizeW } from '@/utils/pixelRatio'
import { useTheme } from '@/store/theme/hook'
// import { BorderWidths } from '@/theme'
// import { useTheme } from '@/store/theme/hook'
import BoardsList, { type BoardsListType, type BoardsListProps } from '../BoardsList'
import type { InitState as CommonState } from '@/store/common/state'
import settingState from '@/store/setting/state'
import { getBoardsList } from '@/core/leaderboard'
import { COMPONENT_IDS } from '@/config/constant'
import { handleCollect, handlePlay } from '../listAction'
import boardState from '@/store/leaderboard/state'
import BoardsGrid from './BoardsGrid'


const MAX_WIDTH = scaleSizeW(200)

export default () => {
  const drawer = useRef<DrawerLayoutFixedType>(null)
  const theme = useTheme()
  const musicListRef = useRef<MusicListType>(null)
  const isUnmountedRef = useRef(false)
  const boardsListRef = useRef<BoardsListType>(null)
  const headerBarRef = useRef<HeaderBarType>(null)
  const boundInfo = useRef<{ source: LX.OnlineSource, id: string | null }>({ source: 'wy', id: null })
  const [showGrid, setShowGrid] = useState(true)
  const [boardsList, setBoardsList] = useState<any[]>([])
  // const [width, setWidth] = useState(0)

  const handleBoundChange = (source: LX.OnlineSource, id: string) => {
    musicListRef.current?.loadList(source, id)
    void saveLeaderboardSetting({
      source,
      boardId: id,
    })
  }
  const onBoundChange: BoardsListProps['onBoundChange'] = (id) => {
    boundInfo.current.id = id
    void getBoardsList(boundInfo.current.source).then(list => {
      requestAnimationFrame(() => {
        const bound = list.find(l => l.id == id)
        headerBarRef.current?.setBound(boundInfo.current.source, id, bound?.name ?? 'Unknown')
      })
    })
    handleBoundChange(boundInfo.current.source, id)
    requestAnimationFrame(() => {
      drawer.current?.closeDrawer()
    })
  }
  const onPlay: BoardsListProps['onPlay'] = (id) => {
    boundInfo.current.id = id
    void handlePlay(id, boardState.listDetailInfo.list)
  }
  const onCollect: BoardsListProps['onCollect'] = (id, name) => {
    boundInfo.current.id = id
    void handleCollect(id, name, boundInfo.current.source)
  }
  const onShowBound = () => {
    requestAnimationFrame(() => {
      drawer.current?.openDrawer()
    })
  }
  const onSourceChange: HeaderBarProps['onSourceChange'] = (source) => {
    boundInfo.current.source = source
    setShowGrid(true)
    void getBoardsList(source).then(list => {
      setBoardsList(list)
      const id = list[0].id
      const name = list[0].name
      requestAnimationFrame(() => {
        boardsListRef.current?.setList(list, id)
        headerBarRef.current?.setBound(source, id, name ?? 'Unknown')
      })
    })
  }

  const handleSelectBoard = (boardId: string, boardName: string) => {
    setShowGrid(false)
    headerBarRef.current?.setBound(boundInfo.current.source, boardId, boardName)
    handleBoundChange(boundInfo.current.source, boardId)
  }

  const handleBackToGrid = () => {
    setShowGrid(true)
  }

  const navigationView = () => {
    return (
      <BoardsList
        ref={boardsListRef}
        onBoundChange={onBoundChange}
        onCollect={onCollect}
        onPlay={onPlay}
      />
    )
  }

  // const theme = useTheme()


  useEffect(() => {
    const handleFixDrawer = (id: CommonState['navActiveId']) => {
      if (id == 'nav_top') drawer.current?.fixWidth()
    }
    global.state_event.on('navActiveIdUpdated', handleFixDrawer)


    isUnmountedRef.current = false
    void getLeaderboardSetting().then(({ source, boardId }) => {
      boundInfo.current.source = source
      boundInfo.current.id = boardId
      void getBoardsList(source).then(list => {
        setBoardsList(list)
        const bound = list.find(l => l.id == boardId)
        boardsListRef.current?.setList(list, boardId)
        headerBarRef.current?.setBound(source, boardId, bound?.name ?? 'Unknown')
      })
      // 默认显示网格，不自动加载榜单详情
      // musicListRef.current?.loadList(source, boardId)
    })

    return () => {
      global.state_event.off('navActiveIdUpdated', handleFixDrawer)
      isUnmountedRef.current = true
    }
  }, [])


  return (
    <DrawerLayoutFixed
      ref={drawer}
      visibleNavNames={[COMPONENT_IDS.home]}
      // drawerWidth={width}
      widthPercentage={0.82}
      widthPercentageMax={MAX_WIDTH}
      drawerPosition={settingState.setting['common.drawerLayoutPosition']}
      renderNavigationView={navigationView}
      drawerBackgroundColor={theme['c-content-background']}
      style={{ elevation: 1 }}
    >
      <View style={styles.container}>
        {!showGrid && (
          <HeaderBar ref={headerBarRef} onShowBound={handleBackToGrid} onSourceChange={onSourceChange} />
        )}
        {showGrid ? (
          <BoardsGrid boards={boardsList} onSelectBoard={handleSelectBoard} />
        ) : (
          <MusicList ref={musicListRef} />
        )}
      </View>
    </DrawerLayoutFixed>
    // <View style={styles.container}>
    //   <LeftBar
    //     ref={leftBarRef}
    //     onChangeList={handleChangeBound}
    //   />
    //   <MusicList
    //     ref={musicListRef}
    //   />
    // </View>
  )
}

const styles = createStyle({
  container: {
    width: '100%',
    flex: 1,
    flexDirection: 'column',
    // borderTopWidth: BorderWidths.normal,
  },
  // content: {
  //   flex: 1,
  // },
})
