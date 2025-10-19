/**
 * 预加载模块
 * 在显示加载屏幕期间预加载一些数据，提升用户体验
 */

import { bootLog } from '@/utils/bootLog'

/**
 * 预加载热门搜索、排行榜等数据
 */
export const preloadData = async () => {
  bootLog('Starting preload...')
  
  const preloadTasks: Promise<void>[] = []

  // 预加载热门搜索（全部音源）
  preloadTasks.push(
    (async () => {
      try {
        const { getList } = await import('@/core/hotSearch')
        await getList('all')
        bootLog('Hot search preloaded.')
      } catch (err) {
        console.log('Failed to preload hot search:', err)
      }
    })()
  )

  // 预加载排行榜列表（网易云音乐）
  preloadTasks.push(
    (async () => {
      try {
        const { getBoardsList } = await import('@/core/leaderboard')
        await getBoardsList('wy' as LX.OnlineSource)
        bootLog('Leaderboard preloaded.')
      } catch (err) {
        console.log('Failed to preload leaderboard:', err)
      }
    })()
  )

  // 预加载歌单分类（网易云音乐）
  preloadTasks.push(
    (async () => {
      try {
        const { getTags } = await import('@/core/songlist')
        await getTags('wy' as LX.OnlineSource)
        bootLog('Songlist tags preloaded.')
      } catch (err) {
        console.log('Failed to preload songlist tags:', err)
      }
    })()
  )

  // ⭐ 预加载主页热门音乐数据（关键优化）
  preloadTasks.push(
    (async () => {
      try {
        const { getListDetail } = await import('@/core/leaderboard')
        const { getMultiPlatformHotMusic } = await import('@/utils/hotMusicMerge')
        
        bootLog('Preloading homepage music data...')
        
        // 预加载每日推荐（多平台新歌榜）
        const dailyPromise = getMultiPlatformHotMusic(
          ['wy', 'tx'],
          getListDetail,
          {
            wy: 'wy__3779629', // 网易云新歌榜
            tx: 'tx__27',      // QQ音乐新歌榜
          },
          30
        ).catch((err) => {
          console.log('Failed to preload daily music:', err)
          return []
        })

        // 预加载本周最热（多平台热歌榜）
        const hotPromise = getMultiPlatformHotMusic(
          ['wy', 'tx'],
          getListDetail,
          {
            wy: 'wy__3778678', // 网易云热歌榜
            tx: 'tx__26',      // QQ音乐热歌榜
          },
          50
        ).catch((err) => {
          console.log('Failed to preload hot music:', err)
          return []
        })

        await Promise.all([dailyPromise, hotPromise])
        bootLog('Homepage music data preloaded.')
      } catch (err) {
        console.log('Failed to preload homepage music:', err)
      }
    })()
  )

  // 并行执行所有预加载任务，但不阻塞主流程
  await Promise.all(preloadTasks).then(() => {
    bootLog('All preload tasks completed.')
  })
}

/**
 * 创建最小加载时间等待函数
 * @param minDisplayTime 最小显示时间（毫秒）
 */
export const createMinLoadingTimeWaiter = (minDisplayTime: number = 1500) => {
  const startTime = Date.now()
  
  return () => {
    const elapsed = Date.now() - startTime
    const remainingTime = Math.max(0, minDisplayTime - elapsed)
    
    if (remainingTime > 0) {
      bootLog(`Waiting ${remainingTime}ms to ensure smooth animation...`)
      return new Promise(resolve => setTimeout(resolve, remainingTime))
    }
    return Promise.resolve()
  }
}
