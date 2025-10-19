import { memo, useEffect, useState, useCallback } from 'react'
import { View, FlatList, TouchableOpacity, ActivityIndicator, Image, ScrollView } from 'react-native'
import Text from '@/components/common/Text'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import { useI18n } from '@/lang'
import { getAlbumDetailProps } from './state'
import { setTempList } from '@/core/list'
import { playList } from '@/core/player/player'
import { LIST_IDS } from '@/config/constant'
import { goBack } from '@/navigation/navigation'
import commonState from '@/store/common/state'

interface Song {
  id: number | string
  name: string
  artist: string
  album: string
  duration: number
}

interface AlbumInfo {
  name: string
  picUrl?: string
  artistName: string
  size: number
  publishTime: number
  company?: string
}

const MusicItem = memo(({ item, onPress }: { item: Song; onPress: () => void }) => {
  const theme = useTheme()

  const formatDuration = (duration: number) => {
    const minutes = Math.floor(duration / 60000)
    const seconds = Math.floor((duration % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <TouchableOpacity
      style={{
        ...styles.item,
        backgroundColor: theme['c-content-background'],
      }}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.itemContent}>
        <Text size={15} color={theme['c-font']} numberOfLines={1} style={styles.songName}>
          {item.name}
        </Text>
        <Text size={12} color={theme['c-font-label']} numberOfLines={1} style={styles.artistName}>
          {item.artist}
        </Text>
      </View>
      <Text size={12} color={theme['c-font-label']}>
        {formatDuration(item.duration)}
      </Text>
    </TouchableOpacity>
  )
})

const AlbumDetail = memo(() => {
  const theme = useTheme()
  const t = useI18n()
  const props = getAlbumDetailProps()
  const [albumInfo, setAlbumInfo] = useState<AlbumInfo | null>(null)
  const [songs, setSongs] = useState<Song[]>([])
  const [musicList, setMusicList] = useState<LX.Music.MusicInfoOnline[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // 解析时长字符串 (如 "03:45") 为毫秒
  const parseDuration = useCallback((interval: string): number => {
    if (!interval) return 0
    const parts = interval.split(':')
    if (parts.length === 2) {
      const minutes = parseInt(parts[0], 10)
      const seconds = parseInt(parts[1], 10)
      return (minutes * 60 + seconds) * 1000
    }
    return 0
  }, [])

  const formatDate = (timestamp: number) => {
    if (!timestamp) return ''
    const date = new Date(timestamp)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  }

  const loadAlbumDetail = useCallback(async (refresh = false) => {
    if (!refresh && !loading) return
    
    if (refresh) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }

    try {
      const { getAlbumDetail } = require('@/core/album')
      
      // 获取专辑详情和歌曲列表
      const result = await getAlbumDetail(props.source, props.albumId)
      
      console.log('💿 Album loaded:', result.info.name, 'with', result.songs.length, 'songs')
      
      // 设置专辑信息
      setAlbumInfo(result.info)
      
      // 保存原始音乐列表用于播放
      setMusicList(result.songs)
      
      // 转换为本地格式用于显示
      const songsData: Song[] = result.songs.map((music: any) => ({
        id: music.id,
        name: music.name,
        artist: music.singer,
        album: music.meta.albumName,
        duration: parseDuration(music.interval),
      }))

      setSongs(songsData)
    } catch (error) {
      console.error('❌ Failed to load album detail:', error)
      setAlbumInfo(null)
      setMusicList([])
      setSongs([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [props.albumId, props.source, parseDuration, loading])

  useEffect(() => {
    loadAlbumDetail()
  }, [])

  const handlePlaySong = useCallback(async (index: number) => {
    try {
      if (!musicList.length) return
      
      console.log('🎵 Playing song at index:', index, 'song info:', musicList[index])
      
      // 设置临时播放列表
      const listId = `album__${props.albumId}`
      await setTempList(listId, [...musicList])
      
      // 播放指定索引的歌曲
      void playList(LIST_IDS.TEMP, index)
    } catch (error) {
      console.error('❌ Failed to play song:', error)
    }
  }, [musicList, props.albumId])

  const handleBack = useCallback(() => {
    goBack(commonState.componentIds.home!)
  }, [])

  const renderItem = useCallback(({ item, index }: { item: Song; index: number }) => {
    return <MusicItem item={item} onPress={() => handlePlaySong(index)} />
  }, [handlePlaySong])

  const keyExtractor = useCallback((item: Song, index: number) => {
    return `${item.id}_${index}`
  }, [])

  const renderHeader = useCallback(() => {
    if (!albumInfo) return null
    
    return (
      <View style={styles.header}>
        {/* 专辑封面 */}
        {albumInfo.picUrl ? (
          <Image source={{ uri: albumInfo.picUrl }} style={styles.cover} />
        ) : (
          <View style={{ ...styles.cover, backgroundColor: theme['c-primary-light-200'] }} />
        )}
        
        {/* 专辑信息 */}
        <Text size={20} weight="bold" color={theme['c-font']} style={styles.albumName}>
          {albumInfo.name}
        </Text>
        <Text size={14} color={theme['c-font-label']} style={styles.artistName}>
          {albumInfo.artistName}
        </Text>
        <Text size={12} color={theme['c-font-label']} style={styles.meta}>
          {albumInfo.size} 首歌曲 • {formatDate(albumInfo.publishTime)}
        </Text>
        {albumInfo.company && (
          <Text size={12} color={theme['c-font-label']} style={styles.company}>
            {albumInfo.company}
          </Text>
        )}
        
        <View style={styles.divider} />
        
        <Text size={16} weight="bold" color={theme['c-font']} style={styles.songsTitle}>
          歌曲列表
        </Text>
      </View>
    )
  }, [albumInfo, theme])

  const renderEmpty = useCallback(() => {
    if (loading || refreshing) return null
    return (
      <View style={styles.empty}>
        <Text color={theme['c-font-label']}>{t('no_item')}</Text>
      </View>
    )
  }, [loading, refreshing, theme, t])

  if (loading && !albumInfo) {
    return (
      <View style={{ ...styles.container, backgroundColor: theme['c-primary-background'] }}>
        {/* 返回按钮 */}
        <TouchableOpacity style={styles.backButton} onPress={handleBack} activeOpacity={0.7}>
          <Text size={30} color={theme['c-font']}>←</Text>
        </TouchableOpacity>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme['c-primary-font-active']} />
        </View>
      </View>
    )
  }

  return (
    <View style={{ ...styles.container, backgroundColor: theme['c-primary-background'] }}>
      {/* 返回按钮 */}
      <TouchableOpacity style={styles.backButton} onPress={handleBack} activeOpacity={0.7}>
        <Text size={30} color={theme['c-font']}>←</Text>
      </TouchableOpacity>
      
      <FlatList
        data={songs}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.list}
        onRefresh={() => loadAlbumDetail(true)}
        refreshing={refreshing}
        ListEmptyComponent={renderEmpty}
      />
    </View>
  )
})

const styles = createStyle({
  container: {
    flex: 1,
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 16,
    zIndex: 10,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: 12,
    paddingTop: 80,
  },
  header: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  cover: {
    width: 200,
    height: 200,
    borderRadius: 8,
    marginBottom: 16,
  },
  albumName: {
    marginBottom: 8,
    textAlign: 'center',
  },
  artistName: {
    marginBottom: 4,
  },
  meta: {
    marginBottom: 4,
  },
  company: {
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(128, 128, 128, 0.2)',
    width: '100%',
    marginVertical: 16,
  },
  songsTitle: {
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
  },
  itemContent: {
    flex: 1,
    marginRight: 12,
  },
  songName: {
    marginBottom: 4,
  },
  artistName: {
    marginTop: 2,
  },
  empty: {
    paddingVertical: 40,
    alignItems: 'center',
  },
})

export default AlbumDetail





