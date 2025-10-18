import { memo, useState, useCallback, useMemo } from 'react'
import { View, FlatList } from 'react-native'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import HeaderBar from './HeaderBar'
import List from './List'

const Content = memo(() => {
  const theme = useTheme()
  
  return (
    <View style={{ ...styles.container, backgroundColor: theme['c-primary-background'] }}>
      <HeaderBar />
      <List />
    </View>
  )
})

const styles = createStyle({
  container: {
    flex: 1,
  },
})

export default Content

