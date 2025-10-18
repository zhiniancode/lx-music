import { memo, useCallback } from 'react'
import { View, TouchableOpacity } from 'react-native'
import Text from '@/components/common/Text'
import { Icon } from '@/components/common/Icon'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import { useI18n } from '@/lang'
import { goBack } from '@/navigation/navigation'
import commonState from '@/store/common/state'

interface HeaderProps {
  artistId: number
  artistName: string
}

const Header = memo(({ artistId, artistName }: HeaderProps) => {
  const theme = useTheme()
  const t = useI18n()

  const handleBack = useCallback(() => {
    goBack(commonState.componentIds.home!)
  }, [])

  return (
    <View style={{ ...styles.container, backgroundColor: theme['c-primary-background'] }}>
      <TouchableOpacity onPress={handleBack} style={styles.backButton} activeOpacity={0.7}>
        <Icon name="chevron-left" size={24} color={theme['c-font']} />
      </TouchableOpacity>
      <View style={styles.titleContainer}>
        <Text size={18} weight="bold" color={theme['c-font']} numberOfLines={1}>
          {artistName}
        </Text>
      </View>
      <View style={styles.rightPlaceholder} />
    </View>
  )
})

const styles = createStyle({
  container: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128, 128, 128, 0.1)',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  rightPlaceholder: {
    width: 40,
  },
})

export default Header

