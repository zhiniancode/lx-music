import { memo } from 'react'
import { TouchableOpacity, View } from 'react-native'
import { useNavActiveId } from '@/store/common/hook'
import { useTheme } from '@/store/theme/hook'
import { Icon } from '@/components/common/Icon'
import { createStyle } from '@/utils/tools'
import { setNavActiveId } from '@/core/common'
import type { InitState } from '@/store/common/state'
import Text from '@/components/common/Text'
import { useI18n } from '@/lang'

// 底部导航菜单项
const TAB_MENUS = [
  { id: 'nav_home', icon: 'home' },
  { id: 'nav_songlist', icon: 'album' },
  { id: 'nav_top', icon: 'leaderboard' },
  { id: 'nav_love', icon: 'love' },
  { id: 'nav_setting', icon: 'setting' },
] as const

type TabIdType = typeof TAB_MENUS[number]['id']

interface TabItemProps {
  id: TabIdType
  icon: string
  isActive: boolean
  onPress: (id: TabIdType) => void
}

const TabItem = memo(({ id, icon, isActive, onPress }: TabItemProps) => {
  const t = useI18n()
  const theme = useTheme()
  
  return (
    <TouchableOpacity 
      style={styles.tabItem} 
      onPress={() => onPress(id)}
      activeOpacity={0.7}
    >
      <Icon 
        name={icon} 
        size={24} 
        color={isActive ? theme['c-primary-font-active'] : theme['c-font-label']} 
      />
      <Text 
        style={styles.tabText} 
        size={11}
        color={isActive ? theme['c-primary-font-active'] : theme['c-font-label']}
      >
        {t(id)}
      </Text>
    </TouchableOpacity>
  )
})

const BottomTabBar = memo(() => {
  const theme = useTheme()
  const activeId = useNavActiveId()

  const handlePress = (id: TabIdType) => {
    if (activeId === id) return
    setNavActiveId(id)
  }

  return (
    <View style={{ ...styles.container, backgroundColor: theme['c-content-background'] }}>
      {TAB_MENUS.map(menu => (
        <TabItem 
          key={menu.id} 
          id={menu.id} 
          icon={menu.icon} 
          isActive={activeId === menu.id}
          onPress={handlePress} 
        />
      ))}
    </View>
  )
})

const styles = createStyle({
  container: {
    width: '100%',
    height: 55,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(128, 128, 128, 0.2)',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    paddingVertical: 4,
  },
  tabText: {
    marginTop: 2,
  },
})

export default BottomTabBar

