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
import { DEFAULT_USER_API_SCRIPT, DEFAULT_USER_API_ID } from '@/config/defaultUserApi'
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
 * 初始化默认音源
 * 检查是否已有默认音源，如果没有则自动添加
 * 如果当前没有设置音源，则将默认音源设为当前音源
 */
const initDefaultUserApi = async(appSetting: LX.AppSetting) => {
  try {
    bootLog('Checking default user API...')
    const userApis = await getUserApiList()
    
    // 检查是否已存在默认音源（通过名称检查）
    const existingDefaultApi = userApis.find(api => 
      api.name === '微信公众号：洛雪音乐'
    )
    
    let defaultApiId = existingDefaultApi?.id
    
    if (!existingDefaultApi) {
      bootLog('Adding default user API...')
      const addedApi = await addUserApi(DEFAULT_USER_API_SCRIPT)
      defaultApiId = addedApi.id
      bootLog('Default user API added.')
    } else {
      bootLog('Default user API already exists.')
    }
    
    // 如果当前没有设置音源，将默认音源设为当前音源
    if (!appSetting['common.apiSource'] && defaultApiId) {
      bootLog('Setting default user API as current source...')
      const { updateSetting } = await import('../common')
      updateSetting({ 'common.apiSource': defaultApiId })
      bootLog('Default user API set as current source.')
    }
  } catch (err) {
    console.error('Failed to init default user API:', err)
    bootLog('Default user API init failed.')
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
  
  // 初始化默认音源
  await initDefaultUserApi(appSetting)
  
  setNavActiveId((await getViewPrevState()).id)
  void unlink(TEMP_FILE_PATH)
  // await initPrevPlayInfo(appSetting).catch(err => log.error(err)) // 初始化上次的歌曲播放信息
}
