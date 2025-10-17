// import { getPlayInfo } from '@/utils/data'
// import { log } from '@/utils/log'
import { init as musicSdkInit } from '@/utils/musicSdk'
import { getUserLists, setUserList } from '@/core/list'
import { setNavActiveId } from '../common'
import { getViewPrevState, getUserApiList, addUserApi } from '@/utils/data'
import { bootLog } from '@/utils/bootLog'
import { getDislikeInfo, setDislikeInfo } from '@/core/dislikeList'
import { unlink } from '@/utils/fs'
import { TEMP_FILE_PATH } from '@/utils/tools'
import { PRESET_USER_APIS } from '@/config/defaultUserApi'
// import { play, playList } from '../player/player'

// const initPrevPlayInfo = async(appSetting: LX.AppSetting) => {
//   const info = await getPlayInfo()
//   global.lx.restorePlayInfo = null
//   if (!info?.listId || info.index < 0) return
//   const list = await getListMusics(info.listId)
//   if (!list[info.index]) return
//   global.lx.restorePlayInfo = info
//   await playList(info.listId, info.index)

//   if (appSetting['player.startupAutoPlay']) setTimeout(play)
// }

/**
 * 初始化预置音源
 * 检查是否已有预置音源，如果没有则自动添加
 * 如果当前没有设置音源，则将第一个预置音源设为当前音源
 */
const initDefaultUserApi = async(appSetting: LX.AppSetting) => {
  try {
    bootLog('Checking preset user APIs...')
    const userApis = await getUserApiList()
    
    let firstAvailableApiId: string | undefined
    
    // 遍历所有预置API源
    for (const presetApi of PRESET_USER_APIS) {
      // 检查是否已存在该预置源（通过名称检查）
      const existingApi = userApis.find(api => api.name === presetApi.name)
      
      if (!existingApi) {
        try {
          bootLog(`Adding preset user API: ${presetApi.name}...`)
          const addedApi = await addUserApi(presetApi.script)
          if (!firstAvailableApiId) firstAvailableApiId = addedApi.id
          bootLog(`Preset user API added: ${presetApi.name}`)
        } catch (err) {
          console.error(`Failed to add preset API ${presetApi.name}:`, err)
          bootLog(`Failed to add preset API: ${presetApi.name}`)
        }
      } else {
        if (!firstAvailableApiId) firstAvailableApiId = existingApi.id
        bootLog(`Preset user API already exists: ${presetApi.name}`)
      }
    }
    
    // 如果当前没有设置音源，将第一个可用的预置音源设为当前音源
    if (!appSetting['common.apiSource'] && firstAvailableApiId) {
      bootLog('Setting first available preset API as current source...')
      const { updateSetting } = await import('../common')
      updateSetting({ 'common.apiSource': firstAvailableApiId })
      bootLog('Preset user API set as current source.')
    }
  } catch (err) {
    console.error('Failed to init preset user APIs:', err)
    bootLog('Preset user APIs init failed.')
  }
}

export default async(appSetting: LX.AppSetting) => {
  // await Promise.all([
  //   initUserApi(), // 自定义API
  // ]).catch(err => log.error(err))
  void musicSdkInit() // 初始化音乐sdk
  bootLog('User list init...')
  setUserList(await getUserLists()) // 获取用户列表
  setDislikeInfo(await getDislikeInfo()) // 获取不喜欢列表
  bootLog('User list inited.')
  
  // 初始化预置音源
  await initDefaultUserApi(appSetting)
  
  // 始终默认打开主页，不恢复上次退出时的页面
  setNavActiveId('nav_home')
  void unlink(TEMP_FILE_PATH)
  // await initPrevPlayInfo(appSetting).catch(err => log.error(err)) // 初始化上次的歌曲播放信息
}
