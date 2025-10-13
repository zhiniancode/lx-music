import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { ScrollView, View, TouchableOpacity } from 'react-native'
import { type Source, type InitState } from '@/store/hotSearch/state'
import { getList } from '@/core/hotSearch'
import Text from '@/components/common/Text'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import { useI18n } from '@/lang'


interface ListProps {
  onSearch: (keyword: string) => void
}
export interface HotSearchRankType {
  show: (source: Source) => void
}

export type List = NonNullable<InitState['sourceList'][keyof InitState['sourceList']]>

interface RankItemProps {
  keyword: string
  index: number
  onSearch: (keyword: string) => void
}

const RankItem = ({ keyword, index, onSearch }: RankItemProps) => {
  const theme = useTheme()
  const rank = index + 1
  
  // 前三名使用不同颜色
  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return '#FF6B6B'
      case 2: return '#FF9F43'
      case 3: return '#FFC107'
      default: return theme['c-font-label']
    }
  }

  const getRankStyle = (rank: number) => {
    if (rank <= 3) {
      return {
        ...styles.rankNumber,
        ...styles.rankTopThree,
        backgroundColor: getRankColor(rank),
      }
    }
    return styles.rankNumber
  }

  return (
    <TouchableOpacity
      style={styles.rankItem}
      onPress={() => onSearch(keyword)}
      activeOpacity={0.7}
    >
      <View style={getRankStyle(rank)}>
        <Text 
          size={rank <= 3 ? 14 : 13} 
          color={rank <= 3 ? '#FFFFFF' : getRankColor(rank)}
          style={styles.rankText}
        >
          {rank}
        </Text>
      </View>
      <Text 
        style={styles.keyword} 
        size={15}
        numberOfLines={1}
        color={theme['c-font']}
      >
        {keyword}
      </Text>
    </TouchableOpacity>
  )
}

export default forwardRef<HotSearchRankType, ListProps>((props, ref) => {
  const [list, setList] = useState<List>([])
  const theme = useTheme()
  const t = useI18n()

  const isUnmountedRef = useRef(false)
  useEffect(() => {
    isUnmountedRef.current = false
    return () => {
      isUnmountedRef.current = true
    }
  }, [])

  useImperativeHandle(ref, () => ({
    show(source) {
      void getList(source).then((list) => {
        if (isUnmountedRef.current) return
        // 只取前20条
        setList(list.slice(0, 20))
      })
    },
  }), [])

  return (
    list.length
      ? (
          <View style={styles.container}>
            <View style={styles.header}>
              <Text size={18} color={theme['c-font']} style={styles.title}>
                热搜列表
              </Text>
              <View style={styles.badge}>
                <Text size={12} color="#FF6B6B">
                  HOT
                </Text>
              </View>
            </View>
            <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
              {list.map((keyword, index) => (
                <RankItem 
                  keyword={keyword} 
                  key={`${keyword}_${index}`} 
                  index={index}
                  onSearch={props.onSearch} 
                />
              ))}
            </ScrollView>
          </View>
        )
      : null
  )
})


const styles = createStyle({
  container: {
    flex: 1,
    paddingTop: 15,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontWeight: 'bold',
  },
  badge: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
  },
  list: {
    flex: 1,
  },
  rankItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(128, 128, 128, 0.1)',
  },
  rankNumber: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  rankTopThree: {
    borderRadius: 14,
  },
  rankText: {
    fontWeight: 'bold',
  },
  keyword: {
    flex: 1,
    lineHeight: 22,
  },
})

