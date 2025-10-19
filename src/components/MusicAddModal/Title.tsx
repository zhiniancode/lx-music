import { View } from 'react-native'
import Text from '@/components/common/Text'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import { useI18n } from '@/lang'

export default ({ musicInfo, isMove }: {
  musicInfo: LX.Music.MusicInfo
  isMove: boolean
}) => {
  const theme = useTheme()
  const t = useI18n()
  return (
    <View style={styles.container}>
      <Text style={styles.title} color={theme['c-font']}>
        {t(isMove ? 'list_add_title_first_move' : 'list_add_title_first_add')} <Text color={theme['c-primary-font']}>{musicInfo.name}</Text> {t('list_add_title_last')}
      </Text>
    </View>
  )
}

const styles = createStyle({
  container: {
    flexGrow: 0,
    flexShrink: 0,
  },
  title: {
    textAlign: 'center',
    paddingTop: 15,
    paddingBottom: 15,
  },
})
