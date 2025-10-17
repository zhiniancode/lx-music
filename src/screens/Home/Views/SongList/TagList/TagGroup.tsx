import { View } from 'react-native'

import Button from '@/components/common/Button'
import { type TagInfoItem } from '@/store/songlist/state'
import { useTheme } from '@/store/theme/hook'
import { createStyle } from '@/utils/tools'
import Text from '@/components/common/Text'

export interface TagGroupProps {
  name: string
  list: TagInfoItem[]
  onTagChange: (name: string, id: string) => void
  activeId: string
}

export default ({ name, list, onTagChange, activeId }: TagGroupProps) => {
  const theme = useTheme()
  console.log('TagGroup render - name:', name, 'list count:', list.length, 'activeId:', activeId)
  
  return (
    <View style={styles.groupContainer}>
      {
        name
          ? <Text style={styles.tagTypeTitle} color={theme['c-font-label']}>{name}</Text>
          : null
      }
      <View style={styles.tagTypeList}>
        {list.map(item => {
          console.log('Tag item:', item.name, 'id:', item.id, 'active:', activeId == item.id)
          return activeId == item.id
            ? (
                <View style={{ ...styles.tagButton, ...styles.tagButtonActive, backgroundColor: theme['c-primary-background'] }} key={item.id}>
                  <Text style={styles.tagButtonText} color={theme['c-primary-font']}>{item.name}</Text>
                </View>
              )
            : (
                <Button
                  style={{ ...styles.tagButton, backgroundColor: theme['c-button-background'] }}
                  key={item.id}
                  onPress={() => { onTagChange(item.name, item.id) }}
                >
                  <Text style={styles.tagButtonText} color={theme['c-font']}>{item.name}</Text>
                </Button>
              )
        })}
      </View>
    </View>
  )
}

const styles = createStyle({
  groupContainer: {
    marginBottom: 8,
  },
  tagTypeTitle: {
    marginTop: 8,
    marginBottom: 10,
    fontSize: 13,
    fontWeight: '500',
  },
  tagTypeList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginLeft: -6,
    marginRight: -6,
  },
  tagButton: {
    borderRadius: 18,
    marginHorizontal: 6,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tagButtonActive: {
    borderColor: 'transparent',
  },
  tagButtonText: {
    fontSize: 13,
    paddingHorizontal: 16,
    paddingVertical: 7,
    fontWeight: '400',
  },
})
