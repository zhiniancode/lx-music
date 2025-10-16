export type SearchType = 'music' | 'songlist'

export interface InitState {
  temp_source: 'wy'  // 改为网易云音乐
  // temp_source: LX.OnlineSource
  searchType: SearchType
  searchText: string
  tipListInfo: {
    text: string
    source: 'wy'  // 改为网易云音乐
    list: string[]
  }
  historyList: string[]
}

const state: InitState = {
  temp_source: 'wy',  // 改为网易云音乐
  searchType: 'music',
  searchText: '',
  tipListInfo: {
    text: '',
    source: 'wy',  // 改为网易云音乐
    list: [],
  },
  historyList: [],
}


export default state
