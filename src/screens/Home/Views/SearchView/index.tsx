import { useRef, useState, useCallback, useEffect } from 'react'
import { View, TouchableOpacity, ScrollView, BackHandler } from 'react-native'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import { Icon } from '@/components/common/Icon'
import Text from '@/components/common/Text'
import { scaleSizeW } from '@/utils/pixelRatio'
import List, { type ListType } from '@/screens/Home/Views/Search/List'
import TipList, { type TipListType } from '@/screens/Home/Views/Search/TipList'
import { getList as getHotSearchList } from '@/core/hotSearch'
import searchState from '@/store/search/state'

export default () => {
  const theme = useTheme()
  const listRef = useRef<ListType>(null)
  const searchTipListRef = useRef<TipListType>(null)
  const layoutHeightRef = useRef<number>(0)
  
  // 初始化时始终显示热搜榜，通过事件动态控制显示内容
  const [searchKeyword, setSearchKeyword] = useState('')
  const [hotSearchList, setHotSearchList] = useState<string[]>([])
  const [showHotSearch, setShowHotSearch] = useState(true) // 默认显示热搜榜
  
  // 标记组件是否刚挂载，用于处理初始搜索状态
  const justMountedRef = useRef(true)

  // 处理返回键
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      // 拦截返回键，关闭搜索视图
      global.app_event.searchClosed()
      return true // 返回true表示已处理，不执行默认行为
    })

    return () => backHandler.remove()
  }, [])

  // 组件挂载时的初始化处理
  useEffect(() => {
    // 加载热搜列表（改为网易云音乐）
    void getHotSearchList('wy').then(list => {
      setHotSearchList(list.slice(0, 20))
    }).catch(err => {
      console.error('加载热搜失败:', err)
    })

    // 检查是否有全局搜索状态，如果有则执行搜索
    const currentSearchText = searchState.searchText?.trim()
    
    if (currentSearchText) {
      setSearchKeyword(currentSearchText)
      setShowHotSearch(false)
      // 延迟一帧确保UI已渲染
      requestAnimationFrame(() => {
        listRef.current?.loadList(currentSearchText, 'all', 'music')
      })
    } else {
      // 没有搜索词，确保显示热搜榜
      setSearchKeyword('')
      setShowHotSearch(true)
    }
    
    justMountedRef.current = false
  }, []) // 只在挂载时执行一次

  // 事件监听器设置（只执行一次，避免重复注册）
  useEffect(() => {
    const handlePerformSearch = (keyword: string, source: any, type: any) => {
      if (!keyword?.trim()) {
        return
      }
      
      // 立即设置搜索状态，确保UI立即响应
      setSearchKeyword(keyword.trim())
      setShowHotSearch(false)
      searchTipListRef.current?.hide()
      
      // 立即加载搜索结果，不延迟
      listRef.current?.loadList(keyword.trim(), source, type)
    }

    const handleSearchTextChanged = (text: string) => {
      if (text.trim()) {
        setShowHotSearch(false)
        setTimeout(() => {
          searchTipListRef.current?.search(text, layoutHeightRef.current)
        }, 300)
      } else {
        // 清空搜索词时，显示热搜榜
        setSearchKeyword('')
        setShowHotSearch(true)
        searchTipListRef.current?.hide()
      }
    }

    const handleSearchInputFocused = () => {
      // 聚焦时根据全局搜索状态决定显示内容
      const currentSearchText = searchState.searchText?.trim()
      
      if (!currentSearchText) {
        // 没有搜索词，确保显示热搜榜
        setSearchKeyword('')
        setShowHotSearch(true)
      } else {
        // 有搜索词，显示搜索结果
        setSearchKeyword(currentSearchText)
        setShowHotSearch(false)
        setTimeout(() => {
          listRef.current?.loadList(currentSearchText, 'all', 'music')
        }, 100)
      }
      setTimeout(() => {
        searchTipListRef.current?.show(layoutHeightRef.current)
      }, 200)
    }

    const handleSearchInputBlurred = () => {
      // 延迟隐藏以允许点击搜索建议
      setTimeout(() => {
        searchTipListRef.current?.hide()
      }, 200)
    }

    // 注册事件监听器
    global.app_event.on('performSearch', handlePerformSearch)
    global.app_event.on('searchTextChanged', handleSearchTextChanged)
    global.app_event.on('searchInputFocused', handleSearchInputFocused)
    global.app_event.on('searchInputBlurred', handleSearchInputBlurred)

    return () => {
      // 清理事件监听器
      global.app_event.off('performSearch', handlePerformSearch)
      global.app_event.off('searchTextChanged', handleSearchTextChanged)
      global.app_event.off('searchInputFocused', handleSearchInputFocused)
      global.app_event.off('searchInputBlurred', handleSearchInputBlurred)
    }
  }, []) // 空依赖数组，只执行一次

  const handleHotSearchClick = useCallback((keyword: string) => {
    global.app_event.performSearch(keyword, 'all', 'music')
  }, [])

  const handleSearch = useCallback((keyword: string) => {
    global.app_event.performSearch(keyword, 'all', 'music')
  }, [])

  const handleLayout = (e: any) => {
    layoutHeightRef.current = e.nativeEvent.layout.height
  }

  // 获取排名对应的颜色
  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return '#FF6B6B'  // 第一名红色
      case 2: return '#FF9F43'  // 第二名橙色  
      case 3: return '#FFC107'  // 第三名黄色
      default: return theme['c-font-label']
    }
  }

  return (
    <View style={{ ...styles.container, backgroundColor: theme['c-content-background'] }}>
      {/* 热搜榜单 */}
      {showHotSearch && (
        <View style={{ ...styles.hotSearchPanel, backgroundColor: theme['c-content-background'] }}>
          {/* 标题区域 */}
          <View style={{ ...styles.hotSearchHeader, backgroundColor: theme['c-content-background'] }}>
            <View style={styles.titleContainer}>
              <View style={styles.iconContainer}>
                <Icon name="leaderboard" size={22} color="#FF6B6B" />
              </View>
              <Text size={18} style={{ fontWeight: 'bold', marginLeft: scaleSizeW(12), color: theme['c-primary-font'] }}>
                热搜榜
              </Text>
              <View style={styles.hotBadge}>
                <Text size={10} style={{ color: '#FFFFFF', fontWeight: 'bold' }}>HOT</Text>
              </View>
            </View>
            <View style={{ ...styles.divider, backgroundColor: theme['c-border-background'] }} />
          </View>

          {/* 热搜列表 */}
          <ScrollView 
            style={styles.hotSearchList} 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.hotSearchContent}
          >
            {hotSearchList.map((keyword, index) => {
              const rank = index + 1
              const isTopThree = rank <= 3
              
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.hotSearchItem,
                    { borderBottomColor: theme['c-border-background'] },
                    isTopThree && styles.topRankItem
                  ]}
                  onPress={() => handleHotSearchClick(keyword)}
                  activeOpacity={0.7}
                >
                  {/* 排名标识 */}
                  <View style={[
                    styles.rankContainer,
                    isTopThree ? { ...styles.topRankContainer, backgroundColor: getRankColor(rank) } : styles.normalRankContainer
                  ]}>
                    <Text 
                      size={isTopThree ? 13 : 12}
                      style={{ 
                        color: isTopThree ? '#FFFFFF' : getRankColor(rank),
                        fontWeight: 'bold'
                      }}
                    >
                      {rank}
                    </Text>
                  </View>

                  {/* 搜索词 */}
                  <Text 
                    numberOfLines={1} 
                    size={15}
                    style={[
                      styles.keywordText,
                      { 
                        color: theme['c-primary-font'],
                        fontWeight: isTopThree ? '600' : 'normal'
                      }
                    ]}
                  >
                    {keyword}
                  </Text>

                  {/* 火热图标 */}
                  {isTopThree && (
                    <View style={styles.fireIcon}>
                      <Icon name="leaderboard" size={16} color="#FF6B6B" />
                    </View>
                  )}

                  {/* 箭头图标 */}
                  <View style={styles.arrowIcon}>
                    <Icon name="chevron-right" size={14} color={theme['c-font-label']} />
                  </View>
                </TouchableOpacity>
              )
            })}
            
            {/* 底部渐变遮罩 */}
            <View style={styles.bottomGradient} />
          </ScrollView>
        </View>
      )}

      {/* 搜索结果 */}
      {!showHotSearch && searchKeyword && (
        <View style={styles.searchResultPanel}>
          <View style={styles.resultContent} onLayout={handleLayout}>
            <TipList ref={searchTipListRef} onSearch={handleSearch} />
            <List ref={listRef} onSearch={handleSearch} />
          </View>
        </View>
      )}

      {/* 搜索建议（无搜索词时） */}
      {!showHotSearch && !searchKeyword && (
        <View style={styles.tipPanel} onLayout={handleLayout}>
          <TipList ref={searchTipListRef} onSearch={handleSearch} />
        </View>
      )}
    </View>
  )
}

const styles = createStyle({
  container: {
    flex: 1,
  },
  hotSearchPanel: {
    flex: 1,
    padding: scaleSizeW(15),
  },
  hotSearchHeader: {
    marginBottom: scaleSizeW(20),
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scaleSizeW(15),
  },
  iconContainer: {
    width: scaleSizeW(28),
    height: scaleSizeW(28),
    borderRadius: scaleSizeW(14),
    backgroundColor: '#FFF0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hotBadge: {
    backgroundColor: '#FF6B6B',
    borderRadius: scaleSizeW(8),
    paddingHorizontal: scaleSizeW(6),
    paddingVertical: scaleSizeW(2),
    marginLeft: scaleSizeW(8),
  },
  divider: {
    height: 1,
    opacity: 0.1,
  },
  hotSearchList: {
    flex: 1,
  },
  hotSearchContent: {
    paddingBottom: scaleSizeW(20),
  },
  hotSearchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: scaleSizeW(15),
    paddingHorizontal: scaleSizeW(12),
    borderBottomWidth: 0.5,
    borderRadius: scaleSizeW(8),
    marginBottom: scaleSizeW(2),
  },
  topRankItem: {
    backgroundColor: 'rgba(255, 107, 107, 0.05)',
  },
  rankContainer: {
    width: scaleSizeW(24),
    height: scaleSizeW(24),
    borderRadius: scaleSizeW(12),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scaleSizeW(15),
  },
  topRankContainer: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  normalRankContainer: {
    backgroundColor: 'transparent',
  },
  keywordText: {
    flex: 1,
    marginRight: scaleSizeW(8),
  },
  fireIcon: {
    marginRight: scaleSizeW(8),
  },
  arrowIcon: {
    opacity: 0.6,
  },
  bottomGradient: {
    height: scaleSizeW(30),
    marginTop: scaleSizeW(10),
  },
  searchResultPanel: {
    flex: 1,
  },
  resultContent: {
    flex: 1,
  },
  tipPanel: {
    flex: 1,
  },
})

