import { memo, useCallback, useState } from 'react'
import { View, TouchableOpacity, ScrollView, Dimensions, StyleSheet } from 'react-native'
import Text from '@/components/common/Text'
import { useTheme } from '@/store/theme/hook'
import { createStyle } from '@/utils/tools'
import { type BoardItem } from '@/store/leaderboard/state'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const CARD_MARGIN = 12
const CARD_PADDING = 16

// 榜单分组配置
const BOARD_GROUPS = {
  hot: {
    title: '🔥 热门榜单',
    keywords: ['热歌', '飙升', '新歌', '原创', '排行'],
  },
  region: {
    title: '🌍 地区榜单',
    keywords: ['韩', '日本', '欧美', '台湾', '香港', '内地', '俄', '越南', '泰'],
  },
  genre: {
    title: '🎵 风格榜单',
    keywords: ['说唱', '电音', '古典', 'ACG', 'DJ', '摇滚', '民谣', '国风', 'BEAT'],
  },
  special: {
    title: '✨ 特色榜单',
    keywords: ['VIP', 'KTV', '听歌识曲', '网络', '抖', '快', '直播', '赏音'],
  },
}

// 根据名称判断榜单所属分组
function getBoardGroup(boardName: string): keyof typeof BOARD_GROUPS | 'other' {
  for (const [groupKey, groupConfig] of Object.entries(BOARD_GROUPS)) {
    if (groupConfig.keywords.some(keyword => boardName.includes(keyword))) {
      return groupKey as keyof typeof BOARD_GROUPS
    }
  }
  return 'other'
}

// 根据榜单名称获取对应的图标
function getBoardIcon(boardName: string): string {
  // 热度相关
  if (boardName.includes('飙升')) return '🚀'
  if (boardName.includes('热歌') || boardName.includes('热门')) return '🔥'
  if (boardName.includes('新歌')) return '✨'
  if (boardName.includes('原创')) return '🎨'
  if (boardName.includes('潜力') || boardName.includes('爆款')) return '💎'
  if (boardName.includes('流行')) return '⭐'
  
  // 音乐风格
  if (boardName.includes('说唱') || boardName.includes('Rap')) return '🎤'
  if (boardName.includes('电音') || boardName.includes('舞曲') || boardName.includes('Beatport')) return '🎧'
  if (boardName.includes('古典')) return '🎻'
  if (boardName.includes('摇滚') || boardName.includes('Rock')) return '🎸'
  if (boardName.includes('民谣')) return '🌾'
  if (boardName.includes('国风')) return '🏮'
  if (boardName.includes('乡村')) return '🤠'
  if (boardName.includes('BEAT')) return '🥁'
  
  // ACG相关
  if (boardName.includes('动漫')) return '🎬'
  if (boardName.includes('游戏')) return '🎮'
  if (boardName.includes('VOCALOID')) return '🤖'
  if (boardName.includes('ACG')) return '🌟'
  
  // 地区
  if (boardName.includes('韩') || boardName.includes('Korea')) return '🇰🇷'
  if (boardName.includes('日本') || boardName.includes('日语') || boardName.includes('Oricon')) return '🇯🇵'
  if (boardName.includes('欧美') || boardName.includes('Billboard') || boardName.includes('美国')) return '🇺🇸'
  if (boardName.includes('UK') || boardName.includes('英国')) return '🇬🇧'
  if (boardName.includes('法国')) return '🇫🇷'
  if (boardName.includes('台湾')) return '🏝️'
  if (boardName.includes('香港')) return '🏙️'
  if (boardName.includes('内地')) return '🇨🇳'
  if (boardName.includes('俄罗斯') || boardName.includes('俄语')) return '🇷🇺'
  if (boardName.includes('越南') || boardName.includes('越南语')) return '🇻🇳'
  if (boardName.includes('泰') || boardName.includes('泰语')) return '🇹🇭'
  
  // 特色榜单
  if (boardName.includes('KTV') || boardName.includes('唛')) return '🎙️'
  if (boardName.includes('VIP') || boardName.includes('黑胶')) return '👑'
  if (boardName.includes('抖') || boardName.includes('快')) return '📱'
  if (boardName.includes('网络')) return '🌐'
  if (boardName.includes('听歌识曲')) return '🔍'
  if (boardName.includes('直播') || boardName.includes('LOOK')) return '📺'
  if (boardName.includes('赏音')) return '👂'
  if (boardName.includes('影视') || boardName.includes('综艺')) return '🎬'
  if (boardName.includes('编辑推荐')) return '📝'
  if (boardName.includes('有声')) return '📻'
  if (boardName.includes('校园')) return '🎓'
  
  // DJ相关
  if (boardName.includes('DJ') && !boardName.includes('电音')) return '🎛️'
  
  return '🎵' // 默认音乐图标
}

// 卡片背景色配置
const CARD_COLORS = [
  '#8B7FFF', // 紫色
  '#4FC3F7', // 蓝色  
  '#FF6B9D', // 粉红
  '#FFB74D', // 橙色
  '#81C784', // 绿色
  '#64B5F6', // 天蓝
  '#F06292', // 玫红
  '#9575CD', // 深紫
]

interface BoardCardProps {
  board: BoardItem
  index: number
  onPress: (boardId: string) => void
}

const BoardCard = memo(({ board, index, onPress }: BoardCardProps) => {
  const theme = useTheme()
  const cardColor = CARD_COLORS[index % CARD_COLORS.length]
  const icon = getBoardIcon(board.name)

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => onPress(board.id)}
      style={styles.cardContainer}
    >
      <View style={[styles.card, { backgroundColor: cardColor }]}>
        <View style={styles.cardContent}>
          <View style={styles.cardLeft}>
            <View style={styles.iconWrapper}>
              <Text size={28}>{icon}</Text>
            </View>
          </View>
          <View style={styles.cardRight}>
            <Text style={styles.boardName} size={17} color="#FFFFFF" numberOfLines={1}>
              {board.name}
            </Text>
            <Text style={styles.boardDesc} size={13} color="rgba(255,255,255,0.85)">
              点击查看榜单详情
            </Text>
          </View>
          <View style={styles.cardArrow}>
            <Text size={20} color="rgba(255,255,255,0.6)">›</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  )
})

interface BoardsGridProps {
  boards: BoardItem[]
  onSelectBoard: (boardId: string, boardName: string) => void
  currentSource?: LX.OnlineSource
  onSourceChange?: (source: LX.OnlineSource) => void
}

interface BoardGroupSectionProps {
  title: string
  boards: BoardItem[]
  startIndex: number
  onPress: (boardId: string) => void
}

const BoardGroupSection = memo(({ title, boards, startIndex, onPress }: BoardGroupSectionProps) => {
  const theme = useTheme()
  const [expanded, setExpanded] = useState(true)

  if (boards.length === 0) return null

  return (
    <View style={styles.groupSection}>
      <TouchableOpacity
        style={styles.groupHeader}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <Text style={styles.groupTitle} size={16} color={theme['c-font']}>
          {title}
        </Text>
        <View style={styles.groupBadge}>
          <Text size={12} color={theme['c-font-label']} style={styles.badgeText}>
            {boards.length} 个榜单
          </Text>
          <Text size={14} color={theme['c-font-label']} style={styles.expandIcon}>
            {expanded ? '▼' : '▶'}
          </Text>
        </View>
      </TouchableOpacity>
      
      {expanded && (
        <View style={styles.cardsContainer}>
          {boards.map((board, index) => (
            <BoardCard
              key={board.id}
              board={board}
              index={startIndex + index}
              onPress={onPress}
            />
          ))}
        </View>
      )}
    </View>
  )
})

const BoardsGrid = memo(({ boards, onSelectBoard, currentSource = 'wy', onSourceChange }: BoardsGridProps) => {
  const theme = useTheme()

  const handlePress = useCallback((boardId: string) => {
    const board = boards.find(b => b.id === boardId)
    if (board) {
      onSelectBoard(boardId, board.name)
    }
  }, [boards, onSelectBoard])

  const handleSourceToggle = useCallback(() => {
    if (onSourceChange) {
      const newSource = currentSource === 'wy' ? 'tx' : 'wy'
      onSourceChange(newSource)
    }
  }, [currentSource, onSourceChange])

  // 将榜单分组
  const groupedBoards = useCallback(() => {
    const groups: Record<string, BoardItem[]> = {
      hot: [],
      region: [],
      genre: [],
      special: [],
      other: [],
    }
    
    boards.forEach(board => {
      const group = getBoardGroup(board.name)
      groups[group].push(board)
    })
    
    return groups
  }, [boards])

  const boardGroups = groupedBoards()

  const sourceNames = {
    wy: '网易云音乐',
    tx: 'QQ音乐',
  } as const

  let currentIndex = 0

  return (
    <View style={styles.wrapper}>
      {/* 背景装饰层 */}
      <View style={StyleSheet.absoluteFillObject}>
        {/* 渐变背景效果 - 顶部 */}
        <View style={[styles.gradientTop, { backgroundColor: currentSource === 'wy' ? 'rgba(255, 107, 157, 0.05)' : 'rgba(79, 195, 247, 0.05)' }]} />
        
        {/* 渐变背景效果 - 中部 */}
        <View style={[styles.gradientMiddle, { backgroundColor: currentSource === 'wy' ? 'rgba(139, 127, 255, 0.04)' : 'rgba(129, 199, 132, 0.04)' }]} />
        
        {/* 装饰圆圈 - 左上 */}
        <View style={[styles.decorCircle, styles.decorCircle1, { backgroundColor: currentSource === 'wy' ? 'rgba(255, 107, 157, 0.08)' : 'rgba(79, 195, 247, 0.08)' }]} />
        
        {/* 装饰圆圈 - 右下 */}
        <View style={[styles.decorCircle, styles.decorCircle2, { backgroundColor: currentSource === 'wy' ? 'rgba(139, 127, 255, 0.06)' : 'rgba(129, 199, 132, 0.06)' }]} />
        
        {/* 装饰圆圈 - 右上小 */}
        <View style={[styles.decorCircle, styles.decorCircle3, { backgroundColor: currentSource === 'wy' ? 'rgba(255, 179, 77, 0.05)' : 'rgba(100, 181, 246, 0.05)' }]} />
      </View>
      
      <ScrollView
        style={[styles.container, { backgroundColor: 'transparent' }]}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* 音源切换按钮 */}
        {onSourceChange && (
          <View style={styles.sourceToggleContainer}>
            <View style={styles.sourceSwitcher}>
              <TouchableOpacity
                style={[
                  styles.sourceOption,
                  currentSource === 'wy' && { ...styles.sourceOptionActive, backgroundColor: '#FF6B9D' }
                ]}
                onPress={() => currentSource !== 'wy' && handleSourceToggle()}
                activeOpacity={0.8}
              >
                <Text size={15} color={currentSource === 'wy' ? '#FFFFFF' : theme['c-font']}>
                  🎵 网易云
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.sourceOption,
                  currentSource === 'tx' && { ...styles.sourceOptionActive, backgroundColor: '#4FC3F7' }
                ]}
                onPress={() => currentSource !== 'tx' && handleSourceToggle()}
                activeOpacity={0.8}
              >
                <Text size={15} color={currentSource === 'tx' ? '#FFFFFF' : theme['c-font']}>
                  🎶 QQ音乐
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        
        {/* 分组显示榜单 */}
        {Object.entries(BOARD_GROUPS).map(([groupKey, groupConfig]) => {
          const groupBoards = boardGroups[groupKey]
          const section = (
            <BoardGroupSection
              key={groupKey}
              title={groupConfig.title}
              boards={groupBoards}
              startIndex={currentIndex}
              onPress={handlePress}
            />
          )
          currentIndex += groupBoards.length
          return section
        })}
        
        {/* 其他榜单 */}
        {boardGroups.other.length > 0 && (
          <BoardGroupSection
            title="📋 其他榜单"
            boards={boardGroups.other}
            startIndex={currentIndex}
            onPress={handlePress}
          />
        )}
      </ScrollView>
    </View>
  )
})

const styles = createStyle({
  wrapper: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: CARD_MARGIN,
    paddingBottom: CARD_MARGIN * 3,
  },
  // 背景渐变层
  gradientTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '60%',
    opacity: 0.8,
  },
  gradientMiddle: {
    position: 'absolute',
    top: '40%',
    left: 0,
    right: 0,
    height: '60%',
    opacity: 0.6,
  },
  // 装饰圆圈
  decorCircle: {
    position: 'absolute',
    borderRadius: 9999,
  },
  decorCircle1: {
    width: 280,
    height: 280,
    top: -80,
    left: -60,
  },
  decorCircle2: {
    width: 220,
    height: 220,
    bottom: -40,
    right: -50,
  },
  decorCircle3: {
    width: 140,
    height: 140,
    top: 60,
    right: -30,
  },
  sourceToggleContainer: {
    paddingHorizontal: CARD_PADDING,
    paddingVertical: CARD_MARGIN,
    marginBottom: CARD_MARGIN * 2,
  },
  sourceSwitcher: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 4,
  },
  sourceOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  sourceOptionActive: {
  },
  groupSection: {
    marginBottom: CARD_MARGIN * 2,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: CARD_MARGIN * 2,
    paddingVertical: 12,
    marginBottom: CARD_MARGIN,
  },
  groupTitle: {
    fontWeight: 'bold',
  },
  groupBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeText: {
    marginRight: 8,
  },
  expandIcon: {
    marginLeft: 4,
  },
  cardsContainer: {
    paddingHorizontal: CARD_PADDING,
  },
  cardContainer: {
    marginBottom: CARD_MARGIN,
  },
  card: {
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardLeft: {
    marginRight: 14,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardRight: {
    flex: 1,
  },
  boardName: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  boardDesc: {
    opacity: 0.9,
  },
  cardArrow: {
    marginLeft: 8,
  },
})

export default BoardsGrid

