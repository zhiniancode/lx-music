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

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start()
  }

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start()
  }

  return (
    <Animated.View 
      style={{ transform: [{ scale: scaleAnim }] }}
    >
      <TouchableOpacity 
        style={{ ...styles.musicItem, borderBottomColor: theme['c-border-background'] }}
        activeOpacity={0.9}
        onPress={onPress}
        onLongPress={onLongPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <View style={styles.musicRank}>
          <View style={[
            styles.rankBadge,
            { backgroundColor: index < 3 ? theme['c-primary-alpha-100'] : 'transparent' }
          ]}>
            <Text 
              style={{ 
                ...styles.rankText, 
                color: index < 3 ? theme['c-primary-font'] : theme['c-font'],
                fontWeight: 'bold',
              }}
            >
              {index + 1}
            </Text>
          </View>
        </View>
        <View style={styles.musicInfo}>
          <Text numberOfLines={1} style={{ fontWeight: 'bold' }}>{music.name}</Text>
          <Text numberOfLines={1} size={12} color={theme['c-font-label']}>{music.singer}</Text>
        </View>
        <View style={styles.playIconContainer}>
          <Icon name="play-outline" size={22} color={theme['c-primary-font']} />
        </View>
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
      
      if (boards && boards.length >= 2) {
        // 第一个榜单作为每日推荐（飙升榜）
        const firstBoardId = boards[0].id
        console.log('🏠 [主页] 加载每日推荐榜单 ID:', firstBoardId)
        
        const dailyDetail = await getListDetail(firstBoardId, 1)
        console.log('🏠 [主页] 每日推荐歌曲数:', dailyDetail?.list?.length || 0)
        
        if (dailyDetail && dailyDetail.list && dailyDetail.list.length > 0) {
          setDailyRecommend(dailyDetail.list) // 显示所有推荐歌曲
          setCurrentBoardIds(prev => ({ ...prev, daily: firstBoardId }))
        }
        
        // 第二个榜单作为本周最热（新歌榜）
        const secondBoardId = boards[1].id
        console.log('🏠 [主页] 加载本周最热榜单 ID:', secondBoardId)
        
        const hotDetail = await getListDetail(secondBoardId, 1)
        console.log('🏠 [主页] 本周最热歌曲数:', hotDetail?.list?.length || 0)
        
        if (hotDetail && hotDetail.list && hotDetail.list.length > 0) {
          setHotMusic(hotDetail.list.slice(0, 20))
          setCurrentBoardIds(prev => ({ ...prev, hot: secondBoardId }))
        }
      } else if (boards && boards.length === 1) {
        // 如果只有一个榜单，同时用于推荐和最热
        const boardId = boards[0].id
        console.log('🏠 [主页] 只有一个榜单，ID:', boardId)
        
        const detail = await getListDetail(boardId, 1)
        console.log('🏠 [主页] 获取到歌曲数:', detail?.list?.length || 0)
        
        if (detail && detail.list && detail.list.length > 0) {
          setDailyRecommend(detail.list.slice(0, 15)) // 前15首作为推荐
          setHotMusic(detail.list.slice(15, 35)) // 15-35首作为最热
          setCurrentBoardIds({ daily: boardId, hot: boardId })
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

  // 播放每日推荐中的某首歌
  const handlePlayDailySong = useCallback(async (index: number) => {
    if (!dailyRecommend.length || !currentBoardIds.daily) return
    console.log('🎵 播放每日推荐歌曲:', dailyRecommend[index].name)
    setShowDailyModal(false)
    await playFromBoard(currentBoardIds.daily, dailyRecommend, index)
  }, [dailyRecommend, currentBoardIds.daily])

  // 播放单曲
  const handlePlaySong = useCallback(async (music: LX.Music.MusicInfoOnline, index: number) => {
    console.log('🎵 播放歌曲:', music.name)
    if (currentBoardIds.hot) {
      await playFromBoard(currentBoardIds.hot, hotMusic, index)
    }
  }, [hotMusic, currentBoardIds.hot])

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
              <Icon name="leaderboard" size={22} color={theme['c-primary-font']} />
              <Text size={18} style={{ ...styles.sectionTitle, fontWeight: 'bold' }}>本周最热音乐</Text>
            </View>
            <View style={{ ...styles.musicList, backgroundColor: theme['c-primary-light-100'] }}>
              {hotMusic.map(renderMusicItem)}
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
                  <Icon name="play-outline" size={20} color={theme['c-primary-font']} />
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
    marginBottom: scaleSizeW(18),
    paddingHorizontal: scaleSizeW(4),
  },
  sectionTitle: {
    marginLeft: scaleSizeW(10),
  },
  musicList: {
    borderRadius: scaleSizeW(12),
    overflow: 'hidden',
  },
  musicItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: scaleSizeW(14),
    paddingHorizontal: scaleSizeW(12),
    borderBottomWidth: 0.5,
    borderRadius: scaleSizeW(8),
    marginBottom: scaleSizeW(2),
  },
  musicRank: {
    width: scaleSizeW(40),
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankBadge: {
    width: scaleSizeW(32),
    height: scaleSizeW(32),
    borderRadius: scaleSizeW(16),
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    fontSize: scaleSizeW(14),
  },
  musicInfo: {
    flex: 1,
    marginLeft: scaleSizeW(12),
    marginRight: scaleSizeW(10),
  },
  playIconContainer: {
    padding: scaleSizeW(8),
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

