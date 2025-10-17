import Button from '@/components/common/Button'
import Text from '@/components/common/Text'
import { useI18n } from '@/lang'
import { createStyle } from '@/utils/tools'
import { forwardRef, useImperativeHandle, useState } from 'react'
import { useTheme } from '@/store/theme/hook'


export interface CurrentTagBtnProps {
  onShowList: () => void
}

export interface CurrentTagBtnType {
  setCurrentTagInfo: (name: string) => void
}

export default forwardRef<CurrentTagBtnType, CurrentTagBtnProps>(({ onShowList }, ref) => {
  const t = useI18n()
  const theme = useTheme()
  const [name, setName] = useState(t('songlist_tag_default'))

  useImperativeHandle(ref, () => ({
    setCurrentTagInfo(name) {
      if (!name) name = t('songlist_tag_default')
      setName(name)
    },
  }))

  return (
    <Button style={{ ...styles.btn, backgroundColor: theme['c-button-background'], borderColor: theme['c-border-background'] }} onPress={onShowList}>
      <Text style={styles.sourceMenu} color={theme['c-font']}>{name || t('songlist_tag_default')}</Text>
      <Text style={styles.arrow} color={theme['c-font-label']}> ▼</Text>
    </Button>
  )
})


const styles = createStyle({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 12,
    paddingRight: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    marginHorizontal: 4,
  },
  sourceMenu: {
    textAlign: 'center',
    fontSize: 13,
  },
  arrow: {
    fontSize: 10,
    marginLeft: 2,
  },
})
