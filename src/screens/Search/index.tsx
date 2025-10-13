import { useEffect } from 'react'
import { View, TouchableOpacity } from 'react-native'
import { useTheme } from '@/store/theme/hook'
import { useStatusbarHeight } from '@/store/common/hook'
import { createStyle } from '@/utils/tools'
import { Icon } from '@/components/common/Icon'
import StatusBar from '@/components/common/StatusBar'
import { scaleSizeH } from '@/utils/pixelRatio'
import { HEADER_HEIGHT } from '@/config/constant'
import SearchView from '@/screens/Home/Views/Search'
import { pop } from '@/navigation'
import PageContent from '@/components/PageContent'

interface Props {
  componentId: string
}

const SearchScreen = ({ componentId }: Props) => {
  const theme = useTheme()
  const statusBarHeight = useStatusbarHeight()

  const handleBack = () => {
    void pop(componentId)
  }

  return (
    <PageContent>
      <StatusBar />
      <View style={{
        ...styles.header,
        height: scaleSizeH(HEADER_HEIGHT) + statusBarHeight,
        paddingTop: statusBarHeight,
        backgroundColor: theme['c-content-background'],
      }}>
        <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
          <Icon color={theme['c-font']} name="chevron-left" size={24} />
        </TouchableOpacity>
      </View>
      <SearchView />
    </PageContent>
  )
}

const styles = createStyle({
  header: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 5,
    paddingRight: 5,
    zIndex: 10,
  },
  backBtn: {
    width: HEADER_HEIGHT,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
})

export default SearchScreen

