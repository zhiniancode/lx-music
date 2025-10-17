import { useRef, useState, useCallback, useEffect } from 'react'
import { View, TouchableOpacity, Animated } from 'react-native'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import { Icon } from '@/components/common/Icon'
import Input, { type InputType } from '@/components/common/Input'
import { scaleSizeW } from '@/utils/pixelRatio'
import SourceSelector, { type SourceSelectorType } from '@/components/SourceSelector'
import searchMusicState from '@/store/search/music/state'
import searchSonglistState from '@/store/search/songlist/state'
import { getSearchSetting, saveSearchSetting } from '@/utils/data'
import { addHistoryWord } from '@/core/search/search'
import searchState, { type SearchType } from '@/store/search/state'

interface SearchInfo {
  temp_source: LX.OnlineSource
  source: LX.OnlineSource | 'all'
  searchType: 'music' | 'songlist'
}

export default () => {
  const theme = useTheme()
  const inputRef = useRef<InputType>(null)
  const sourceSelectorRef = useRef<SourceSelectorType>(null)
  const [searchText, setSearchText] = useState('')
  const searchInfo = useRef<SearchInfo>({ temp_source: 'wy', source: 'wy', searchType: 'music' })

  useEffect(() => {
    void getSearchSetting().then(info => {
      searchInfo.current.temp_source = info.temp_source
      searchInfo.current.source = info.source
      searchInfo.current.searchType = info.type
      switch (info.type) {
        case 'music':
          sourceSelectorRef.current?.setSourceList(searchMusicState.sources, info.source)
          break
        case 'songlist':
          sourceSelectorRef.current?.setSourceList(searchSonglistState.sources, info.source)
          break
      }
      setSearchText(searchState.searchText)
    })

    const handleTypeChange = (type: SearchType) => {
      searchInfo.current.searchType = type
      void saveSearchSetting({ type })
    }

    const handleSearchClosed = () => {
      // 搜索关闭时清空输入框并让其失去焦点
      setSearchText('')
      inputRef.current?.clear()
      inputRef.current?.blur() // 让输入框失去焦点，确保下次点击能触发onFocus事件
    }

    global.app_event.on('searchTypeChanged', handleTypeChange)
    global.app_event.on('searchClosed', handleSearchClosed)

    return () => {
      global.app_event.off('searchTypeChanged', handleTypeChange)
      global.app_event.off('searchClosed', handleSearchClosed)
    }
  }, [])

  const handleSourceChange = useCallback((source: any) => {
    searchInfo.current.source = source
    void saveSearchSetting({ source })
  }, [])

  const handleChangeText = useCallback((text: string) => {
    setSearchText(text)
    // 触发搜索建议显示事件
    global.app_event.emit('searchTextChanged', text.trim(), searchInfo.current.source, searchInfo.current.searchType)
  }, [])

  const handleFocus = useCallback(() => {
    // 聚焦时显示搜索建议或历史
    global.app_event.emit('searchInputFocused')
  }, [])

  const handleBlur = useCallback(() => {
    // 延迟隐藏，以便能够点击建议项
    setTimeout(() => {
      global.app_event.emit('searchInputBlurred')
    }, 200)
  }, [])

  const handleSubmit = useCallback(() => {
    const searchValue = searchText.trim()
    if (!searchValue) return
    
    inputRef.current?.blur()
    void addHistoryWord(searchValue)
    
    // 触发搜索事件，让主页面处理搜索结果显示
    global.app_event.emit('performSearch', searchValue, searchInfo.current.source, searchInfo.current.searchType)
  }, [searchText])

  const handleClearText = useCallback(() => {
    setSearchText('')
    inputRef.current?.clear()
    global.app_event.emit('searchTextChanged', '', searchInfo.current.source, searchInfo.current.searchType)
  }, [])

  return (
    <View style={styles.container}>
      {/* 搜索框（包含平台选择器） */}
      <View style={styles.searchInputWrapper}>
        {/* 平台选择器 */}
        <View style={styles.selectorWrapper}>
          <SourceSelector 
            ref={sourceSelectorRef} 
            onSourceChange={handleSourceChange} 
            center 
            minimal
          />
        </View>
        
        {/* 分隔线 */}
        <View style={{ ...styles.divider, backgroundColor: theme['c-primary-dark-100-alpha-300'] }} />
        
        {/* 搜索图标 */}
        <Icon name="search-2" size={16} color={theme['c-primary-dark-100-alpha-500']} style={styles.searchIcon} />
        
        {/* 输入框 */}
        <Input
          ref={inputRef}
          placeholder="搜索歌曲、歌手..."
          value={searchText}
          onChangeText={handleChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onSubmitEditing={handleSubmit}
          clearBtn={false}
          style={styles.input}
          size={13}
        />
        
        {/* 清除按钮 */}
        {searchText.length > 0 && (
          <TouchableOpacity onPress={handleClearText} style={styles.clearBtn}>
            <Icon name="close" size={14} color={theme['c-primary-dark-100-alpha-500']} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

const styles = createStyle({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: scaleSizeW(4),
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: scaleSizeW(18),
    paddingLeft: scaleSizeW(8),
    paddingRight: scaleSizeW(12),
    height: scaleSizeW(36),
  },
  selectorWrapper: {
    // 平台选择器在搜索框内部
  },
  divider: {
    width: 1,
    height: scaleSizeW(20),
    marginHorizontal: scaleSizeW(8),
  },
  searchIcon: {
    marginRight: scaleSizeW(6),
  },
  input: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingVertical: 0,
    height: '100%',
  },
  clearBtn: {
    padding: scaleSizeW(4),
    marginLeft: scaleSizeW(4),
  },
})
