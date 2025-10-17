import { useEffect, useRef } from 'react'
import Content from './Content'
import TagList, { type TagListType } from './TagList'
import { useTheme } from '@/store/theme/hook'
import Modal, { type ModalType } from '@/components/common/Modal'
import { View } from 'react-native'
import { createStyle } from '@/utils/tools'
import { scaleSizeW } from '@/utils/pixelRatio'
import { type Source } from '@/store/songlist/state'

const MAX_WIDTH = scaleSizeW(560)

export default () => {
  const modalRef = useRef<ModalType>(null)
  const tagListRef = useRef<TagListType>(null)
  const theme = useTheme()

  useEffect(() => {
    const handleShow = (source: Source, id: string) => {
      console.log('SongList - showSonglistTagList event received, source:', source, 'id:', id)
      
      // 先打开Modal，让组件挂载
      console.log('Opening modal')
      modalRef.current?.setVisible(true)
      
      // 等待组件挂载后再加载数据
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (tagListRef.current?.loadTag) {
            console.log('Calling tagListRef.loadTag')
            tagListRef.current.loadTag(source, id)
          } else {
            console.warn('tagListRef.current.loadTag still not available')
          }
        })
      })
    }
    
    const handleHide = () => {
      console.log('SongList - hideSonglistTagList event received')
      modalRef.current?.setVisible(false)
    }

    global.app_event.on('showSonglistTagList', handleShow)
    global.app_event.on('hideSonglistTagList', handleHide)

    return () => {
      global.app_event.off('showSonglistTagList', handleShow)
      global.app_event.off('hideSonglistTagList', handleHide)
    }
  }, [])

  return (
    <>
      <Content />
      <Modal
        ref={modalRef}
        bgColor="rgba(0,0,0,0.6)"
        animationType="fade"
      >
        <View style={styles.modalContainer}>
          <View 
            style={{ ...styles.modalContent, backgroundColor: theme['c-content-background'], maxWidth: MAX_WIDTH }}
            onStartShouldSetResponder={() => true}
          >
            <TagList ref={tagListRef} />
          </View>
        </View>
      </Modal>
    </>
  )
}

const styles = createStyle({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  modalContent: {
    borderRadius: 16,
    minHeight: 350,
    maxHeight: '85%',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
})
