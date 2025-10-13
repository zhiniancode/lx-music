import { memo, useCallback } from 'react'
import { View, TouchableOpacity, ScrollView, Dimensions } from 'react-native'
import Text from '@/components/common/Text'
import { useTheme } from '@/store/theme/hook'
import { createStyle } from '@/utils/tools'
import { type BoardItem } from '@/store/leaderboard/state'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const CARD_MARGIN = 8
const CARD_WIDTH = (SCREEN_WIDTH - CARD_MARGIN * 4) / 2

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

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => onPress(board.id)}
      style={styles.cardContainer}
    >
      <View style={[styles.card, { backgroundColor: cardColor }]}>
        <Text style={styles.boardName} size={20} color="#FFFFFF">
          {board.name}
        </Text>
      </View>
      <View style={styles.cardFooter}>
        <Text style={styles.updateInfo} size={12} color={theme['c-font-label']}>
          更新{board.bangid ? '中' : '完成'}
        </Text>
      </View>
    </TouchableOpacity>
  )
})

interface BoardsGridProps {
  boards: BoardItem[]
  onSelectBoard: (boardId: string, boardName: string) => void
}

const BoardsGrid = memo(({ boards, onSelectBoard }: BoardsGridProps) => {
  const theme = useTheme()

  const handlePress = useCallback((boardId: string) => {
    const board = boards.find(b => b.id === boardId)
    if (board) {
      onSelectBoard(boardId, board.name)
    }
  }, [boards, onSelectBoard])

  return (
    <ScrollView
      style={{ ...styles.container, backgroundColor: theme['c-content-background'] }}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.grid}>
        {boards.map((board, index) => (
          <BoardCard
            key={board.id}
            board={board}
            index={index}
            onPress={handlePress}
          />
        ))}
      </View>
    </ScrollView>
  )
})

const styles = createStyle({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: CARD_MARGIN,
    paddingBottom: CARD_MARGIN * 3,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: CARD_MARGIN,
  },
  cardContainer: {
    width: CARD_WIDTH,
    marginHorizontal: CARD_MARGIN,
    marginBottom: CARD_MARGIN * 2,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_WIDTH * 0.75,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  boardName: {
    textAlign: 'center',
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.15)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  cardFooter: {
    marginTop: 8,
    alignItems: 'center',
  },
  updateInfo: {
    textAlign: 'center',
  },
})

export default BoardsGrid

