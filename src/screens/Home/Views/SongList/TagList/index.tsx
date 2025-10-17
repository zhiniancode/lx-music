import { useRef, forwardRef, useImperativeHandle } from 'react'

import { type Source } from '@/store/songlist/state'
import List, { type ListProps, type ListType } from './List'

export interface TagListType {
  loadTag: (source: Source, id: string) => void
}

export default forwardRef<TagListType>((props, ref) => {
  const listRef = useRef<ListType>(null)

  useImperativeHandle(ref, () => ({
    loadTag(source: Source, id: string) {
      console.log('TagList loadTag called - source:', source, 'id:', id)
      listRef.current?.loadTag(source, id)
    },
  }))

  const handleTagChange: ListProps['onTagChange'] = (name, id) => {
    console.log('TagList handleTagChange - name:', name, 'id:', id)
    global.app_event.hideSonglistTagList()
    requestAnimationFrame(() => {
      global.app_event.songlistTagInfoChange(name, id)
    })
  }

  return <List ref={listRef} onTagChange={handleTagChange} />
})
