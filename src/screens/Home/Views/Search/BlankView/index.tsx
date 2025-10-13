import Text from '@/components/common/Text'
import { useI18n } from '@/lang'
import { useSettingValue } from '@/store/setting/hook'
import { useTheme } from '@/store/theme/hook'
import { createStyle } from '@/utils/tools'
import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { ScrollView, View } from 'react-native'
import HistorySearch, { type HistorySearchType } from './HistorySearch'
import HotSearch, { type HotSearchType } from './HotSearch'
import HotSearchRank, { type HotSearchRankType } from './HotSearchRank'

// 使用现代化排行榜风格的热搜
const USE_RANK_STYLE = true

interface BlankViewProps {
  onSearch: (keyword: string) => void
}
type Source = LX.OnlineSource | 'all'

export interface BlankViewType {
  show: (source: Source) => void
}

export default forwardRef<BlankViewType, BlankViewProps>(({ onSearch }, ref) => {
  // const [listType, setListType] = useState<SearchState['searchType']>('music')
  const [visible, setVisible] = useState(false)
  const hotSearchRef = useRef<HotSearchType>(null)
  const hotSearchRankRef = useRef<HotSearchRankType>(null)
  const historySearchRef = useRef<HistorySearchType>(null)
  const isShowHotSearch = useSettingValue('search.isShowHotSearch')
  const isShowHistorySearch = useSettingValue('search.isShowHistorySearch')
  const t = useI18n()
  const theme = useTheme()

  const handleShow = (source: Source) => {
    if (USE_RANK_STYLE) {
      hotSearchRankRef.current?.show(source)
    } else {
      hotSearchRef.current?.show(source)
    }
    historySearchRef.current?.show()
  }

  useImperativeHandle(ref, () => ({
    show(source) {
      if (visible) handleShow(source)
      else {
        setVisible(true)
        requestAnimationFrame(() => {
          handleShow(source)
        })
      }
    },
  }), [visible])

  return (
    visible
      ? isShowHotSearch || isShowHistorySearch
        ? (
            USE_RANK_STYLE && isShowHotSearch && !isShowHistorySearch ? (
              // 如果只显示热搜且使用排行榜风格，则使用全屏布局
              <View style={styles.rankContainer}>
                <HotSearchRank ref={hotSearchRankRef} onSearch={onSearch} />
              </View>
            ) : (
              <ScrollView>
                <View style={styles.content}>
                  { 
                    isShowHotSearch ? (
                      USE_RANK_STYLE ? (
                        <HotSearchRank ref={hotSearchRankRef} onSearch={onSearch} />
                      ) : (
                        <HotSearch ref={hotSearchRef} onSearch={onSearch} />
                      )
                    ) : null 
                  }
                  { isShowHistorySearch ? <HistorySearch ref={historySearchRef} onSearch={onSearch} /> : null }
                </View>
              </ScrollView>
            )
          )
        : (
            <View style={styles.welcome}>
              <Text size={22} color={theme['c-font-label']}>{t('search__welcome')}</Text>
            </View>
          )
      : null

  )
})


const styles = createStyle({
  content: {
    // paddingTop: 15,
    paddingBottom: 15,
    paddingLeft: 15,
    paddingRight: 15,
  },
  rankContainer: {
    flex: 1,
    paddingHorizontal: 15,
  },
  welcome: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
