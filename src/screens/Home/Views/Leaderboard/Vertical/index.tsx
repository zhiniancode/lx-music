import { useCallback, useEffect, useRef, useState } from 'react'
import { BackHandler, View, StyleSheet } from 'react-native'
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
  const [pendingLoadId, setPendingLoadId] = useState<string | null>(null)
  // const [width, setWidth] = useState(0)

  const handleBoundChange = useCallback((source: LX.OnlineSource, id: string) => {
    if (!source || !id) {
      console.error(`❌ [排行榜页面] handleBoundChange 参数错误: source="${source}", id="${id}"`)
      return
    }
    if (musicListRef.current) {
      try {
        musicListRef.current.loadList(source, id)
      } catch (err) {
        console.error(`❌ [排行榜页面] loadList 调用失败:`, err)
      }
    } else {
      console.error(`❌ [排行榜页面] musicListRef.current 是 null！`)
    }
    void saveLeaderboardSetting({
      source,
      boardId: id,
    })
  }, [])
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
      const id = list[0]?.id
      const name = list[0]?.name
      if (id && name) {
        requestAnimationFrame(() => {
          boardsListRef.current?.setList(list, id)
          headerBarRef.current?.setBound(source, id, name ?? 'Unknown')
        })
        // 保存新的音源设置
        void saveLeaderboardSetting({ source, boardId: id })
      }
    })
  }

  const handleSelectBoard = (boardId: string, boardName: string) => {
    // 先保存当前要加载的榜单信息
    boundInfo.current.id = boardId
    
    // 切换到详情视图
    setShowGrid(false)
    headerBarRef.current?.setBound(boundInfo.current.source, boardId, boardName)
    
    // 设置待加载的榜单 ID，会在 useEffect 中处理
    setPendingLoadId(boardId)
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


  // 监听 pendingLoadId 的变化，当 MusicList 渲染后加载数据
  useEffect(() => {
    if (!showGrid && pendingLoadId && musicListRef.current) {
      const source = boundInfo.current.source
      const id = pendingLoadId
      setPendingLoadId(null)
      handleBoundChange(source, id)
    }
  }, [showGrid, pendingLoadId, handleBoundChange])

  // 监听 Android 返回键
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      // 如果当前在详情页（showGrid = false），按返回键返回网格视图
      if (!showGrid) {
        setShowGrid(true)
        return true // 返回 true 表示已处理，阻止默认行为
      }
      // 如果在网格视图，返回 false 让系统处理（退出应用或返回上一页面）
      return false
    })

    return () => backHandler.remove()
  }, [showGrid])

  useEffect(() => {
    const handleFixDrawer = (id: CommonState['navActiveId']) => {
      if (id == 'nav_top') drawer.current?.fixWidth()
    }
    global.state_event.on('navActiveIdUpdated', handleFixDrawer)


    isUnmountedRef.current = false
    void getLeaderboardSetting().then(({ source, boardId }) => {
      // 检查音源是否支持排行榜，如果不支持则使用默认音源
      const supportedSources = ['wy', 'tx'] // 只支持网易云和QQ音乐
      let finalSource = source
      let finalBoardId = boardId
      
      if (!supportedSources.includes(source)) {
        console.warn(`音源 ${source} 不支持排行榜，切换到网易云`)
        finalSource = 'wy'
        finalBoardId = 'wy__3778678' // 网易云热歌榜
        // 保存新的设置
        void saveLeaderboardSetting({ source: finalSource, boardId: finalBoardId })
      }
      
      boundInfo.current.source = finalSource
      boundInfo.current.id = finalBoardId
      void getBoardsList(finalSource).then(list => {
        setBoardsList(list)
        const bound = list.find(l => l.id == finalBoardId)
        boardsListRef.current?.setList(list, finalBoardId)
        headerBarRef.current?.setBound(finalSource, finalBoardId, bound?.name ?? 'Unknown')
      }).catch(err => {
        console.error('获取排行榜列表失败:', err)
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
      <View style={[styles.container, { backgroundColor: theme['c-content-background'] }]}>
        {!showGrid && (
          <HeaderBar ref={headerBarRef} onShowBound={handleBackToGrid} onSourceChange={onSourceChange} />
        )}
        {showGrid ? (
          <BoardsGrid 
            boards={boardsList} 
            onSelectBoard={handleSelectBoard}
            currentSource={boundInfo.current.source}
            onSourceChange={onSourceChange}
          />
        ) : (
          <View style={styles.musicListWrapper}>
            {/* 音乐列表背景装饰 */}
            <View style={StyleSheet.absoluteFillObject}>
              <View style={[styles.musicListGradient1, { backgroundColor: boundInfo.current.source === 'wy' ? 'rgba(255, 107, 157, 0.05)' : 'rgba(79, 195, 247, 0.05)' }]} />
              <View style={[styles.musicListGradient2, { backgroundColor: boundInfo.current.source === 'wy' ? 'rgba(139, 127, 255, 0.04)' : 'rgba(129, 199, 132, 0.04)' }]} />
              <View style={[styles.musicListDecor1, { backgroundColor: boundInfo.current.source === 'wy' ? 'rgba(255, 107, 157, 0.08)' : 'rgba(79, 195, 247, 0.08)' }]} />
              <View style={[styles.musicListDecor2, { backgroundColor: boundInfo.current.source === 'wy' ? 'rgba(139, 127, 255, 0.06)' : 'rgba(129, 199, 132, 0.06)' }]} />
            </View>
            <MusicList ref={musicListRef} />
          </View>
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
  musicListWrapper: {
    flex: 1,
  },
  musicListGradient1: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '60%',
    opacity: 0.8,
  },
  musicListGradient2: {
    position: 'absolute',
    top: '40%',
    left: 0,
    right: 0,
    height: '60%',
    opacity: 0.6,
  },
  musicListDecor1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    top: -50,
    left: -40,
  },
  musicListDecor2: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    bottom: -30,
    right: -30,
  },
  // content: {
  //   flex: 1,
  // },
})
