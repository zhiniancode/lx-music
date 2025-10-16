/**
 * 多平台热歌榜合并工具
 * 用于比较不同音乐平台的热歌榜，合并并去重
 */

interface MusicWithHotScore extends LX.Music.MusicInfoOnline {
  hotScore: number // 热度分数
  rankPosition: number // 原始排名
  platformSource: string // 平台来源标识
}

/**
 * 标准化歌曲名称，用于比较
 * 去除括号、空格等干扰字符
 */
function normalizeName(name: string): string {
  return name
    .replace(/[\(\)（）\[\]【】\s\-\—\_]/g, '') // 去除括号、空格、横线
    .replace(/\([^)]*\)/g, '') // 去除圆括号及内容
    .replace(/（[^）]*）/g, '') // 去除中文括号及内容
    .toLowerCase()
    .trim()
}

/**
 * 标准化歌手名称，用于比较
 */
function normalizeSinger(singer: string): string {
  return singer
    .replace(/[\s\-\—\_\/、,，]/g, '') // 去除分隔符
    .toLowerCase()
    .trim()
}

/**
 * 判断两首歌是否为同一首
 * @param music1 第一首歌
 * @param music2 第二首歌
 * @returns 是否为同一首歌
 */
function isSameMusic(music1: LX.Music.MusicInfoOnline, music2: LX.Music.MusicInfoOnline): boolean {
  const name1 = normalizeName(music1.name)
  const name2 = normalizeName(music2.name)
  const singer1 = normalizeSinger(music1.singer)
  const singer2 = normalizeSinger(music2.singer)

  // 歌名和歌手都匹配才认为是同一首歌
  return name1 === name2 && singer1 === singer2
}

/**
 * 计算热度分数（基于排名）
 * @param rank 排名位置（从0开始）
 * @param total 总数
 * @returns 热度分数（0-100）
 */
function calculateHotScore(rank: number, total: number): number {
  // 使用非线性算法，让排名靠前的歌曲分数差距更大
  const normalizedRank = rank / total // 0-1之间
  const score = 100 * (1 - normalizedRank) * (1 - normalizedRank * 0.5)
  return Math.round(score * 10) / 10 // 保留一位小数
}

/**
 * 为音乐列表添加热度分数
 * @param musicList 音乐列表
 * @param platformSource 平台来源标识
 * @returns 带热度分数的音乐列表
 */
function addHotScore(musicList: LX.Music.MusicInfoOnline[], platformSource: string): MusicWithHotScore[] {
  return musicList.map((music, index) => ({
    ...music,
    hotScore: calculateHotScore(index, musicList.length),
    rankPosition: index + 1,
    platformSource,
  }))
}

/**
 * 合并多个平台的热歌榜
 * @param platformMusicLists 多个平台的音乐列表数组
 * @returns 合并去重后的音乐列表，按热度排序
 */
export function mergeHotMusic(platformMusicLists: Array<{
  list: LX.Music.MusicInfoOnline[]
  source: string
}>): LX.Music.MusicInfoOnline[] {
  // 为每个平台的歌曲添加热度分数
  const allMusicWithScores: MusicWithHotScore[] = []
  
  platformMusicLists.forEach(({ list, source }) => {
    const musicWithScores = addHotScore(list, source)
    allMusicWithScores.push(...musicWithScores)
  })

  // 去重：如果多个平台都有同一首歌，保留热度最高的
  const uniqueMusic: MusicWithHotScore[] = []
  const seenMusicMap = new Map<string, MusicWithHotScore>()

  allMusicWithScores.forEach(music => {
    // 生成唯一标识
    const uniqueKey = `${normalizeName(music.name)}_${normalizeSinger(music.singer)}`
    
    const existing = seenMusicMap.get(uniqueKey)
    if (!existing) {
      // 第一次遇到这首歌
      seenMusicMap.set(uniqueKey, music)
      uniqueMusic.push(music)
    } else if (music.hotScore > existing.hotScore) {
      // 如果当前歌曲热度更高，替换
      const index = uniqueMusic.indexOf(existing)
      if (index !== -1) {
        uniqueMusic[index] = music
        seenMusicMap.set(uniqueKey, music)
      }
    }
  })

  // 按热度分数排序（从高到低）
  uniqueMusic.sort((a, b) => b.hotScore - a.hotScore)

  // 移除额外的热度信息，返回原始音乐信息
  return uniqueMusic.map(({ hotScore, rankPosition, platformSource, ...music }) => music)
}

/**
 * 为 Promise 添加超时控制
 */
function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error('请求超时')), timeoutMs)
    )
  ])
}

/**
 * 获取多平台热歌推荐
 * @param sources 平台源标识数组，如 ['wy', 'tx']
 * @param getBoardListFn 获取排行榜列表的函数
 * @param getListDetailFn 获取榜单详情的函数
 * @param boardIds 指定的榜单ID映射，如 { wy: 'wy__3778678', tx: 'tx__26' }
 * @param limit 每个平台获取的歌曲数量
 * @param timeout 单个平台请求超时时间（毫秒），默认5秒
 * @returns 合并后的音乐列表
 */
export async function getMultiPlatformHotMusic(
  sources: LX.OnlineSource[],
  getListDetailFn: (id: string, page: number) => Promise<{ list: LX.Music.MusicInfoOnline[] }>,
  boardIds: Record<string, string>,
  limit: number = 30,
  timeout: number = 5000
): Promise<LX.Music.MusicInfoOnline[]> {
  try {
    // 并行获取多个平台的数据，每个请求都有超时限制
    const promises = sources.map(async (source) => {
      const boardId = boardIds[source]
      if (!boardId) {
        console.warn(`⚠️ 未找到平台 ${source} 的榜单ID`)
        return null
      }

      try {
        const detail = await withTimeout(
          getListDetailFn(boardId, 1),
          timeout
        )
        console.log(`✅ 获取 ${source} 热歌榜成功:`, detail.list.length, '首')
        return {
          list: detail.list.slice(0, limit),
          source,
        }
      } catch (error) {
        console.error(`❌ 获取 ${source} 热歌榜失败:`, error)
        return null
      }
    })

    const results = await Promise.all(promises)
    
    // 过滤掉失败的请求
    const validResults = results.filter(result => result !== null) as Array<{
      list: LX.Music.MusicInfoOnline[]
      source: string
    }>

    if (validResults.length === 0) {
      console.error('❌ 所有平台数据获取失败')
      return []
    }

    console.log(`🎵 成功获取 ${validResults.length} 个平台的数据，开始合并...`)
    
    // 合并并去重
    const mergedMusic = mergeHotMusic(validResults)
    
    console.log(`✨ 合并完成，共 ${mergedMusic.length} 首歌曲（已去重）`)
    
    return mergedMusic
  } catch (error) {
    console.error('❌ 获取多平台热歌失败:', error)
    return []
  }
}

