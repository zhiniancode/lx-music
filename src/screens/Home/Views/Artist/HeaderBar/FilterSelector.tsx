import { memo, useCallback } from 'react'
import { View, TouchableOpacity, ScrollView } from 'react-native'
import Text from '@/components/common/Text'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import { setArtistArea, setArtistType, setArtistGenre } from '../state'
import { useArtistSource, useArtistArea, useArtistType, useArtistGenre } from '../state'

// QQ音乐分类配置
const QQ_AREAS = [
  { id: -100, name: '全部' },
  { id: 200, name: '内地' },
  { id: 2, name: '港台' },
  { id: 5, name: '欧美' },
  { id: 3, name: '韩国' },
  { id: 4, name: '日本' },
]

const QQ_TYPES = [
  { id: -100, name: '全部' },
  { id: 0, name: '男歌手' },
  { id: 1, name: '女歌手' },
  { id: 2, name: '组合' },
]

const QQ_GENRES = [
  { id: -100, name: '全部' },
  { id: 1, name: '流行' },
  { id: 2, name: '摇滚' },
  { id: 3, name: '民谣' },
  { id: 4, name: '电子' },
  { id: 5, name: '爵士' },
  { id: 6, name: '嘻哈' },
  { id: 8, name: 'R&B' },
  { id: 9, name: '轻音乐' },
]

// 网易云分类配置（仅供参考，实际API不支持）
const WY_AREAS = [
  { id: -1, name: '全部' },
  { id: 7, name: '华语' },
  { id: 96, name: '欧美' },
  { id: 8, name: '日本' },
  { id: 16, name: '韩国' },
  { id: 0, name: '其他' },
]

const WY_TYPES = [
  { id: -1, name: '全部' },
  { id: 1, name: '男歌手' },
  { id: 2, name: '女歌手' },
  { id: 3, name: '乐队' },
]

interface FilterItem {
  id: number
  name: string
}

interface FilterRowProps {
  title: string
  items: FilterItem[]
  selectedId: number
  onSelect: (id: number) => void
}

const FilterRow = memo(({ title, items, selectedId, onSelect }: FilterRowProps) => {
  const theme = useTheme()

  return (
    <View style={styles.filterRow}>
      <Text size={13} color={theme['c-font']} style={styles.filterTitle}>
        {title}
      </Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterItems}
      >
        {items.map(item => {
          const isSelected = item.id === selectedId
          return (
            <TouchableOpacity
              key={item.id}
              style={{
                ...styles.filterItem,
                backgroundColor: isSelected 
                  ? theme['c-primary-font-active'] 
                  : theme['c-content-background'],
                borderColor: isSelected
                  ? theme['c-primary-font-active']
                  : theme['c-border-background'],
              }}
              onPress={() => onSelect(item.id)}
              activeOpacity={0.7}
            >
              <Text
                size={12}
                color={isSelected ? '#fff' : theme['c-font']}
              >
                {item.name}
              </Text>
            </TouchableOpacity>
          )
        })}
      </ScrollView>
    </View>
  )
})

const FilterSelector = memo(() => {
  const theme = useTheme()
  const source = useArtistSource()
  const area = useArtistArea()
  const type = useArtistType()
  const genre = useArtistGenre()

  // 根据音乐源选择配置
  const isQQ = source === 'tx'
  const areas = isQQ ? QQ_AREAS : WY_AREAS
  const types = isQQ ? QQ_TYPES : WY_TYPES
  const genres = isQQ ? QQ_GENRES : []

  const handleAreaChange = useCallback((id: number) => {
    setArtistArea(id)
  }, [])

  const handleTypeChange = useCallback((id: number) => {
    setArtistType(id)
  }, [])

  const handleGenreChange = useCallback((id: number) => {
    setArtistGenre(id)
  }, [])

  // 如果是网易云，显示提示信息
  if (!isQQ) {
    return (
      <View style={{ ...styles.container, backgroundColor: theme['c-primary-background'] }}>
        <View style={styles.infoBox}>
          <Text size={12} color={theme['c-font-label']}>
            网易云音乐暂不支持分类筛选，显示热门歌手列表
          </Text>
        </View>
      </View>
    )
  }

  return (
    <View style={{ ...styles.container, backgroundColor: theme['c-primary-background'] }}>
      <FilterRow
        title="地区"
        items={areas}
        selectedId={area}
        onSelect={handleAreaChange}
      />
      <FilterRow
        title="类型"
        items={types}
        selectedId={type}
        onSelect={handleTypeChange}
      />
      {genres.length > 0 && (
        <FilterRow
          title="流派"
          items={genres}
          selectedId={genre}
          onSelect={handleGenreChange}
        />
      )}
    </View>
  )
})

const styles = createStyle({
  container: {
    paddingVertical: 8,
  },
  infoBox: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  filterRow: {
    marginBottom: 8,
  },
  filterTitle: {
    paddingHorizontal: 12,
    marginBottom: 6,
    fontWeight: '500',
  },
  filterItems: {
    paddingHorizontal: 12,
    gap: 8,
  },
  filterItem: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 8,
  },
})

export default FilterSelector

