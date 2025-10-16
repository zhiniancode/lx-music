import state, { type InitState, type Source } from './state'
import { sortInsert, similar, arrPush } from '@/utils/common'
import { deduplicationList, toNewMusicInfo } from '@/utils'


export interface SearchResult {
  list: LX.Music.MusicInfoOnline[]
  allPage: number
  limit: number
  total: number
  source: LX.OnlineSource
}


/**
 * 标准化字符串用于比较（去除特殊字符、空格等）
 */
const normalizeString = (str: string): string => {
  return str
    .toLowerCase()
    .replace(/[\s\(\)（）\[\]【】\-\—\_\/、,，·]/g, '')
    .trim()
}

/**
 * 知名歌手数据库（优先显示原唱）
 */
const FAMOUS_ARTISTS = {
  // 华语流行
  '周杰伦': 300,
  '林俊杰': 250,
  '陈奕迅': 280,
  '张学友': 270,
  '刘德华': 260,
  '邓紫棋': 240,
  '李荣浩': 230,
  '薛之谦': 220,
  '毛不易': 210,
  '周深': 200,
  '张杰': 190,
  '王力宏': 250,
  '蔡健雅': 200,
  '田馥甄': 190,
  '五月天': 280,
  'SHE': 230,
  'TFBOYS': 220,
  '易烊千玺': 200,
  '王俊凯': 180,
  '王源': 180,
  '许嵩': 210,
  '汪苏泷': 190,
  '徐良': 180,
  '胡夏': 170,
  '金志文': 160,
  '朴树': 190,
  '许巍': 200,
  '郑钧': 180,
  '窦唯': 170,
  '崔健': 180,
  // 港台经典
  '张国荣': 290,
  '梅艳芳': 280,
  '王菲': 270,
  '邓丽君': 300,
  '谭咏麟': 250,
  '陈百强': 240,
  '李克勤': 220,
  '古巨基': 200,
  '郑秀文': 210,
  '容祖儿': 200,
  'twins': 190,
  // 内地经典
  '刀郎': 220,
  '庞龙': 190,
  '凤凰传奇': 210,
  '筷子兄弟': 180,
  '水木年华': 170,
  '羽泉': 180,
  '零点乐队': 160,
  '黑豹乐队': 170,
  '唐朝乐队': 160,
  // 女歌手
  '孙燕姿': 240,
  '蔡依林': 230,
  '张韶涵': 210,
  '杨丞琳': 190,
  '梁静茹': 220,
  '萧亚轩': 200,
  '那英': 210,
  '王心凌': 180,
  '卓依婷': 170,
  '刘若英': 200,
}

/**
 * 特定歌曲的原唱歌手映射（解决经典歌曲原唱识别问题）
 */
const SONG_ORIGINAL_ARTISTS: Record<string, string[]> = {
  '听妈妈的话': ['周杰伦'],
  '稻香': ['周杰伦'],
  '青花瓷': ['周杰伦'],
  '夜曲': ['周杰伦'],
  '七里香': ['周杰伦'],
  '告白气球': ['周杰伦'],
  '江南': ['林俊杰'],
  '曹操': ['林俊杰'],
  '学不会': ['林俊杰'],
  '一千年以后': ['林俊杰'],
  '十年': ['陈奕迅'],
  '浮夸': ['陈奕迅'],
  '红玫瑰': ['陈奕迅'],
  '光年之外': ['邓紫棋'],
  '泡沫': ['邓紫棋'],
  '喜欢你': ['邓紫棋'],
  '演员': ['薛之谦'],
  '认真的雪': ['薛之谦'],
  '消愁': ['毛不易'],
  '像我这样的人': ['毛不易'],
  '大鱼': ['周深'],
  '起风了': ['买辣椒也用券'], // 抖音翻唱很多，但原唱是买辣椒也用券
  '少年': ['梦然'],
}

/**
 * 计算歌曲的优先级分数（增强原唱识别）
 * @param music 歌曲信息
 * @param keyword 搜索关键词
 * @returns 优先级分数（越高越优先）
 */
const calculatePriority = (music: LX.Music.MusicInfoOnline, keyword: string): number => {
  const normalizedKeyword = normalizeString(keyword)
  const normalizedName = normalizeString(music.name)
  const normalizedSinger = normalizeString(music.singer)
  
  // 基础相似度分数（0-100）
  const similarityScore = similar(keyword, `${music.name} ${music.singer}`)
  
  // 1. 歌名精确匹配（最高优先级）
  let nameMatchBonus = 0
  if (normalizedName === normalizedKeyword) {
    nameMatchBonus = 500 // 歌名完全匹配，最高优先级
  } else if (normalizedName.startsWith(normalizedKeyword)) {
    nameMatchBonus = 200 // 歌名以关键词开头
  } else if (normalizedName.includes(normalizedKeyword)) {
    nameMatchBonus = 100 // 歌名包含关键词
  } else if (normalizedKeyword.includes(normalizedName)) {
    nameMatchBonus = 80 // 关键词包含歌名
  }
  
  // 2. 歌手匹配加分
  let singerMatchBonus = 0
  if (normalizedKeyword.includes(normalizedSinger) && normalizedSinger.length > 1) {
    singerMatchBonus = 150 // 关键词包含歌手名
  } else if (normalizedSinger.includes(normalizedKeyword) && normalizedKeyword.length > 1) {
    singerMatchBonus = 100 // 歌手名包含关键词
  }
  
  // 3. 原唱歌手识别（新增）
  let originalArtistBonus = 0
  const originalArtists = SONG_ORIGINAL_ARTISTS[music.name] || []
  
  // 检查是否为该歌曲的原唱歌手
  for (const originalArtist of originalArtists) {
    if (normalizeString(music.singer).includes(normalizeString(originalArtist))) {
      originalArtistBonus = 800 // 原唱歌手超高优先级
      break
    }
  }
  
  // 4. 知名歌手加分（新增）
  let famousArtistBonus = 0
  for (const [artist, score] of Object.entries(FAMOUS_ARTISTS)) {
    if (normalizeString(music.singer).includes(normalizeString(artist))) {
      famousArtistBonus = score
      break
    }
  }
  
  // 5. 严格惩罚翻唱/伴奏/DJ版本（增强）
  let coverPenalty = 0
  const strictCoverKeywords = [
    '伴奏', '纯音乐', '铃声', '广场舞', '喊麦', '抖音版', '快手版', '伴唱', 'karaoke',
    '网络歌手', '素人', '路人甲', '网红', '主播版', '直播版', '素人翻唱'
  ]
  const mediumCoverKeywords = [
    '翻唱', 'cover', '翻唱版', 'dj版', 'remix', '混音版', '重制版', 
    '翻唱歌手', '翻唱达人', '翻唱小哥', '翻唱小姐姐'
  ]
  const lightCoverKeywords = ['现场版', 'live', '演唱会', '音乐节']
  
  for (const word of strictCoverKeywords) {
    if (normalizedName.includes(word) || normalizedSinger.includes(word)) {
      coverPenalty = -1500 // 加重严重惩罚
      break
    }
  }
  
  if (coverPenalty === 0) {
    for (const word of mediumCoverKeywords) {
      if (normalizedName.includes(word) || normalizedSinger.includes(word)) {
        coverPenalty = -800 // 加重中等惩罚
        break
      }
    }
  }
  
  if (coverPenalty === 0) {
    for (const word of lightCoverKeywords) {
      if (normalizedName.includes(word)) {
        coverPenalty = -150 // 轻微加重轻度惩罚
        break
      }
    }
  }
  
  // 6. 来源平台权重（优化）
  let sourceBonus = 0
  if (music.source === 'wy') {
    sourceBonus = 80 // 提高网易云权重
  } else if (music.source === 'tx') {
    sourceBonus = 70 // 提高QQ音乐权重
  } else if (music.source === 'kg') {
    sourceBonus = 30 // 酷狗
  } else if (music.source === 'kw') {
    sourceBonus = 25 // 酷我
  }
  
  // 7. 歌手类型识别（优化）
  let artistBonus = 0
  const knownArtistKeywords = ['乐队', '乐团', '组合', '合唱团', 'band', '乐坊']
  for (const word of knownArtistKeywords) {
    if (music.singer.includes(word)) {
      artistBonus = 50
      break
    }
  }
  
  // 8. 严格惩罚可疑的用户上传内容（增强）
  let userContentPenalty = 0
  const userContentKeywords = [
    '网友', '路人', '小姐姐', '小哥哥', 'up主', '主播', '网络歌手', 
    '素人', '业余', '翻唱达人', '音乐博主', '抖音达人', '快手红人',
    '直播间', '粉丝', '听众', '路人甲'
  ]
  for (const word of userContentKeywords) {
    if (normalizedSinger.includes(word)) {
      userContentPenalty = -600 // 加重惩罚
      break
    }
  }
  
  // 9. 歌手名过长或包含特殊字符的惩罚（增强）
  if (music.singer.length > 25) {
    userContentPenalty -= 100
  }
  
  // 特殊字符惩罚（可能是拼接的用户名）
  if (/[0-9]{3,}|[!@#$%^&*()_+=\[\]{}|;:,.<>?~`]/.test(music.singer)) {
    userContentPenalty -= 200
  }
  
  // 10. 歌曲质量估算（新增）
  let qualityBonus = 0
  // 如果歌名和歌手都很短且匹配度高，可能质量更好
  if (music.name.length > 1 && music.name.length < 20 && music.singer.length > 1 && music.singer.length < 15) {
    qualityBonus = 20
  }
  
  // 总分计算
  const totalScore = similarityScore + nameMatchBonus + singerMatchBonus + originalArtistBonus + 
                     famousArtistBonus + sourceBonus + artistBonus + qualityBonus + 
                     coverPenalty + userContentPenalty
  
  return totalScore
}

/**
 * 按搜索关键词重新排序列表（优先显示原唱）
 * @param list 歌曲列表
 * @param keyword 搜索关键词
 * @returns 排序后的列表
 */
const handleSortList = (list: LX.Music.MusicInfoOnline[], keyword: string) => {
  let arr: any[] = []
  for (const item of list) {
    arr.push({
      num: calculatePriority(item, keyword),
      data: item,
    })
  }
  // 按优先级分数降序排序
  arr.sort((a, b) => b.num - a.num)
  return arr.map(item => item.data)
}


const setLists = (results: SearchResult[], page: number, text: string): LX.Music.MusicInfoOnline[] => {
  let pages = []
  let totals = []
  let limit = 0
  let list = [] as LX.Music.MusicInfoOnline[]
  for (const source of results) {
    state.maxPages[source.source] = source.allPage
    limit = Math.max(source.limit, limit)
    if (source.allPage < page) continue
    arrPush(list, source.list)
    pages.push(source.allPage)
    totals.push(source.total)
  }
  list = handleSortList(list.map(s => toNewMusicInfo(s) as LX.Music.MusicInfoOnline), text)
  let listInfo = state.listInfos.all
  listInfo.maxPage = Math.max(0, ...pages)
  const total = Math.max(0, ...totals)
  if (page == 1 || (total && list.length)) listInfo.total = total
  else listInfo.total = limit * page
  // listInfo.limit = limit
  listInfo.page = page
  listInfo.list = deduplicationList(page > 1 ? [...listInfo.list, ...list] : list)
  state.source = 'all'

  return listInfo.list
}

const setList = (datas: SearchResult, page: number, text: string): LX.Music.MusicInfoOnline[] => {
  // console.log(datas.source, datas.list)
  let listInfo = state.listInfos[datas.source]!
  const list = datas.list.map(s => toNewMusicInfo(s) as LX.Music.MusicInfoOnline)
  listInfo.list = deduplicationList(page == 1 ? list : [...listInfo.list, ...list])
  if (page == 1 || (datas.total && datas.list.length)) listInfo.total = datas.total
  else listInfo.total = datas.limit * page
  listInfo.maxPage = datas.allPage
  listInfo.page = page
  listInfo.limit = datas.limit
  state.source = datas.source

  return listInfo.list
}

export default {
  setSource(source: InitState['source']) {
    state.source = source
  },
  setSearchText(searchText: InitState['searchText']) {
    state.searchText = searchText
  },
  setListInfo(result: SearchResult | SearchResult[], page: number, text: string) {
    if (Array.isArray(result)) {
      return setLists(result, page, text)
    } else {
      return setList(result, page, text)
    }
  },
  clearListInfo(sourceId: Source) {
    let listInfo = state.listInfos[sourceId]!
    listInfo.list = []
    listInfo.page = 0
    listInfo.maxPage = 0
    listInfo.total = 0
  },
}
