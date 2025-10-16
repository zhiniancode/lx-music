import { useEffect, useState, useCallback, useRef } from 'react'
import { View, ScrollView, TouchableOpacity, ImageBackground, RefreshControl, Animated, Modal } from 'react-native'
import { createStyle, toast } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import { useI18n } from '@/lang'
import Text from '@/components/common/Text'
import { getBoardsList, getListDetail } from '@/core/leaderboard'
import { Icon } from '@/components/common/Icon'
import { scaleSizeW } from '@/utils/pixelRatio'
import { handlePlay as playFromBoard } from '@/screens/Home/Views/Leaderboard/listAction'
import MusicAddModal, { type MusicAddModalType } from '@/components/MusicAddModal'
import { addListMusics, getListMusics } from '@/core/list'
import { playList } from '@/core/player/player'
import { LIST_IDS } from '@/config/constant'
import playerState from '@/store/player/state'
import { getMultiPlatformHotMusic } from '@/utils/hotMusicMerge'

// 模拟数据（用于测试）
const MOCK_DATA_ENABLED = false // 设为 true 启用模拟数据

// 音乐列表项组件
interface MusicItemProps {
  music: LX.Music.MusicInfoOnline
  index: number
  theme: any
  onPress: () => void
  onLongPress: () => void
}

const MusicItem = ({ music, index, theme, onPress, onLongPress }: MusicItemProps) => {
  const scaleAnim = useState(new Animated.Value(1))[0]
  const isTopThree = index < 3

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
    }).start()
  }

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start()
  }

  // 前三名的特殊颜色
  const getRankColor = () => {
    if (index === 0) return '#FFD700' // 金色
    if (index === 1) return '#C0C0C0' // 银色  
    if (index === 2) return '#CD7F32' // 铜色
    return theme['c-font']
  }

  const getItemStyle = () => {
    // 统一所有项目的样式
    return { ...styles.musicItem, borderBottomColor: theme['c-border-background'] }
  }

  return (
    <Animated.View 
      style={{ transform: [{ scale: scaleAnim }] }}
    >
      <TouchableOpacity 
        style={getItemStyle()}
        activeOpacity={0.8}
        onPress={onPress}
        onLongPress={onLongPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <View style={styles.musicRank}>
          <Text 
            style={{ 
              ...styles.rankText, 
              color: getRankColor(),
              fontWeight: 'bold',
            }}
          >
            {index + 1}
          </Text>
        </View>
        <View style={styles.musicInfo}>
          <Text numberOfLines={1} style={{ fontWeight: 'bold' }}>{music.name}</Text>
          <Text numberOfLines={1} size={12} color={theme['c-font-label']}>{music.singer}</Text>
        </View>
        {isTopThree && (
          <View style={styles.hotBadge}>
            <Text size={9} style={{ color: '#FF5722', fontWeight: 'bold' }}>HOT</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  )
}

export default () => {
  const theme = useTheme()
  const t = useI18n()
  const [dailyRecommend, setDailyRecommend] = useState<LX.Music.MusicInfoOnline[]>([])
  const [hotMusic, setHotMusic] = useState<LX.Music.MusicInfoOnline[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string>('')
  const [currentBoardIds, setCurrentBoardIds] = useState({ daily: '', hot: '' })
  const [showDailyModal, setShowDailyModal] = useState(false)
  const musicAddModalRef = useRef<MusicAddModalType>(null)
  const fadeAnim = useState(new Animated.Value(0))[0]

  const loadData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      setError('')
      console.log('🏠 [主页] 开始加载数据...')
      
      // 模拟数据用于测试UI
      if (MOCK_DATA_ENABLED) {
        console.log('🏠 [主页] 使用模拟数据')
        const mockMusic = Array.from({ length: 20 }, (_, i) => ({
          id: `mock_${i}`,
          name: `测试歌曲 ${i + 1}`,
          singer: `测试歌手 ${i + 1}`,
          source: 'wy' as LX.OnlineSource,
          img: 'https://via.placeholder.com/300',
          interval: '03:30',
        }))
        setDailyRecommend(mockMusic.slice(0, 5) as any)
        setHotMusic(mockMusic as any)
        setLoading(false)
        setRefreshing(false)
        return
      }
      
      // 获取每日推荐：使用多平台新歌榜（网易云 + QQ音乐）
      console.log('🏠 [主页] 开始获取多平台每日推荐（新歌榜）...')
      const dailyMusic = await getMultiPlatformHotMusic(
        ['wy', 'tx'], // 网易云和QQ音乐
        getListDetail,
        {
          wy: 'wy__3779629', // 网易云新歌榜
          tx: 'tx__27',      // QQ音乐新歌榜
        },
        30 // 每个平台取前30首
      )
      
      if (dailyMusic && dailyMusic.length > 0) {
        setDailyRecommend(dailyMusic.slice(0, 30)) // 取合并后的前30首
        setCurrentBoardIds(prev => ({ ...prev, daily: 'multi_platform_new' }))
        console.log('🏠 [主页] 每日推荐加载完成，共', dailyMusic.length, '首（新歌多平台合并）')
      } else {
        console.warn('🏠 [主页] 多平台每日推荐获取失败，尝试使用单一平台...')
        // 降级方案：如果多平台获取失败，使用网易云新歌榜
        try {
          const newSongBoardId = 'wy__3779629'
          const dailyDetail = await getListDetail(newSongBoardId, 1)
          if (dailyDetail && dailyDetail.list && dailyDetail.list.length > 0) {
            setDailyRecommend(dailyDetail.list.slice(0, 30))
            setCurrentBoardIds(prev => ({ ...prev, daily: newSongBoardId }))
          }
        } catch (err) {
          console.warn('🏠 [主页] 降级方案也失败了:', err)
        }
      }
      
      // 获取本周最热：使用多平台热歌榜（网易云 + QQ音乐）
      console.log('🏠 [主页] 开始获取多平台本周最热（热歌榜）...')
      const hotMusic = await getMultiPlatformHotMusic(
        ['wy', 'tx'], // 网易云和QQ音乐
        getListDetail,
        {
          wy: 'wy__3778678', // 网易云热歌榜
          tx: 'tx__26',      // QQ音乐热歌榜
        },
        30 // 每个平台取前30首
      )
      
      if (hotMusic && hotMusic.length > 0) {
        setHotMusic(hotMusic.slice(0, 30)) // 取合并后的前30首
        setCurrentBoardIds(prev => ({ ...prev, hot: 'multi_platform_hot' }))
        console.log('🏠 [主页] 本周最热加载完成，共', hotMusic.length, '首（热歌多平台合并）')
      } else {
        console.warn('🏠 [主页] 多平台本周最热获取失败，尝试使用单一平台...')
        // 降级方案：如果多平台获取失败，使用网易云热歌榜
        try {
          const hotBoardId = 'wy__3778678'
          const hotDetail = await getListDetail(hotBoardId, 1)
          if (hotDetail && hotDetail.list && hotDetail.list.length > 0) {
            setHotMusic(hotDetail.list.slice(0, 30))
            setCurrentBoardIds(prev => ({ ...prev, hot: hotBoardId }))
          }
        } catch (err) {
          console.warn('🏠 [主页] 降级方案也失败了:', err)
        }
      }
      
      console.log('🏠 [主页] 数据加载完成')
      
      // 淡入动画
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start()
    } catch (error) {
      console.error('🏠 [主页] 加载数据失败:', error)
      setError('加载失败，请稍后重试')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [fadeAnim])

  useEffect(() => {
    void loadData()
  }, [loadData])

  // 下拉刷新
  const onRefresh = useCallback(() => {
    void loadData(true)
  }, [loadData])

  // 显示每日推荐列表
  const handleShowDailyRecommend = useCallback(() => {
    if (!dailyRecommend.length) return
    console.log('📋 显示每日推荐列表')
    setShowDailyModal(true)
  }, [dailyRecommend])

  // 一键添加所有每日推荐歌曲到播放列表
  const handleAddAllDailyToPlaylist = useCallback(async () => {
    if (!dailyRecommend.length) return
    
    try {
      console.log('📋 添加所有每日推荐歌曲到播放列表，共', dailyRecommend.length, '首')
      
      // 获取当前播放列表
      const currentList = await getListMusics(LIST_IDS.DEFAULT)
      
      // 过滤出未在播放列表中的歌曲
      const newSongs = dailyRecommend.filter(music => 
        !currentList.some(item => item.id === music.id)
      )
      
      if (newSongs.length === 0) {
        console.log('📋 所有歌曲都已在播放列表中')
        toast('所有歌曲都已在播放列表中')
        return
      }
      
      // 批量添加到播放列表
      await addListMusics(LIST_IDS.DEFAULT, newSongs as LX.Music.MusicInfo[], 'bottom')
      console.log('📋 成功添加', newSongs.length, '首歌曲到播放列表')
      toast(`已添加 ${newSongs.length} 首歌曲`)
      setShowDailyModal(false)
    } catch (error) {
      console.error('📋 添加歌曲到播放列表失败:', error)
      toast('添加失败，请重试')
    }
  }, [dailyRecommend])

  // 一键添加所有本周最热歌曲到播放列表
  const handleAddAllHotToPlaylist = useCallback(async () => {
    if (!hotMusic.length) return
    
    try {
      console.log('📋 添加所有本周最热歌曲到播放列表，共', hotMusic.length, '首')
      
      // 获取当前播放列表
      const currentList = await getListMusics(LIST_IDS.DEFAULT)
      
      // 过滤出未在播放列表中的歌曲
      const newSongs = hotMusic.filter(music => 
        !currentList.some(item => item.id === music.id)
      )
      
      if (newSongs.length === 0) {
        console.log('📋 所有歌曲都已在播放列表中')
        toast('所有歌曲都已在播放列表中')
        return
      }
      
      // 批量添加到播放列表
      await addListMusics(LIST_IDS.DEFAULT, newSongs as LX.Music.MusicInfo[], 'bottom')
      console.log('📋 成功添加', newSongs.length, '首歌曲到播放列表')
      toast(`已添加 ${newSongs.length} 首歌曲`)
    } catch (error) {
      console.error('📋 添加歌曲到播放列表失败:', error)
      toast('添加失败，请重试')
    }
  }, [hotMusic])

  // 播放每日推荐中的某首歌（添加到播放列表）
  const handlePlayDailySong = useCallback(async (index: number) => {
    if (!dailyRecommend.length) return
    
    const music = dailyRecommend[index]
    if (!music || !music.id || !music.name) {
      console.error('🎵 每日推荐音乐信息无效:', music)
      return
    }
    
    // 检查是否正在播放同一首歌曲
    const currentMusic = playerState.playMusicInfo.musicInfo
    if (currentMusic && currentMusic.id === music.id && playerState.isPlay) {
      console.log('🎵 已在播放该歌曲，无需重复操作:', music.name)
      setShowDailyModal(false)
      return
    }
    
    try {
      console.log('🎵 播放每日推荐歌曲:', music.name)
      setShowDailyModal(false)
      
      // 检查歌曲是否已在播放列表中
      const currentList = await getListMusics(LIST_IDS.DEFAULT)
      const existingIndex = currentList.findIndex(item => item.id === music.id)
      
      if (existingIndex !== -1) {
        // 如果歌曲已在播放列表中，直接播放
        console.log('🎵 歌曲已在播放列表中，直接播放:', music.name, '位置:', existingIndex)
        void playList(LIST_IDS.DEFAULT, existingIndex)
      } else {
        // 歌曲不在播放列表中，添加并播放
        const currentLength = currentList.length
        await addListMusics(LIST_IDS.DEFAULT, [music as LX.Music.MusicInfo], 'bottom')
        const newSongIndex = currentLength
        void playList(LIST_IDS.DEFAULT, newSongIndex)
        console.log('🎵 每日推荐歌曲已添加到播放列表:', music.name, '位置:', newSongIndex)
      }
    } catch (error) {
      console.error('🎵 播放每日推荐歌曲失败:', error)
      // 如果添加到播放列表失败，尝试使用原来的方式
      // 注意：多平台合并的歌曲使用其自身的source作为榜单ID
      if (currentBoardIds.daily && !currentBoardIds.daily?.startsWith('multi_platform')) {
        try {
          await playFromBoard(currentBoardIds.daily, [music], 0, true)
        } catch (fallbackError) {
          console.error('🎵 每日推荐降级播放也失败:', fallbackError)
        }
      }
    }
  }, [dailyRecommend, currentBoardIds.daily])

  // 播放单曲（添加到播放列表并播放）
  const handlePlaySong = useCallback(async (music: LX.Music.MusicInfoOnline, index: number) => {
    try {
      console.log('🎵 播放歌曲:', music.name)
      
      // 检查音乐信息是否有效
      if (!music || !music.id || !music.name) {
        console.error('🎵 音乐信息无效:', music)
        return
      }
      
      // 检查是否正在播放同一首歌曲
      const currentMusic = playerState.playMusicInfo.musicInfo
      if (currentMusic && currentMusic.id === music.id && playerState.isPlay) {
        console.log('🎵 已在播放该歌曲，无需重复操作:', music.name)
        return
      }
      
      // 检查歌曲是否已在播放列表中
      const currentList = await getListMusics(LIST_IDS.DEFAULT)
      const existingIndex = currentList.findIndex(item => item.id === music.id)
      
      if (existingIndex !== -1) {
        // 如果歌曲已在播放列表中，直接播放
        console.log('🎵 歌曲已在播放列表中，直接播放:', music.name, '位置:', existingIndex)
        void playList(LIST_IDS.DEFAULT, existingIndex)
      } else {
        // 歌曲不在播放列表中，添加并播放
        const currentLength = currentList.length
        await addListMusics(LIST_IDS.DEFAULT, [music as LX.Music.MusicInfo], 'bottom')
        const newSongIndex = currentLength
        void playList(LIST_IDS.DEFAULT, newSongIndex)
        console.log('🎵 歌曲已添加到播放列表:', music.name, '位置:', newSongIndex)
      }
    } catch (error) {
      console.error('🎵 播放歌曲失败:', error)
      // 如果添加到播放列表失败，尝试使用原来的方式
      // 注意：多平台合并的歌曲使用其自身的source作为榜单ID
      if (currentBoardIds.hot && !currentBoardIds.hot?.startsWith('multi_platform')) {
        try {
          await playFromBoard(currentBoardIds.hot, [music], 0, true)
        } catch (fallbackError) {
          console.error('🎵 降级播放也失败:', fallbackError)
        }
      }
    }
  }, [currentBoardIds.hot])

  // 长按显示菜单
  const handleLongPress = useCallback((music: LX.Music.MusicInfoOnline, listId: string) => {
    console.log('📋 显示歌曲菜单:', music.name)
    musicAddModalRef.current?.show({
      musicInfo: music,
      listId: listId,
      isMove: false,
    })
  }, [])

  const renderMusicItem = (music: LX.Music.MusicInfoOnline, index: number) => (
    <MusicItem 
      key={music.id}
      music={music}
      index={index}
      theme={theme}
      onPress={() => handlePlaySong(music, index)}
      onLongPress={() => handleLongPress(music, currentBoardIds.hot?.startsWith('multi_platform') ? `${music.source}__hot` : currentBoardIds.hot)}
    />
  )

  return (
    <>
      <ScrollView 
        style={{ ...styles.container, backgroundColor: theme['c-content-background'] }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme['c-primary-font']]}
            tintColor={theme['c-primary-font']}
          />
        }
      >
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* 加载中状态 */}
        {loading && (
          <View style={styles.loadingContainer}>
            <Text color={theme['c-font-label']}>
              加载中...
            </Text>
          </View>
        )}

        {/* 错误状态 */}
        {!loading && error && (
          <View style={styles.errorContainer}>
            <Icon name="help" size={48} color={theme['c-font-label']} />
            <Text color={theme['c-font-label']} style={{ marginTop: scaleSizeW(10) }}>
              {error}
            </Text>
          </View>
        )}

        {/* 每日推荐卡片 */}
        {!loading && !error && dailyRecommend.length > 0 && (
          <TouchableOpacity 
            style={styles.recommendCard}
            activeOpacity={0.8}
            onPress={handleShowDailyRecommend}
          >
            <ImageBackground
              source={{ uri: dailyRecommend[0].meta?.picUrl || 'https://via.placeholder.com/500' }}
              style={styles.recommendCardBg}
              imageStyle={styles.recommendCardImage}
            >
              <View style={styles.recommendCardOverlay}>
                <View style={styles.recommendCardCenterContent}>
                  <Text size={28} style={{ ...styles.recommendCardTitle, fontWeight: 'bold' }}>
                    每日推荐
                  </Text>
                  <Text size={15} style={{ ...styles.recommendCardSubtitle, marginTop: scaleSizeW(10) }}>
                    最新音乐精选 · {dailyRecommend.length} 首
                  </Text>
                </View>
              </View>
            </ImageBackground>
          </TouchableOpacity>
        )}

        {/* 本周最热音乐列表 */}
        {!loading && !error && hotMusic.length > 0 && (
          <View style={styles.hotMusicSection}>
            <View style={styles.sectionHeader}>
              <View style={styles.titleContainer}>
                <Icon name="leaderboard" size={24} color="#FF5722" />
                <Text size={20} style={styles.hotMusicTitle}>
                  本周最热音乐
                </Text>
                <View style={styles.hotBadgeTitle}>
                  <Text size={10} style={styles.hotBadgeText}>HOT</Text>
                </View>
              </View>
              <TouchableOpacity 
                onPress={handleAddAllHotToPlaylist} 
                style={styles.addAllButtonSmall}
                activeOpacity={0.7}
              >
                <Icon name="add-music" size={14} color="#FFFFFF" />
                <Text size={12} style={{ color: '#FFFFFF', marginLeft: scaleSizeW(4), fontWeight: 'bold' }}>
                  添加全部
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.hotMusicContainer}>
              <View style={styles.musicList}>
                {hotMusic.map(renderMusicItem)}
              </View>            
            </View>
          </View>
        )}

        {/* 空状态 */}
        {!loading && !error && dailyRecommend.length === 0 && hotMusic.length === 0 && (
          <View style={styles.emptyContainer}>
            <Icon name="album" size={60} color={theme['c-font-label']} />
            <Text color={theme['c-font-label']} style={{ marginTop: scaleSizeW(15) }}>
              暂无推荐内容
            </Text>
          </View>
        )}
        </Animated.View>
      </ScrollView>

      {/* 添加到播放列表弹窗 */}
      <MusicAddModal ref={musicAddModalRef} />

      {/* 每日推荐列表弹窗 */}
      <Modal
        visible={showDailyModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDailyModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowDailyModal(false)}
        >
          <TouchableOpacity 
            style={{ ...styles.modalContent, backgroundColor: theme['c-content-background'] }}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            {/* 标题栏 */}
            <View style={{ ...styles.modalHeader, borderBottomColor: theme['c-border-background'] }}>
              <Text size={18} style={{ fontWeight: 'bold' }}>每日推荐</Text>
              <View style={styles.modalHeaderButtons}>
                <TouchableOpacity 
                  onPress={handleAddAllDailyToPlaylist} 
                  style={styles.addAllButton}
                  activeOpacity={0.7}
                >
                  <Icon name="add-music" size={16} color="#FFFFFF" />
                  <Text size={13} style={{ color: '#FFFFFF', marginLeft: scaleSizeW(6), fontWeight: 'bold' }}>
                    添加全部
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowDailyModal(false)} style={styles.closeButton}>
                  <Icon name="close" size={24} color={theme['c-font']} />
                </TouchableOpacity>
              </View>
            </View>

            {/* 歌曲列表 */}
            <ScrollView style={styles.modalList}>
              {dailyRecommend.map((music, index) => (
                <TouchableOpacity
                  key={music.id}
                  style={{ ...styles.modalMusicItem, borderBottomColor: theme['c-border-background'] }}
                  activeOpacity={0.7}
                  onPress={() => handlePlayDailySong(index)}
                  onLongPress={() => handleLongPress(music, currentBoardIds.daily?.startsWith('multi_platform') ? `${music.source}__new` : currentBoardIds.daily)}
                >
                  <View style={styles.modalMusicRank}>
                    <Text 
                      style={{ 
                        fontWeight: 'bold',
                        color: index < 3 ? theme['c-primary-font'] : theme['c-font']
                      }}
                    >
                      {index + 1}
                    </Text>
                  </View>
                  <View style={styles.modalMusicInfo}>
                    <Text numberOfLines={1} style={{ fontWeight: 'bold' }}>{music.name}</Text>
                    <Text numberOfLines={1} size={12} color={theme['c-font-label']}>
                      {music.singer}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  )
}

const styles = createStyle({
  container: {
    flex: 1,
  },
  content: {
    padding: scaleSizeW(15),
    paddingTop: scaleSizeW(20),
    paddingBottom: scaleSizeW(30),
  },
  // 每日推荐卡片样式
  recommendCard: {
    width: '100%',
    height: scaleSizeW(180),
    marginBottom: scaleSizeW(25),
    borderRadius: scaleSizeW(16),
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  recommendCardBg: {
    width: '100%',
    height: '100%',
  },
  recommendCardImage: {
    borderRadius: scaleSizeW(16),
  },
  recommendCardOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: scaleSizeW(20),
    justifyContent: 'center',
    alignItems: 'center',
  },
  recommendCardCenterContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  recommendCardTitle: {
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  recommendCardSubtitle: {
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  playAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: scaleSizeW(20),
    paddingVertical: scaleSizeW(10),
    borderRadius: scaleSizeW(20),
    marginTop: scaleSizeW(16),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  // 本周最热音乐部分
  hotMusicSection: {
    marginBottom: scaleSizeW(20),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: scaleSizeW(18),
    paddingHorizontal: scaleSizeW(4),
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hotMusicTitle: {
    marginLeft: scaleSizeW(8),
    fontWeight: 'bold',
    color: '#2E2E2E',
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  hotBadgeTitle: {
    backgroundColor: '#FF5722',
    paddingHorizontal: scaleSizeW(6),
    paddingVertical: scaleSizeW(2),
    borderRadius: scaleSizeW(8),
    marginLeft: scaleSizeW(8),
  },
  hotBadgeText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: scaleSizeW(8),
  },
  songCount: {
    fontWeight: '600',
  },
  hotMusicContainer: {
    position: 'relative',
    borderRadius: scaleSizeW(16),
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  musicList: {
    backgroundColor: 'transparent',
    borderRadius: scaleSizeW(16),
    overflow: 'hidden',
    paddingVertical: scaleSizeW(8),
    paddingHorizontal: scaleSizeW(8),
  },
  musicItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: scaleSizeW(14),
    paddingHorizontal: scaleSizeW(16),
    marginVertical: scaleSizeW(3),
    backgroundColor: 'transparent',
    borderRadius: scaleSizeW(12),
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  musicRank: {
    width: scaleSizeW(40),
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    fontSize: scaleSizeW(16),
  },
  musicInfo: {
    flex: 1,
    marginLeft: scaleSizeW(12),
    marginRight: scaleSizeW(10),
  },
  hotBadge: {
    backgroundColor: 'rgba(255, 87, 34, 0.12)',
    paddingHorizontal: scaleSizeW(8),
    paddingVertical: scaleSizeW(3),
    borderRadius: scaleSizeW(8),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 87, 34, 0.2)',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: scaleSizeW(60),
    minHeight: scaleSizeW(300),
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: scaleSizeW(60),
    minHeight: scaleSizeW(300),
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: scaleSizeW(60),
    minHeight: scaleSizeW(300),
  },
  // 弹窗样式
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: scaleSizeW(20),
    borderTopRightRadius: scaleSizeW(20),
    maxHeight: '80%',
    paddingBottom: scaleSizeW(20),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scaleSizeW(20),
    paddingVertical: scaleSizeW(16),
    borderBottomWidth: 1,
  },
  modalHeaderButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B6B',
    paddingHorizontal: scaleSizeW(12),
    paddingVertical: scaleSizeW(6),
    borderRadius: scaleSizeW(16),
    marginRight: scaleSizeW(12),
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  addAllButtonSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF5722',
    paddingHorizontal: scaleSizeW(10),
    paddingVertical: scaleSizeW(5),
    borderRadius: scaleSizeW(14),
    shadowColor: '#FF5722',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
  },
  closeButton: {
    padding: scaleSizeW(4),
  },
  modalList: {
    paddingHorizontal: scaleSizeW(10),
  },
  modalMusicItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: scaleSizeW(14),
    paddingHorizontal: scaleSizeW(12),
    borderBottomWidth: 0.5,
  },
  modalMusicRank: {
    width: scaleSizeW(40),
    alignItems: 'center',
  },
  modalMusicInfo: {
    flex: 1,
    marginLeft: scaleSizeW(12),
    marginRight: scaleSizeW(10),
  },
})

