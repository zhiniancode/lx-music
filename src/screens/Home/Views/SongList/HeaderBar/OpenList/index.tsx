import { useRef, forwardRef, useImperativeHandle } from 'react'
// import { Icon } from '@/components/common/Icon'
import Button from '@/components/common/Button'
// import { navigations } from '@/navigation'
import Modal, { type ModalType } from './Modal'
import { type Source } from '@/store/songlist/state'
import { createStyle } from '@/utils/tools'
import Text from '@/components/common/Text'
import { useI18n } from '@/lang'
import { navigations } from '@/navigation'
import commonState from '@/store/common/state'
import { useTheme } from '@/store/theme/hook'

// export interface OpenListProps {
//   onTagChange: (name: string, id: string) => void
// }

export interface OpenListType {
  setInfo: (source: Source) => void
}

export default forwardRef<OpenListType, {}>((props, ref) => {
  const t = useI18n()
  const theme = useTheme()
  const modalRef = useRef<ModalType>(null)
  const songlistInfoRef = useRef<{ source: Source }>({ source: 'wy' })

  useImperativeHandle(ref, () => ({
    setInfo(source) {
      songlistInfoRef.current.source = source
    },
  }))

  const handleOpenSonglist = (id: string) => {
    // console.log(id, songlistInfoRef.current.source)
    navigations.pushSonglistDetailScreen(commonState.componentIds.home!, {
      play_count: undefined,
      id,
      author: '',
      name: '',
      img: undefined,
      desc: undefined,
      source: songlistInfoRef.current.source,
    })
  }

  // const handleSourceChange: ModalProps['onSourceChange'] = (source) => {
  //   songlistInfoRef.current.source = source
  // }


  return (
    <>
      <Button style={{ ...styles.button, backgroundColor: theme['c-primary-background'], borderColor: theme['c-primary-background'] }} onPress={() => modalRef.current?.show(songlistInfoRef.current.source)}>
        <Text color={theme['c-primary-font']} style={styles.buttonText}>{t('songlist_open')}</Text>
      </Button>
      <Modal ref={modalRef} onOpenId={handleOpenSonglist} />
    </>
  )
})

const styles = createStyle({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    marginHorizontal: 4,
  },
  buttonText: {
    fontSize: 13,
    fontWeight: '500',
  },
})
