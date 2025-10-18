import { memo, useRef } from 'react'
import { View } from 'react-native'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import SourceSelector, { type ArtistSourceSelectorType } from './SourceSelector'
import FilterSelector from './FilterSelector'

const HeaderBar = memo(() => {
  const theme = useTheme()
  const sourceSelectorRef = useRef<ArtistSourceSelectorType>(null)

  return (
    <View style={{ ...styles.container, backgroundColor: theme['c-primary-background'] }}>
      <View style={styles.row}>
        <SourceSelector ref={sourceSelectorRef} />
      </View>
      <FilterSelector />
    </View>
  )
})

const styles = createStyle({
  container: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128, 128, 128, 0.1)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
})

export default HeaderBar

