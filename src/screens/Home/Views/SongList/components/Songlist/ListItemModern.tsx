import { memo } from 'react'
import { View, Platform, TouchableOpacity, Dimensions } from 'react-native'
import { createStyle } from '@/utils/tools'
import { type ListInfoItem } from '@/store/songlist/state'
import Text from '@/components/common/Text'
import { scaleSizeW } from '@/utils/pixelRatio'
import { NAV_SHEAR_NATIVE_IDS } from '@/config/constant'
import { useTheme } from '@/store/theme/hook'
import Image from '@/components/common/Image'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const ITEM_MARGIN = 12
const COLUMN_COUNT = 2
const ITEM_WIDTH = (SCREEN_WIDTH - ITEM_MARGIN * (COLUMN_COUNT + 1)) / COLUMN_COUNT

export default memo(({ item, index, showSource, onPress }: {
  item: ListInfoItem
  index: number
  showSource: boolean
  onPress: (item: ListInfoItem, index: number) => void
}) => {
  const theme = useTheme()
  
  const handlePress = () => {
    onPress(item, index)
  }

  if (!item.source) {
    return <View style={{ ...styles.listItem, width: ITEM_WIDTH }} />
  }

  return (
    <View style={styles.listItem}>
      <TouchableOpacity 
        activeOpacity={0.9} 
        onPress={handlePress}
        style={styles.cardContainer}
      >
        <View style={styles.imageContainer}>
          <Image 
            url={item.img} 
            nativeID={`${NAV_SHEAR_NATIVE_IDS.songlistDetail_pic}_from_${item.id}`} 
            style={styles.coverImage}
          />
          {showSource && (
            <View style={styles.sourceLabel}>
              <Text size={10} color="#FFFFFF">
                {item.source.toUpperCase()}
              </Text>
            </View>
          )}
          {/* 封面遮罩 */}
          <View style={styles.coverOverlay} />
        </View>
        
        <View style={styles.infoContainer}>
          <Text 
            style={styles.title} 
            size={14}
            numberOfLines={2}
            color={theme['c-font']}
          >
            {item.name}
          </Text>
          {item.play_count && (
            <Text 
              style={styles.playCount} 
              size={12}
              color={theme['c-font-label']}
            >
              播放 {formatPlayCount(item.play_count)}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    </View>
  )
})

// 格式化播放次数
const formatPlayCount = (count: number | string): string => {
  const num = typeof count === 'string' ? parseInt(count) : count
  if (isNaN(num)) return '-'
  
  if (num >= 100000000) {
    return (num / 100000000).toFixed(1) + '亿'
  } else if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万'
  }
  return num.toString()
}

const styles = createStyle({
  listItem: {
    width: ITEM_WIDTH,
    marginBottom: ITEM_MARGIN * 1.5,
  },
  cardContainer: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 4,
        },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  coverImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  coverOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '30%',
    background: 'linear-gradient(to top, rgba(0,0,0,0.3), transparent)',
  },
  sourceLabel: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    backdropFilter: 'blur(4px)',
  },
  infoContainer: {
    paddingTop: 8,
    paddingHorizontal: 4,
  },
  title: {
    lineHeight: 20,
    marginBottom: 4,
    fontWeight: '500',
  },
  playCount: {
    opacity: 0.7,
  },
})

