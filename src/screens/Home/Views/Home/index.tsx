import { useEffect, useState, useCallback, useRef } from 'react'
import { View, ScrollView, TouchableOpacity, ImageBackground, RefreshControl, Animated, Modal } from 'react-native'
import { createStyle } from '@/utils/tools'
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
      
      // 获取排行榜列表 - 网易云音乐
      const boards = await getBoardsList('wy')
      console.log('🏠 [主页] 获取到排行榜列表:', boards.length, '个')
      console.log('🏠 [主页] 排行榜详情:', JSON.stringify(boards))
      
      if (boards && boards.length >= 1) {
        // 第一个榜单作为每日推荐（飙升榜）
        const firstBoardId = boards[0].id
        console.log('🏠 [主页] 加载每日推荐榜单 ID:', firstBoardId)
        
        const dailyDetail = await getListDetail(firstBoardId, 1)
        console.log('🏠 [主页] 每日推荐歌曲数:', dailyDetail?.list?.length || 0)
        
        if (dailyDetail && dailyDetail.list && dailyDetail.list.length > 0) {
          setDailyRecommend(dailyDetail.list) // 显示所有推荐歌曲
          setCurrentBoardIds(prev => ({ ...prev, daily: firstBoardId }))
        }
        
        // 使用热歌榜作为本周最热
        const hotBoardId = 'wy__3778678'
        console.log('🏠 [主页] 加载本周最热榜单（热歌榜）ID:', hotBoardId)
        
        const hotDetail = await getListDetail(hotBoardId, 1)
        console.log('🏠 [主页] 本周最热歌曲数:', hotDetail?.list?.length || 0)
        
        if (hotDetail && hotDetail.list && hotDetail.list.length > 0) {
          setHotMusic(hotDetail.list.slice(0, 30))
          setCurrentBoardIds(prev => ({ ...prev, hot: hotBoardId }))
        }
      } else {
        console.warn('🏠 [主页] 没有可用的榜单数据')
        setError('没有可用的榜单数据')
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
      const currentList = await getListMusics(LIST_IDS.TEMP)
      const existingIndex = currentList.findIndex(item => item.id === music.id)
      
      if (existingIndex !== -1) {
        // 如果歌曲已在播放列表中，直接播放
        console.log('🎵 歌曲已在播放列表中，直接播放:', music.name, '位置:', existingIndex)
        void playList(LIST_IDS.TEMP, existingIndex)
      } else {
        // 歌曲不在播放列表中，添加并播放
        const currentLength = currentList.length
        await addListMusics(LIST_IDS.TEMP, [music as LX.Music.MusicInfo], 'bottom')
        const newSongIndex = currentLength
        void playList(LIST_IDS.TEMP, newSongIndex)
        console.log('🎵 每日推荐歌曲已添加到播放列表:', music.name, '位置:', newSongIndex)
      }
    } catch (error) {
      console.error('🎵 播放每日推荐歌曲失败:', error)
      // 如果添加到播放列表失败，尝试使用原来的方式
      if (currentBoardIds.daily) {
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
      const currentList = await getListMusics(LIST_IDS.TEMP)
      const existingIndex = currentList.findIndex(item => item.id === music.id)
      
      if (existingIndex !== -1) {
        // 如果歌曲已在播放列表中，直接播放
        console.log('🎵 歌曲已在播放列表中，直接播放:', music.name, '位置:', existingIndex)
        void playList(LIST_IDS.TEMP, existingIndex)
      } else {
        // 歌曲不在播放列表中，添加并播放
        const currentLength = currentList.length
        await addListMusics(LIST_IDS.TEMP, [music as LX.Music.MusicInfo], 'bottom')
        const newSongIndex = currentLength
        void playList(LIST_IDS.TEMP, newSongIndex)
        console.log('🎵 歌曲已添加到播放列表:', music.name, '位置:', newSongIndex)
      }
    } catch (error) {
      console.error('🎵 播放歌曲失败:', error)
      // 如果添加到播放列表失败，尝试使用原来的方式
      if (currentBoardIds.hot) {
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
      onLongPress={() => handleLongPress(music, currentBoardIds.hot)}
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
            <Icon name="logo" size={40} color={theme['c-primary-font']} />
            <Text color={theme['c-font-label']} style={{ marginTop: scaleSizeW(10) }}>
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
                    {dailyRecommend.length} 首精选歌曲
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
              <TouchableOpacity onPress={() => setShowDailyModal(false)} style={styles.closeButton}>
                <Icon name="close" size={24} color={theme['c-font']} />
              </TouchableOpacity>
            </View>

            {/* 歌曲列表 */}
            <ScrollView style={styles.modalList}>
              {dailyRecommend.map((music, index) => (
                <TouchableOpacity
                  key={music.id}
                  style={{ ...styles.modalMusicItem, borderBottomColor: theme['c-border-background'] }}
                  activeOpacity={0.7}
                  onPress={() => handlePlayDailySong(index)}
                  onLongPress={() => handleLongPress(music, currentBoardIds.daily)}
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

