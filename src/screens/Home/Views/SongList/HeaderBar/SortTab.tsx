import { forwardRef, useImperativeHandle, useMemo, useState } from 'react'
import { View } from 'react-native'
import songlistState, { type SortInfo, type Source } from '@/store/songlist/state'
import { useI18n } from '@/lang'
import { useTheme } from '@/store/theme/hook'
import Text from '@/components/common/Text'
import { createStyle } from '@/utils/tools'
import DorpDownMenu from '@/components/common/DorpDownMenu'

export interface SortTabProps {
  onSortChange: (id: string) => void
}

export interface SortTabType {
  setSource: (source: Source, activeTab: SortInfo['id']) => void
}


export default forwardRef<SortTabType, SortTabProps>(({ onSortChange }, ref) => {
  const [sortList, setSortList] = useState<SortInfo[]>([])
  const [activeId, setActiveId] = useState<SortInfo['id']>('')
  const t = useI18n()
  const theme = useTheme()

  useImperativeHandle(ref, () => ({
    setSource(source, activeTab) {
      setSortList(songlistState.sortList[source]!)
      setActiveId(activeTab)
    },
  }))

  const sorts = useMemo(() => {
    return sortList.map(s => ({ label: t(`songlist_${s.tid}`), action: s.id }))
  }, [sortList, t])

  const activeSort = useMemo(() => {
    const sort = sortList.find(s => s.id === activeId)
    return sort ? t(`songlist_${sort.tid}`) : ''
  }, [sortList, activeId, t])

  const handleSortChange = ({ action }: { action: string }) => {
    onSortChange(action)
    setActiveId(action)
  }

  // 如果只有一个选项，显示为纯文字标签（不可点击）
  if (sortList.length <= 1) {
    return (
      <View style={{ ...styles.button, backgroundColor: theme['c-button-background'], borderColor: theme['c-border-background'] }}>
        <View style={styles.buttonContent}>
          <Text style={styles.buttonText} size={13} color={theme['c-font']}>{activeSort}</Text>
        </View>
      </View>
    )
  }

  return (
    <DorpDownMenu
      menus={sorts}
      onPress={handleSortChange}
      fontSize={13}
      activeId={activeId}
      btnStyle={{ ...styles.button, backgroundColor: theme['c-button-background'], borderColor: theme['c-border-background'] }}
    >
      <View style={styles.buttonContent} pointerEvents="none">
        <Text style={styles.buttonText} size={13} color={theme['c-font']}>{activeSort}</Text>
        <Text style={styles.arrow} color={theme['c-font-label']}> ▼</Text>
      </View>
    </DorpDownMenu>
  )
})


const styles = createStyle({
  button: {
    paddingLeft: 12,
    paddingRight: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    marginHorizontal: 4,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    textAlign: 'center',
  },
  arrow: {
    fontSize: 10,
    marginLeft: 2,
  },
})
