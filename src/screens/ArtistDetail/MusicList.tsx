import { memo, useState, useCallback, useEffect } from 'react'
import { View, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native'
import Text from '@/components/common/Text'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import { useI18n } from '@/lang'
import { setTempList } from '@/core/list'
import { playList } from '@/core/player/player'
import { LIST_IDS } from '@/config/constant'

interface MusicListProps {
  artistId: number
  artistName: string
}

interface Song {
  id: number | string
  name: string
  artist: string
  album: string
  duration: number
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
          {item.artist} - {item.album}
        </Text>
      </View>
      <Text size={12} color={theme['c-font-label']}>
        {formatDuration(item.duration)}
      </Text>
    </TouchableOpacity>
  )
})

const MusicList = memo(({ artistId, artistName }: MusicListProps) => {
  const theme = useTheme()
  const t = useI18n()
  const [songs, setSongs] = useState<Song[]>([])
  const [musicList, setMusicList] = useState<LX.Music.MusicInfoOnline[]>([])
  const [loading, setLoading] = useState(false)
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

  const loadSongs = useCallback(async (refresh = false) => {
    if (loading) return

    if (refresh) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }

    try {
      const { getArtistTopSongs } = require('@/core/artist')
      const state = require('@/screens/Home/Views/Artist/state').default
      
      // 获取歌手热门50首歌曲
      const list = await getArtistTopSongs(state.source, artistId)
      
      if (!list || list.length === 0) {
        console.warn('⚠️ No songs returned for artist:', artistId)
        setMusicList([])
        setSongs([])
        return
      }
      
      console.log('🎵 Loaded', list.length, 'songs')
      console.log('🎵 First song structure:', list[0])
      
      // 保存原始音乐列表用于播放
      setMusicList(list)
      
      // 转换为本地格式用于显示
      const songs: Song[] = list.map((music: any) => ({
        id: music.id,
        name: music.name,
        artist: music.singer,
        album: music.meta.albumName,
        duration: parseDuration(music.interval),
      }))

      setSongs(songs)
    } catch (error) {
      console.error('❌ Failed to load songs:', error)
      setMusicList([])
      setSongs([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [loading, artistId, parseDuration])

  useEffect(() => {
    loadSongs(true)
  }, [])

  const handlePlaySong = useCallback(async (index: number) => {
    try {
      if (!musicList.length) return
      
      console.log('🎵 Playing song at index:', index, 'song info:', musicList[index])
      
      // 设置临时播放列表
      const listId = `artist__${artistId}`
      await setTempList(listId, [...musicList])
      
      // 播放指定索引的歌曲
      void playList(LIST_IDS.TEMP, index)
    } catch (error) {
      console.error('❌ Failed to play song:', error)
    }
  }, [musicList, artistId])

  const renderItem = useCallback(({ item, index }: { item: Song; index: number }) => {
    return <MusicItem item={item} onPress={() => handlePlaySong(index)} />
  }, [handlePlaySong])

  const keyExtractor = useCallback((item: Song, index: number) => {
    // 使用 id + index 确保唯一性，防止重复 key
    return `${item.id}_${index}`
  }, [])

  const renderHeader = useCallback(() => {
    return null
  }, [])

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
      data={songs}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      ListHeaderComponent={renderHeader}
      contentContainerStyle={styles.list}
      onRefresh={() => loadSongs(true)}
      refreshing={refreshing}
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

export default MusicList

