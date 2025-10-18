import { memo, useState, useCallback, useEffect } from 'react'
import { View, FlatList, TouchableOpacity, ActivityIndicator, Image } from 'react-native'
import Text from '@/components/common/Text'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import { useI18n } from '@/lang'

interface AlbumListProps {
  artistId: number
  artistName: string
}

interface Album {
  id: number | string
  name: string
  picUrl?: string
  size: number
  publishTime: number
  mid?: string // QQ音乐专辑MID
}

const AlbumItem = memo(({ item, onPress }: { item: Album; onPress: () => void }) => {
  const theme = useTheme()

  const formatDate = (timestamp: number) => {
    if (!timestamp) return ''
    const date = new Date(timestamp)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  }

  return (
    <TouchableOpacity
      style={{
        ...styles.item,
        backgroundColor: theme['c-content-background'],
        borderColor: theme['c-border-background'],
      }}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {item.picUrl ? (
        <Image source={{ uri: item.picUrl }} style={styles.cover} />
      ) : (
        <View style={{ ...styles.cover, backgroundColor: theme['c-primary-light-200'] }} />
      )}
      <View style={styles.info}>
        <Text size={15} color={theme['c-font']} numberOfLines={1} weight="bold">
          {item.name}
        </Text>
        <Text size={12} color={theme['c-font-label']} style={styles.meta}>
          {item.size} {item.size > 1 ? '首歌曲' : '首歌曲'}
        </Text>
        {item.publishTime > 0 && (
          <Text size={12} color={theme['c-font-label']} style={styles.date}>
            {formatDate(item.publishTime)}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  )
})

const AlbumList = memo(({ artistId, artistName }: AlbumListProps) => {
  const theme = useTheme()
  const t = useI18n()
  const [albums, setAlbums] = useState<Album[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [offset, setOffset] = useState(0)
  const [sortOrder, setSortOrder] = useState<'time' | 'hot'>('time')

  const loadAlbums = useCallback(async (refresh = false) => {
    if (loading) return
    
    if (refresh) {
      setRefreshing(true)
      setOffset(0)
    } else {
      if (!hasMore) return
      setLoading(true)
    }

    try {
      const { getArtistAlbums } = require('@/core/artist')
      const state = require('@/screens/Home/Views/Artist/state').default
      
      const currentOffset = refresh ? 0 : offset
      
      console.log('💿 Loading albums for artist:', artistId, 'source:', state.source, 'order:', sortOrder)
      
      // 获取歌手专辑
      const result = await getArtistAlbums(state.source, {
        id: artistId,
        limit: 30,
        offset: currentOffset,
        order: sortOrder,
      })
      
      console.log('💿 Got result:', result)
      
      if (!result || result.list.length === 0) {
        console.warn('⚠️ No albums returned for artist:', artistId)
        if (refresh) {
          setAlbums([])
        }
        setHasMore(false)
        return
      }
      
      console.log('💿 Loaded', result.list.length, 'albums')
      
      // 转换为本地格式
      const albumsData: Album[] = result.list.map((album: any) => ({
        id: album.id,
        mid: album.mid, // QQ音乐专辑MID
        name: album.name,
        picUrl: album.picUrl,
        size: album.size || 0,
        publishTime: album.publishTime || 0,
      }))

      if (refresh) {
        setAlbums(albumsData)
      } else {
        // 合并并去重
        setAlbums(prev => {
          const existingIds = new Set(prev.map(a => a.id))
          const newAlbums = albumsData.filter(a => !existingIds.has(a.id))
          return [...prev, ...newAlbums]
        })
      }

      setOffset(currentOffset + result.list.length)
      setHasMore(result.list.length >= 30)
    } catch (error) {
      console.error('❌ Failed to load albums:', error)
      if (refresh) {
        setAlbums([])
      }
      setHasMore(false)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [loading, hasMore, artistId, offset, sortOrder])

  useEffect(() => {
    loadAlbums(true)
  }, [sortOrder])

  const handleAlbumPress = useCallback((album: Album) => {
    console.log('💿 Album pressed:', album.name, 'ID:', album.id)
    const { showAlbumDetailScreen } = require('@/navigation/navigation')
    const state = require('@/screens/Home/Views/Artist/state').default
    const commonState = require('@/store/common/state').default
    // QQ音乐需要传 mid，网易云传 id
    const albumIdentifier = (album as any).mid || album.id
    console.log('💿 Using album identifier:', albumIdentifier)
    showAlbumDetailScreen(commonState.componentIds.home, albumIdentifier, album.name, state.source)
  }, [])

  const renderItem = useCallback(({ item }: { item: Album }) => {
    return <AlbumItem item={item} onPress={() => handleAlbumPress(item)} />
  }, [handleAlbumPress])

  const keyExtractor = useCallback((item: Album, index: number) => {
    return `${item.id}_${index}`
  }, [])

  const renderHeader = useCallback(() => {
    return (
      <View style={styles.header}>
        <View style={styles.sortContainer}>
          <TouchableOpacity
            style={{
              ...styles.sortButton,
              backgroundColor: sortOrder === 'time' 
                ? theme['c-primary-font-active'] 
                : theme['c-content-background'],
              borderColor: theme['c-border-background'],
            }}
            onPress={() => setSortOrder('time')}
            activeOpacity={0.7}
          >
            <Text
              size={13}
              color={sortOrder === 'time' ? '#fff' : theme['c-font']}
            >
              按时间
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              ...styles.sortButton,
              backgroundColor: sortOrder === 'hot' 
                ? theme['c-primary-font-active'] 
                : theme['c-content-background'],
              borderColor: theme['c-border-background'],
            }}
            onPress={() => setSortOrder('hot')}
            activeOpacity={0.7}
          >
            <Text
              size={13}
              color={sortOrder === 'hot' ? '#fff' : theme['c-font']}
            >
              按热度
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }, [sortOrder, theme])

  const renderFooter = useCallback(() => {
    if (!loading) return null
    return (
      <View style={styles.footer}>
        <ActivityIndicator color={theme['c-primary-font-active']} />
      </View>
    )
  }, [loading, theme])

  const renderEmpty = useCallback(() => {
    if (loading || refreshing) return null
    return (
      <View style={styles.empty}>
        <Text color={theme['c-font-label']}>{t('no_item')}</Text>
      </View>
    )
  }, [loading, refreshing, theme, t])

  return (
    <FlatList
      data={albums}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      ListHeaderComponent={renderHeader}
      contentContainerStyle={styles.list}
      onRefresh={() => loadAlbums(true)}
      refreshing={refreshing}
      onEndReached={() => loadAlbums(false)}
      onEndReachedThreshold={0.5}
      ListFooterComponent={renderFooter}
      ListEmptyComponent={renderEmpty}
    />
  )
})

const styles = createStyle({
  list: {
    padding: 12,
  },
  header: {
    paddingVertical: 12,
    paddingBottom: 8,
  },
  sortContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  sortButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  cover: {
    width: 60,
    height: 60,
    borderRadius: 4,
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  meta: {
    marginTop: 4,
  },
  date: {
    marginTop: 2,
  },
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  empty: {
    paddingVertical: 40,
    alignItems: 'center',
  },
})

export default AlbumList

