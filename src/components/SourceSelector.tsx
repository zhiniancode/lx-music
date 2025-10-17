import { forwardRef, type Ref, useImperativeHandle, useMemo, useState } from 'react'
import { View } from 'react-native'

import DorpDownMenu, { type DorpDownMenuProps as _DorpDownMenuProps } from '@/components/common/DorpDownMenu'
import Text from '@/components/common/Text'
import { useI18n } from '@/lang'

import { useSettingValue } from '@/store/setting/hook'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'

type Sources = Readonly<Array<LX.OnlineSource | 'all'>>

export interface SourceSelectorProps<S extends Sources> {
  fontSize?: number
  center?: _DorpDownMenuProps<any>['center']
  onSourceChange: (source: S[number]) => void
  minimal?: boolean // 简洁模式，不显示边框和背景
}

export interface SourceSelectorType<S extends Sources> {
  setSourceList: (list: S, activeSource: S[number]) => void
}

export const useSourceListI18n = (list: Sources) => {
  const sourceNameType = useSettingValue('common.sourceNameType')
  const t = useI18n()
  return useMemo(() => {
    return list.map(s => ({ label: t(`source_${sourceNameType}_${s}`), action: s }))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list, sourceNameType, t])
}

const Component = <S extends Sources>({ fontSize = 15, center, onSourceChange, minimal = false }: SourceSelectorProps<S>, ref: Ref<SourceSelectorType<S>>) => {
  const sourceNameType = useSettingValue('common.sourceNameType')
  const theme = useTheme()
  const [list, setList] = useState([] as unknown as S)
  const [source, setSource] = useState<S[number]>('wy')
  const t = useI18n()

  useImperativeHandle(ref, () => ({
    setSourceList(list, activeSource) {
      setList(list)
      setSource(activeSource)
    },
  }), [])

  const sourceList_t = useSourceListI18n(list)

  type DorpDownMenuProps = _DorpDownMenuProps<typeof sourceList_t>

  const handleChangeSource: DorpDownMenuProps['onPress'] = ({ action }) => {
    onSourceChange(action)
    setSource(action)
  }

  // 简洁模式：用于搜索框内部，不显示边框和背景
  const btnStyle = minimal 
    ? styles.sourceMenuBtnMinimal 
    : { ...styles.sourceMenuBtn, backgroundColor: theme['c-button-background'], borderColor: theme['c-border-background'] }
  
  const menuStyle = minimal ? styles.sourceMenuMinimal : styles.sourceMenu

  return (
    <DorpDownMenu
      menus={sourceList_t}
      center={center}
      onPress={handleChangeSource}
      fontSize={fontSize}
      activeId={source}
      btnStyle={btnStyle}
    >
      <View style={menuStyle} pointerEvents="none">
        <Text style={{ textAlign: center ? 'center' : 'left' }} numberOfLines={1} size={fontSize} color={theme['c-font']}>{t(`source_${sourceNameType}_${source}`)}</Text>
        <Text style={styles.arrow} color={theme['c-font-label']}> ▼</Text>
      </View>
    </DorpDownMenu>
  )
}

export default forwardRef(Component) as <S extends Sources>(p: SourceSelectorProps<S> & { ref?: Ref<SourceSelectorType<S>> }) => JSX.Element | null


const styles = createStyle({
  sourceMenuBtn: {
    marginHorizontal: 4,
    paddingLeft: 12,
    paddingRight: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  sourceMenuBtnMinimal: {
    // 简洁模式：无边框、无背景
  },
  sourceMenu: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sourceMenuMinimal: {
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
    justifyContent: 'center',
    paddingLeft: 15,
    paddingRight: 15,
  },
  arrow: {
    fontSize: 10,
    marginLeft: 2,
  },
})
