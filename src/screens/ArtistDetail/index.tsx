import { memo, useEffect, useState, useCallback } from 'react'
import { View, TouchableOpacity, ActivityIndicator } from 'react-native'
import Text from '@/components/common/Text'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import Header from './Header'
import MusicList from './MusicList'
import AlbumList from './AlbumList'
import { getArtistDetailProps } from './state'

type TabType = 'songs' | 'albums'

const ArtistDetail = memo(() => {
  const theme = useTheme()
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('songs')
  const props = getArtistDetailProps()

  useEffect(() => {
    // Initialize artist detail
    console.log('Artist Detail:', props)
  }, [])

  const renderTabButton = useCallback((tab: TabType, label: string) => {
    const isActive = activeTab === tab
    return (
      <TouchableOpacity
        style={{
          ...styles.tabButton,
          borderBottomWidth: isActive ? 2 : 0,
          borderBottomColor: theme['c-primary-font-active'],
        }}
        onPress={() => setActiveTab(tab)}
        activeOpacity={0.7}
      >
        <Text
          size={15}
          weight={isActive ? 'bold' : 'normal'}
          color={isActive ? theme['c-primary-font-active'] : theme['c-font']}
        >
          {label}
        </Text>
      </TouchableOpacity>
    )
  }, [activeTab, theme])

  return (
    <View style={{ ...styles.container, backgroundColor: theme['c-primary-background'] }}>
      <Header artistId={props.artistId} artistName={props.artistName} />
      
      {/* Tab 栏 */}
      <View style={{ ...styles.tabBar, borderBottomColor: theme['c-border-background'] }}>
        {renderTabButton('songs', '热门歌曲')}
        {renderTabButton('albums', '专辑')}
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={theme['c-primary-font-active']} />
        </View>
      ) : (
        <>
          {activeTab === 'songs' && (
            <MusicList artistId={props.artistId} artistName={props.artistName} />
          )}
          {activeTab === 'albums' && (
            <AlbumList artistId={props.artistId} artistName={props.artistName} />
          )}
        </>
      )}
    </View>
  )
})

const styles = createStyle({
  container: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  tabButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 8,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
})

export default ArtistDetail

