import { View } from 'react-native'
import { createStyle } from '@/utils/tools'
import { memo } from 'react'
import Content from './Content'

const Artist = memo(() => {
  return (
    <View style={styles.container}>
      <Content />
    </View>
  )
})

const styles = createStyle({
  container: {
    flex: 1,
  },
})

export default Artist

