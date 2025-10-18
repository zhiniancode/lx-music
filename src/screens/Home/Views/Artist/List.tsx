import { memo, useState, useCallback, useEffect, useRef } from 'react'
import { FlatList, View, TouchableOpacity, ActivityIndicator, Image } from 'react-native'
import Text from '@/components/common/Text'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import { useI18n } from '@/lang'
import { getArtistState } from './state'
import { navigateToArtistDetail } from './utils'

interface Artist {
  id: number
  name: string
  picUrl?: string
  albumSize?: number
}

const ArtistItem = memo(({ item }: { item: Artist }) => {
  const theme = useTheme()

  const handlePress = useCallback(() => {
    navigateToArtistDetail(item.id, item.name)
  }, [item])

  return (
    <TouchableOpacity
      style={{
        ...styles.item,
        backgroundColor: theme['c-content-background'],
        borderColor: theme['c-border-background'],
      }}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {item.picUrl ? (
        <Image source={{ uri: item.picUrl }} style={styles.avatar} />
      ) : (
        <View style={{ ...styles.avatar, backgroundColor: theme['c-primary-light-200'] }} />
      )}
      <View style={styles.info}>
        <Text size={15} color={theme['c-font']} numberOfLines={1}>
          {item.name}
        </Text>
      </View>
    </TouchableOpacity>
  )
})

const List = memo(() => {
  const theme = useTheme()
  const t = useI18n()
  const [artists, setArtists] = useState<Artist[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const pageRef = useRef(1)

  const loadArtists = useCallback(async (refresh = false) => {
    if (loading) return
    
    if (refresh) {
      setRefreshing(true)
      pageRef.current = 1
    } else {
      if (!hasMore) return
      setLoading(true)
    }

    try {
      const state = getArtistState()
      const { getArtistList } = require('@/core/artist')
      
      console.log('🎵 Loading artists with source:', state.source)
      
      const result = await getArtistList(state.source, {
        type: state.type,
        area: state.area,
        initial: state.initial,
        limit: 30,
        offset: (pageRef.current - 1) * 30,
      })
      
      console.log('✅ Loaded', result.list.length, 'artists')

      if (refresh) {
        setArtists(result.list)
      } else {
        // 合并列表时去重
        setArtists(prev => {
          const existingIds = new Set(prev.map(a => a.id))
          const newArtists = result.list.filter(a => !existingIds.has(a.id))
          return [...prev, ...newArtists]
        })
      }

      setHasMore(result.list.length >= 30)
      pageRef.current += 1
    } catch (error) {
      console.error('Failed to load artists:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [loading, hasMore])

  useEffect(() => {
    loadArtists(true)
  }, [])

  useEffect(() => {
    const handleRefresh = () => {
      console.log('🔄 handleRefresh triggered')
      // 使用 ref 来避免闭包问题，直接在这里重新加载
      setRefreshing(true)
      pageRef.current = 1
      
      const state = getArtistState()
      const { getArtistList } = require('@/core/artist')
      
      console.log('🎵 Loading artists with source:', state.source)
      
      getArtistList(state.source, {
        type: state.type,
        area: state.area,
        initial: state.initial,
        limit: 30,
        offset: 0,
      }).then(result => {
        console.log('✅ Loaded', result.list.length, 'artists')
        setArtists(result.list)
        setHasMore(result.list.length >= 30)
        pageRef.current = 2
      }).catch(error => {
        console.error('Failed to load artists:', error)
      }).finally(() => {
        setRefreshing(false)
      })
    }

    console.log('👂 Registering artistListNeedRefresh listener')
    // @ts-ignore - custom event
    global.state_event.on('artistListNeedRefresh', handleRefresh)

    return () => {
      console.log('🔇 Unregistering artistListNeedRefresh listener')
      // @ts-ignore - custom event
      global.state_event.off('artistListNeedRefresh', handleRefresh)
    }
  }, [])

  const renderItem = useCallback(({ item }: { item: Artist }) => {
    return <ArtistItem item={item} />
  }, [])

  const keyExtractor = useCallback((item: Artist, index: number) => {
    // 使用 id + index 确保唯一性
    return `${item.id}_${index}`
  }, [])

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
      data={artists}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      numColumns={1}
      contentContainerStyle={styles.list}
      onEndReached={() => loadArtists(false)}
      onEndReachedThreshold={0.5}
      onRefresh={() => loadArtists(true)}
      refreshing={refreshing}
      ListFooterComponent={renderFooter}
      ListEmptyComponent={renderEmpty}
    />
  )
})

const styles = createStyle({
  list: {
    padding: 12,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  info: {
    flex: 1,
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

export default List

