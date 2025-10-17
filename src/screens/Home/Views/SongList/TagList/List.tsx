import { useEffect, useState, useRef, forwardRef, useImperativeHandle } from 'react'
import { View, ScrollView } from 'react-native'

import { createStyle } from '@/utils/tools'
import TagGroup, { type TagGroupProps } from './TagGroup'
import { useI18n } from '@/lang'
import { type TagInfo, type Source } from '@/store/songlist/state'
import { getTags } from '@/core/songlist'
import Text from '@/components/common/Text'
import { useTheme } from '@/store/theme/hook'
// import { BorderWidths } from '@/theme'

export interface ListProps {
  onTagChange: TagGroupProps['onTagChange']
}

export interface ListType {
  loadTag: (source: Source, activeId: string) => void
}

export default forwardRef<ListType, ListProps>(({ onTagChange }, ref) => {
  const theme = useTheme()
  const [activeId, setActiveId] = useState('')
  const [list, setList] = useState<TagInfo['tags']>([])
  const t = useI18n()
  const prevSource = useRef('')

  const isUnmountedRef = useRef(false)
  useEffect(() => {
    isUnmountedRef.current = false
    return () => {
      isUnmountedRef.current = true
    }
  }, [])

  useImperativeHandle(ref, () => ({
    loadTag(source, id) {
      console.log('loadTag called - source:', source, 'id:', id, 'prevSource:', prevSource.current)
      
      if (id != activeId) {
        console.log('Setting activeId to:', id)
        setActiveId(id)
      }
      
      // 总是设置初始列表 - 只显示默认标签
      const defaultTag = { name: t('songlist_tag_default'), id: '', parent_id: '', parent_name: '', source }
      const defaultList = [{ name: t('songlist_tag_hot'), list: [defaultTag] }]
      console.log('Setting initial list:', defaultList)
      setList(defaultList)
      
      // 加载标签数据
      console.log('Calling getTags for source:', source)
      void getTags(source).then(tagInfo => {
        console.log('getTags success, tagInfo:', tagInfo)
        if (isUnmountedRef.current) {
          console.log('Component unmounted, skipping update')
          return
        }
        prevSource.current = source
        // 将默认标签合并到热门标签组
        const newList = [
          { name: t('songlist_tag_hot'), list: [defaultTag, ...tagInfo.hotTag] },
          ...tagInfo.tags,
        ].filter(t => t.list.length)
        console.log('Setting full list, length:', newList.length)
        setList(newList)
      }).catch(err => {
        console.error('getTags error:', err)
      })
    },
  }))


  const handleClose = () => {
    global.app_event.hideSonglistTagList()
  }

  console.log('TagList render - list length:', list.length, 'activeId:', activeId)

  return (
    <View style={styles.container}>
      <View style={{ ...styles.header, backgroundColor: theme['c-primary-background'] }}>
        <Text size={17} style={styles.headerTitle} color={theme['c-primary-font']}>{t('songlist_tags')}</Text>
        <Text size={24} onPress={handleClose} style={styles.closeBtn} color={theme['c-primary-font']}>✕</Text>
      </View>
      <ScrollView style={styles.scrollView} keyboardShouldPersistTaps={'always'}>
        <View style={styles.tagContainer}>
          {
            list.length === 0 ? (
              <View style={styles.blankView}>
                <Text color={theme['c-font-label']} size={14}>标签列表为空</Text>
              </View>
            ) : (
              list.map((type, index) => {
                console.log('Rendering TagGroup:', index, 'name:', type.name, 'items:', type.list.length)
                return (
                  <TagGroup
                    key={index}
                    name={type.name}
                    list={type.list}
                    activeId={activeId}
                    onTagChange={onTagChange}
                  />
                )
              })
            )
          }
          {
            list.length == 1
              ? (
                  <View style={styles.blankView}>
                    <Text color={theme['c-font-label']} size={14}>{t('list_loading')}</Text>
                  </View>
                )
              : null
          }
        </View>
      </ScrollView>
    </View>
  )
})


const styles = createStyle({
  container: {
    flex: 1,
    minHeight: 350,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  headerTitle: {
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  closeBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 32,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  tagContainer: {
    paddingTop: 16,
    paddingLeft: 20,
    paddingRight: 20,
    paddingBottom: 20,
  },
  blankView: {
    paddingTop: 60,
    paddingBottom: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
