import { forwardRef, useImperativeHandle, useRef, useEffect } from 'react'
import { View, type ViewStyle } from 'react-native'
import { createStyle } from '@/utils/tools'
import SourceSelector, {
  type SourceSelectorType as _SourceSelectorType,
  type SourceSelectorProps as _SourceSelectorProps,
} from '@/components/SourceSelector'
import settingState from '@/store/setting/state'
import { setArtistSource } from '../state'

// 支持网易云音乐和QQ音乐
const ARTIST_SOURCES = ['wy', 'tx'] as const
type ArtistSource = typeof ARTIST_SOURCES[number]
type Sources = Readonly<typeof ARTIST_SOURCES>
type SourceSelectorCommonProps = _SourceSelectorProps<Sources>
type SourceSelectorCommonType = _SourceSelectorType<Sources>

export interface ArtistSourceSelectorProps {
  onSourceChange?: (source: ArtistSource) => void
  style?: ViewStyle
}

export interface ArtistSourceSelectorType {
  setSource: (source: ArtistSource) => void
}

export default forwardRef<ArtistSourceSelectorType, ArtistSourceSelectorProps>(({ style, onSourceChange }, ref) => {
  const sourceSelectorRef = useRef<SourceSelectorCommonType>(null)

  useImperativeHandle(ref, () => ({
    setSource(source) {
      sourceSelectorRef.current?.setSourceList(ARTIST_SOURCES, source)
    },
  }), [])

  useEffect(() => {
    // 初始化时设置源列表，默认使用QQ音乐
    const source = 'tx' as ArtistSource
    sourceSelectorRef.current?.setSourceList(ARTIST_SOURCES, source)
    setArtistSource(source)
  }, [])

  const handleSourceChange = (source: ArtistSource) => {
    setArtistSource(source)
    onSourceChange?.(source)
  }

  return (
    <View style={style}>
      <SourceSelector ref={sourceSelectorRef} onSourceChange={handleSourceChange} center />
    </View>
  )
})

const styles = createStyle({
  selector: {
    // width: 86,
  },
})

