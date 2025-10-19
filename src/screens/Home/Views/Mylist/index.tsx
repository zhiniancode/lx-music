import { useState, useEffect, useMemo, useCallback, useRef, memo } from 'react'
import { View, FlatList, TouchableOpacity } from 'react-native'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import { Icon } from '@/components/common/Icon'
import Text from '@/components/common/Text'
import listState from '@/store/list/state'
import { useActiveListId } from '@/store/list/hook'
import { useSettingValue } from '@/store/setting/hook'
import { useI18n } from '@/lang'

// 导入列表菜单相关组件
import ListMenu, { type ListMenuType } from './MyList/ListMenu'
import ListNameEdit, { type ListNameEditType } from './MyList/ListNameEdit'
import ListMusicSort, { type ListMusicSortType } from './MyList/ListMusicSort'
import DuplicateMusic, { type DuplicateMusicType } from './MyList/DuplicateMusic'
import ListImportExport, { type ListImportExportType } from './MyList/ListImportExport'
import { handleRemove as handleListRemove, handleSync } from './MyList/listAction'

// 导入歌曲菜单相关组件
import MusicListMenu, { type ListMenuType as MusicListMenuType } from './MusicList/ListMenu'
import MusicAddModal, { type MusicAddModalType } from '@/components/MusicAddModal'
import MusicMultiAddModal, { type MusicMultiAddModalType } from '@/components/MusicMultiAddModal'
import MusicPositionModal, { type MusicPositionModalType } from './MusicList/MusicPositionModal'
import MusicToggleModal, { type MusicToggleModalType } from './MusicList/MusicToggleModal'
import MetadataEditModal, { type MetadataEditModalType } from '@/components/MetadataEditModal'
import { 
  handlePlay, 
  handlePlayLater, 
  handleRemove, 
  handleUpdateMusicPosition, 
  handleUpdateMusicInfo,
  handleShare,
  handleShowMusicSourceDetail,
  handleDislikeMusic,
} from './MusicList/listAction'
import { copyToClipboard } from '@/utils/tools'

// 列表项组件 - 带设置按钮
const ListItemComponent = memo(({
  list,
  isExpanded,
  isActive,
  musicCount,
  listIndex,
  theme,
  onToggle,
  onShowMenu
}: {
  list: LX.List.MyListInfo
  isExpanded: boolean
  isActive: boolean
  musicCount: number
  listIndex: number
  theme: any
  onToggle: (listId: string) => void
  onShowMenu: (list: LX.List.MyListInfo, index: number, position: { x: number, y: number, w: number, h: number }) => void
}) => {
  const moreButtonRef = useRef<TouchableOpacity>(null)

  const handleShowMenu = useCallback(() => {
    if (moreButtonRef.current?.measure) {
      moreButtonRef.current.measure((fx, fy, width, height, px, py) => {
        onShowMenu(list, listIndex, { 
          x: Math.ceil(px), 
          y: Math.ceil(py), 
          w: Math.ceil(width), 
          h: Math.ceil(height) 
        })
      })
    }
  }, [list, listIndex, onShowMenu])

  return (
    <View 
      style={{
        ...styles.listItem,
        backgroundColor: theme['c-content-background'],
      }}
    >
      <TouchableOpacity
        style={styles.listHeader}
        onPress={() => onToggle(list.id)}
        activeOpacity={0.6}
      >
        <View style={styles.listTitleRow}>
          <Icon 
            name="chevron-right" 
            size={16} 
            color={theme['c-font-label']}
            style={{
              transform: [{ rotate: isExpanded ? '90deg' : '0deg' }],
              marginRight: 8,
            }}
          />
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
            <Text 
              size={16} 
              color={theme['c-font']} 
              weight="bold"
            >
              {list.name}
            </Text>
            {musicCount > 0 && (
              <Text size={13} color={theme['c-font-label']} style={{ marginLeft: 4 }}>
                ({musicCount})
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        ref={moreButtonRef}
        style={styles.listMoreBtn}
        onPress={handleShowMenu}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Icon name="dots-vertical" size={16} color={theme['c-350']} />
      </TouchableOpacity>
    </View>
  )
})

// 歌曲项组件 - 带设置按钮
const MusicItem = memo(({ 
  music, 
  musicIndex, 
  listId,
  theme,
  onShowMusicMenu
}: { 
  music: LX.Music.MusicInfo
  musicIndex: number
  listId: string
  theme: any
  onShowMusicMenu: (music: LX.Music.MusicInfo, index: number, position: { x: number, y: number, w: number, h: number }) => void
}) => {
  const moreButtonRef = useRef<TouchableOpacity>(null)

  const handlePlayMusic = useCallback(() => {
    const { playList } = require('@/core/player/player')
    playList(listId, musicIndex)
  }, [listId, musicIndex])

  const handleShowMenu = useCallback(() => {
    if (moreButtonRef.current?.measure) {
      moreButtonRef.current.measure((fx, fy, width, height, px, py) => {
        onShowMusicMenu(music, musicIndex, { 
          x: Math.ceil(px), 
          y: Math.ceil(py), 
          w: Math.ceil(width), 
          h: Math.ceil(height) 
        })
      })
    }
  }, [music, musicIndex, onShowMusicMenu])

  return (
    <View style={styles.musicItemContainer}>
      <TouchableOpacity
        style={{
          ...styles.musicItem,
          backgroundColor: theme['c-content-background'],
          borderColor: theme['c-border-background'],
        }}
        activeOpacity={0.8}
        onPress={handlePlayMusic}
      >
        <Text size={13} color={theme['c-font-label']} style={styles.musicIndex}>
          {musicIndex + 1}
        </Text>
        <View style={styles.musicInfo}>
          <Text size={14} color={theme['c-font']} numberOfLines={1}>
            {music.name}
          </Text>
          {music.singer && (
            <Text size={12} color={theme['c-font-label']} numberOfLines={1} style={{ marginTop: 3 }}>
              {music.singer}
            </Text>
          )}
        </View>
        <TouchableOpacity
          ref={moreButtonRef}
          style={styles.moreButton}
          onPress={handleShowMenu}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Icon name="dots-vertical" size={16} color={theme['c-350']} />
        </TouchableOpacity>
      </TouchableOpacity>
    </View>
  )
})

export default () => {
  const theme = useTheme()
  const t = useI18n()
  const langId = useSettingValue('common.langId')
  const [expandedListId, setExpandedListId] = useState<string | null>(null)
  const [listMusicCounts, setListMusicCounts] = useState<Record<string, number>>({})
  // 缓存已加载的歌曲列表
  const [cachedMusicLists, setCachedMusicLists] = useState<Record<string, LX.Music.MusicInfo[]>>({})
  const activeListId = useActiveListId()
  const loadingRef = useRef<Set<string>>(new Set())
  
  // 监听用户列表变化
  const [userList, setUserList] = useState(listState.userList)
  
  // 列表菜单相关的refs
  const listMenuRef = useRef<ListMenuType>(null)
  const listNameEditRef = useRef<ListNameEditType>(null)
  const listMusicSortRef = useRef<ListMusicSortType>(null)
  const duplicateMusicRef = useRef<DuplicateMusicType>(null)
  const listImportExportRef = useRef<ListImportExportType>(null)
  
  // 歌曲菜单相关的refs
  const musicListMenuRef = useRef<MusicListMenuType>(null)
  const musicAddModalRef = useRef<MusicAddModalType>(null)
  const musicMultiAddModalRef = useRef<MusicMultiAddModalType>(null)
  const musicPositionModalRef = useRef<MusicPositionModalType>(null)
  const musicToggleModalRef = useRef<MusicToggleModalType>(null)
  const metadataEditModalRef = useRef<MetadataEditModalType>(null)
  const isMoveRef = useRef(false)
  
  // 使用 useMemo 缓存列表数组，避免不必要的重新渲染
  const allLists = useMemo(() => [
    { ...listState.tempList, name: t('list_name_temp'), icon: 'music_time' },
    { ...listState.defaultList, name: t('list_name_default'), icon: 'play-outline' },
    { ...listState.loveList, name: t('list_name_love'), icon: 'love' },
    ...userList.map(l => ({ ...l, icon: 'album' })),
  ], [t, langId, userList])
  
  // 按需加载歌曲列表
  const loadMusicList = useCallback(async (listId: string) => {
    // 如果已经在加载中或已缓存，跳过
    if (loadingRef.current.has(listId) || cachedMusicLists[listId]) {
      return
    }

    loadingRef.current.add(listId)
    try {
      const { getListMusics } = require('@/core/list')
      const musics = await getListMusics(listId)
      setCachedMusicLists(prev => ({
        ...prev,
        [listId]: musics
      }))
    } finally {
      loadingRef.current.delete(listId)
    }
  }, [cachedMusicLists])

  // 监听用户列表本身的变化（新建、删除、重命名等）
  useEffect(() => {
    const handleMylistUpdate = () => {
      setUserList([...listState.userList])
    }
    
    global.state_event.on('mylistUpdated', handleMylistUpdate)
    
    return () => {
      global.state_event.off('mylistUpdated', handleMylistUpdate)
    }
  }, [])

  // 获取每个列表的歌曲数量（只加载数量，不加载完整数据）
  useEffect(() => {
    const loadCounts = async () => {
      const { getListMusics } = require('@/core/list')
      const counts: Record<string, number> = {}
      // 使用 Promise.all 并行加载，提高性能
      const countPromises = allLists.map(async (list) => {
        const musics = await getListMusics(list.id)
        return { id: list.id, count: musics.length }
      })
      const results = await Promise.all(countPromises)
      results.forEach(({ id, count }) => {
        counts[id] = count
      })
      setListMusicCounts(counts)
    }
    
    loadCounts()
    
    // 监听列表内歌曲更新事件
    const handleListUpdate = (updatedListIds: string[]) => {
      // 清除已更新列表的缓存
      if (updatedListIds && updatedListIds.length > 0) {
        setCachedMusicLists(prev => {
          const newCache = { ...prev }
          updatedListIds.forEach(id => {
            delete newCache[id]
          })
          return newCache
        })
        
        const { getListMusics } = require('@/core/list')
        Promise.all(
          updatedListIds.map(async (id) => {
            const musics = await getListMusics(id)
            return { id, count: musics.length, musics }
          })
        ).then((results) => {
          setListMusicCounts(prev => {
            const newCounts = { ...prev }
            results.forEach(({ id, count }) => {
              newCounts[id] = count
            })
            return newCounts
          })
          // 如果展开的列表被更新，重新加载它
          results.forEach(({ id, musics }) => {
            if (id === expandedListId) {
              setCachedMusicLists(prev => ({
                ...prev,
                [id]: musics
              }))
            }
          })
        })
      } else {
        loadCounts()
        setCachedMusicLists({})
      }
    }
    
    global.app_event.on('myListMusicUpdate', handleListUpdate)
    
    return () => {
      global.app_event.off('myListMusicUpdate', handleListUpdate)
    }
  }, [allLists, expandedListId])
  
  const toggleList = useCallback((listId: string) => {
    const newExpandedId = expandedListId === listId ? null : listId
    setExpandedListId(newExpandedId)
    
    // 如果展开了新列表，立即加载其歌曲
    if (newExpandedId && !cachedMusicLists[newExpandedId]) {
      loadMusicList(newExpandedId)
    }
    
    // 切换活动列表
    const { setActiveList } = require('@/core/list')
    setActiveList(listId)
  }, [expandedListId, cachedMusicLists, loadMusicList])

  // 构建扁平化的数据结构，避免嵌套 FlatList
  const flatData = useMemo(() => {
    const items: Array<{ type: 'list' | 'music' | 'empty', data: any, listId?: string, musicIndex?: number }> = []
    
    allLists.forEach((list) => {
      // 添加列表头
      items.push({
        type: 'list',
        data: list,
      })
      
      // 如果列表展开，添加歌曲项
      if (expandedListId === list.id) {
        const musics = cachedMusicLists[list.id] || []
        if (musics.length > 0) {
          musics.forEach((music, index) => {
            items.push({
              type: 'music',
              data: music,
              listId: list.id,
              musicIndex: index,
            })
          })
        } else {
          items.push({
            type: 'empty',
            data: null,
          })
        }
      }
    })
    
    return items
  }, [allLists, expandedListId, cachedMusicLists])

  // 显示列表菜单
  const handleShowListMenu = useCallback((list: LX.List.MyListInfo, index: number, position: { x: number, y: number, w: number, h: number }) => {
    listMenuRef.current?.show({ listInfo: list, index }, position)
  }, [])

  // 显示歌曲菜单
  const handleShowMusicMenu = useCallback((music: LX.Music.MusicInfo, index: number, position: { x: number, y: number, w: number, h: number }) => {
    if (!expandedListId) return
    musicListMenuRef.current?.show({
      musicInfo: music,
      selectedList: [],
      index,
      listId: expandedListId,
      single: true
    }, position)
  }, [expandedListId])

  // 渲染不同类型的项目
  const renderItem = useCallback(({ item }: { item: any }) => {
    if (item.type === 'list') {
      const list = item.data
      const isExpanded = expandedListId === list.id
      const isActive = activeListId === list.id
      const musicCount = listMusicCounts[list.id] || 0
      const listIndex = allLists.findIndex(l => l.id === list.id)
      
      return (
        <ListItemComponent
          list={list}
          isExpanded={isExpanded}
          isActive={isActive}
          musicCount={musicCount}
          listIndex={listIndex}
          theme={theme}
          onToggle={toggleList}
          onShowMenu={handleShowListMenu}
        />
      )
    } else if (item.type === 'music') {
      return (
        <MusicItem 
          music={item.data} 
          musicIndex={item.musicIndex!} 
          listId={item.listId!}
          theme={theme}
          onShowMusicMenu={handleShowMusicMenu}
        />
      )
    } else if (item.type === 'empty') {
      return (
        <View style={{ ...styles.emptyView, backgroundColor: theme['c-content-background'] }}>
          <Text size={13} color={theme['c-font-label']}>
            暂无歌曲
          </Text>
        </View>
      )
    }
    return null
  }, [theme, expandedListId, activeListId, listMusicCounts, toggleList, allLists, handleShowListMenu, handleShowMusicMenu])

  const getItemKey = useCallback((item: any, index: number) => {
    if (item.type === 'list') {
      return `list-${item.data.id}`
    } else if (item.type === 'music') {
      return `music-${item.data.id}`
    }
    return `empty-${index}`
  }, [])

  // 歌曲菜单处理函数
  const handleMusicPlay = useCallback((info: any) => {
    handlePlay(info.listId, info.index)
  }, [])

  const handleMusicPlayLater = useCallback((info: any) => {
    handlePlayLater(info.listId, info.musicInfo, info.selectedList, () => {})
  }, [])

  const handleMusicAdd = useCallback((info: any) => {
    isMoveRef.current = false
    musicAddModalRef.current?.show({ musicList: [info.musicInfo] })
  }, [])

  const handleMusicMove = useCallback((info: any) => {
    isMoveRef.current = true
    musicAddModalRef.current?.show({ musicList: [info.musicInfo] })
  }, [])

  const handleEditMetadata = useCallback((info: any) => {
    metadataEditModalRef.current?.show(info.musicInfo)
  }, [])

  const handleCopyName = useCallback((info: any) => {
    void copyToClipboard(`${info.musicInfo.name} - ${info.musicInfo.singer}`)
  }, [])

  const handleChangePosition = useCallback((info: any) => {
    musicPositionModalRef.current?.show({ listInfo: { listId: info.listId, musicInfo: info.musicInfo, selectedList: info.selectedList } })
  }, [])

  const handleToggleSource = useCallback((info: any) => {
    musicToggleModalRef.current?.show({ musicInfo: info.musicInfo, listId: info.listId })
  }, [])

  const handleMusicSourceDetail = useCallback((info: any) => {
    void handleShowMusicSourceDetail(info.musicInfo)
  }, [])

  const handleDislikeMusic = useCallback((info: any) => {
    void handleDislikeMusic(info.musicInfo)
  }, [])

  const handleMusicRemove = useCallback((info: any) => {
    handleRemove(info.listId, info.musicInfo, info.selectedList, () => {})
  }, [])

  const handleMusicAdded = useCallback(() => {
    if (isMoveRef.current && expandedListId) {
      // 如果是移动操作，刷新当前列表
      setCachedMusicLists(prev => {
        const newCache = { ...prev }
        delete newCache[expandedListId]
        return newCache
      })
      loadMusicList(expandedListId)
    }
  }, [expandedListId, loadMusicList])

  const handleUpdateMetadata = useCallback((musicInfo: any, newInfo: any) => {
    if (expandedListId) {
      handleUpdateMusicInfo(expandedListId, musicInfo, newInfo)
    }
  }, [expandedListId])

  const handleUpdatePosition = useCallback((info: any, position: number) => {
    handleUpdateMusicPosition(position, info.listId, info.musicInfo, info.selectedList, () => {})
  }, [])

  return (
    <>
      <FlatList
        style={{ ...styles.container, backgroundColor: theme['c-primary-background'] }}
        data={flatData}
        keyExtractor={getItemKey}
        renderItem={renderItem}
        initialNumToRender={20}
        maxToRenderPerBatch={15}
        windowSize={7}
        removeClippedSubviews={true}
      />
      
      {/* 列表菜单相关组件 */}
      <ListNameEdit ref={listNameEditRef} />
      <ListMusicSort ref={listMusicSortRef} />
      <DuplicateMusic ref={duplicateMusicRef} />
      <ListImportExport ref={listImportExportRef} />
      <ListMenu
        ref={listMenuRef}
        onNew={index => listNameEditRef.current?.showCreate(index)}
        onRename={info => listNameEditRef.current?.show(info)}
        onSort={info => listMusicSortRef.current?.show(info)}
        onDuplicateMusic={info => duplicateMusicRef.current?.show(info)}
        onImport={(info, position) => listImportExportRef.current?.import(info, position)}
        onExport={(info, position) => listImportExportRef.current?.export(info, position)}
        onRemove={info => { handleListRemove(info) }}
        onSync={info => { handleSync(info) }}
        onSelectLocalFile={(info, position) => listImportExportRef.current?.selectFile(info, position)}
      />

      {/* 歌曲菜单相关组件 */}
      <MusicAddModal ref={musicAddModalRef} onAdded={handleMusicAdded} />
      <MusicPositionModal ref={musicPositionModalRef} onUpdatePosition={handleUpdatePosition} />
      <MusicToggleModal ref={musicToggleModalRef} />
      <MetadataEditModal ref={metadataEditModalRef} onSave={handleUpdateMetadata} />
      <MusicListMenu
        ref={musicListMenuRef}
        onPlay={handleMusicPlay}
        onPlayLater={handleMusicPlayLater}
        onAdd={handleMusicAdd}
        onMove={handleMusicMove}
        onEditMetadata={handleEditMetadata}
        onCopyName={handleCopyName}
        onChangePosition={handleChangePosition}
        onToggleSource={handleToggleSource}
        onMusicSourceDetail={handleMusicSourceDetail}
        onDislikeMusic={handleDislikeMusic}
        onRemove={handleMusicRemove}
      />
    </>
  )
}

const styles = createStyle({
  container: {
    flex: 1,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  listHeader: {
    flex: 1,
    flexDirection: 'column',
  },
  listTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listMoreBtn: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  musicList: {
    paddingBottom: 8,
    paddingHorizontal: 12,
  },
  // 歌曲项容器
  musicItemContainer: {
    marginBottom: 8,
    marginHorizontal: 4,
  },
  // 歌曲项 - 圆角矩形卡片
  musicItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 60,
    borderRadius: 8,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  musicIndex: {
    width: 32,
    textAlign: 'center',
  },
  musicInfo: {
    flex: 1,
    marginLeft: 8,
    marginRight: 8,
  },
  moreButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyView: {
    padding: 24,
    alignItems: 'center',
  },
})
