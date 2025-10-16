import { View } from 'react-native'
import Aside from './Aside'
import PlayerBar from '@/components/player/PlayerBar'
import StatusBar from '@/components/common/StatusBar'
import SearchView from '../Views/SearchView'
import Header from './Header'
import Main from './Main'
import { createStyle } from '@/utils/tools'
import { usePlayMusicInfo } from '@/store/player/hook'
import { useStatusbarHeight } from '@/store/common/hook'
import { useState, useEffect } from 'react'
import { HEADER_HEIGHT } from '@/config/constant'
import { scaleSizeH } from '@/utils/pixelRatio'
import { setSearchText } from '@/core/search/search'

const styles = createStyle({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  content: {
    flex: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  searchOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
  },
})

export default () => {
  const playMusicInfo = usePlayMusicInfo()
  const hasPlayingMusic = !!playMusicInfo.musicInfo
  const statusBarHeight = useStatusbarHeight()
  const [showSearch, setShowSearch] = useState(false)

  useEffect(() => {
    const handleSearchInputFocused = () => {
      setShowSearch(true)
    }
    
    const handlePerformSearch = () => {
      setShowSearch(true)
    }
    
    const handleSearchClosed = () => {
      setShowSearch(false)
      // 直接清空全局搜索状态，确保下次点击时显示热搜榜
      setSearchText('')
      global.app_event.emit('searchTextChanged', '', 'all', 'music')
    }
    
    global.app_event.on('searchInputFocused', handleSearchInputFocused)
    global.app_event.on('performSearch', handlePerformSearch)
    global.app_event.on('searchClosed', handleSearchClosed)
    
    return () => {
      global.app_event.off('searchInputFocused', handleSearchInputFocused)
      global.app_event.off('performSearch', handlePerformSearch)
      global.app_event.off('searchClosed', handleSearchClosed)
    }
  }, [])

  // 计算搜索视图的顶部位置（header高度 + 状态栏高度）
  const searchViewTop = scaleSizeH(HEADER_HEIGHT) + statusBarHeight

  return (
    <>
      <StatusBar />
      <View style={styles.container}>
        <Aside />
        <View style={styles.content}>
          <Header />
          <Main />
          {hasPlayingMusic && <PlayerBar isHome />}
      {/* 搜索视图 - 显示在搜索栏下方，使用key强制重新挂载 */}
      {showSearch && (
        <View style={{ ...styles.searchOverlay, top: searchViewTop }}>
          <SearchView key={Date.now()} />
        </View>
      )}
        </View>
      </View>
    </>
  )
}
