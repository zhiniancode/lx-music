/**
 * 云端数据同步功能
 */

import { uploadSyncData, downloadSyncData } from './api'
import { authActions, authState } from '@/store/auth'
import { getData, saveData } from '@/plugins/storage'
import { storageDataPrefix } from '@/config/constant'
import settingState from '@/store/setting/state'

/**
 * 精简歌曲信息，只保留恢复列表所需的核心数据
 * 去除可重新获取的数据（如封面URL、歌词URL等）以节省空间
 */
const compactMusicInfo = (music: any) => {
  if (!music) return music
  
  const compactMeta: any = {
    songId: music.meta.songId,
    albumName: music.meta.albumName,
  }
  
  // 保留音质信息（体积小但很重要）
  if (music.meta.qualitys) {
    compactMeta.qualitys = music.meta.qualitys
  }
  if (music.meta._qualitys) {
    compactMeta._qualitys = music.meta._qualitys
  }
  
  // 保留平台特定的关键ID（不包含URL）
  if (music.meta.albumId) compactMeta.albumId = music.meta.albumId
  if (music.meta.hash) compactMeta.hash = music.meta.hash
  if (music.meta.strMediaMid) compactMeta.strMediaMid = music.meta.strMediaMid
  if (music.meta.copyrightId) compactMeta.copyrightId = music.meta.copyrightId
  if (music.meta.albumMid) compactMeta.albumMid = music.meta.albumMid
  
  // 本地音乐特殊处理
  if (music.source === 'local') {
    compactMeta.filePath = music.meta.filePath
    compactMeta.ext = music.meta.ext
  }
  
  return {
    id: music.id,
    name: music.name,
    singer: music.singer,
    source: music.source,
    interval: music.interval,
    meta: compactMeta,
  }
}

/**
 * 收集需要同步的本地数据
 */
const collectLocalData = async () => {
  try {
    // 获取所有列表数据
    const lists = await getData<any[]>(storageDataPrefix.userList)
    
    // 获取每个列表的歌曲数据
    const listsWithMusic = []
    if (lists && lists.length > 0) {
      for (const list of lists) {
        const musicList = await getData<any[]>(`${storageDataPrefix.list}${list.id}`)
        
        // 精简歌曲数据，减少存储空间
        const compactMusicList = musicList ? musicList.map(compactMusicInfo) : []
        
        listsWithMusic.push({
          ...list,
          musicList: compactMusicList,
        })
      }
    }
    
    // 获取设置数据
    const settings = settingState.setting

    return {
      lists: listsWithMusic,
      settings,
      timestamp: Date.now(),
    }
  } catch (error) {
    console.error('Collect local data error:', error)
    throw error
  }
}

/**
 * 计算数据大小（KB）
 */
const calculateDataSize = (data: any): number => {
  const jsonStr = JSON.stringify(data)
  return Math.round((new Blob([jsonStr]).size) / 1024)
}

/**
 * 同步数据到云端
 */
export const syncToCloud = async (): Promise<{ success: boolean; message: string }> => {
  if (!authState.isLoggedIn || !authState.userInfo?.token) {
    return {
      success: false,
      message: '请先登录',
    }
  }

  try {
    authActions.setSyncStatus(true)
    
    // 收集本地数据
    const localData = await collectLocalData()
    
    // 统计数据信息
    const totalLists = localData.lists.length
    const totalSongs = localData.lists.reduce((sum, list) => sum + (list.musicList?.length || 0), 0)
    const dataSize = calculateDataSize(localData)
    
    console.log(`同步上传: ${totalLists}个列表, ${totalSongs}首歌曲, ${dataSize}KB`)
    
    // 上传到云端
    const result = await uploadSyncData(authState.userInfo.token, localData)
    
    if (result.success) {
      const syncTime = Date.now()
      authActions.setLastSyncTime(syncTime)
      await saveLastSyncTimeToLocal(syncTime)
      return {
        success: true,
        message: `同步成功 (${totalLists}个列表, ${totalSongs}首歌曲, ${dataSize}KB)`,
      }
    } else {
      return {
        success: false,
        message: result.message || '同步失败',
      }
    }
  } catch (error) {
    console.error('Sync to cloud error:', error)
    return {
      success: false,
      message: '同步失败：' + (error as Error).message,
    }
  } finally {
    authActions.setSyncStatus(false)
  }
}

/**
 * 从云端下载数据
 */
export const syncFromCloud = async (): Promise<{ success: boolean; message: string }> => {
  if (!authState.isLoggedIn || !authState.userInfo?.token) {
    return {
      success: false,
      message: '请先登录',
    }
  }

  try {
    authActions.setSyncStatus(true)
    
    // 从云端下载数据
    const result = await downloadSyncData(authState.userInfo.token)
    
    if (result.success && result.data) {
      // 保存列表数据和歌曲数据
      if (result.data.lists) {
        // 分离列表信息和歌曲数据
        const listsInfo = []
        const musicDataToSave = []
        
        for (const list of result.data.lists) {
          // 保存列表信息（不包含歌曲）
          const { musicList, ...listInfo } = list
          listsInfo.push(listInfo)
          
          // 保存歌曲数据到独立存储
          musicDataToSave.push({
            listId: list.id,
            key: `${storageDataPrefix.list}${list.id}`,
            data: musicList || [],
          })
        }
        
        // 保存列表信息
        await saveData(storageDataPrefix.userList, listsInfo)
        
        // 批量保存歌曲数据到存储，并同步更新内存
        const { setMusicList } = require('@/utils/listManage')
        for (const item of musicDataToSave) {
          await saveData(item.key, item.data)
          // 关键：同步更新内存中的音乐列表，UI才能显示
          setMusicList(item.listId, item.data)
        }
        
        console.log(`已恢复 ${musicDataToSave.length} 个列表，共 ${musicDataToSave.reduce((sum, item) => sum + item.data.length, 0)} 首歌曲`)
        
        // 立即更新列表状态，让UI实时刷新
        const listActions = require('@/store/list/action').default
        if (listActions && listActions.setUserLists) {
          listActions.setUserLists(listsInfo)
        }
        
        // 触发列表更新事件，通知UI刷新
        if (global.app_event && global.app_event.myListMusicUpdate) {
          const listIds = musicDataToSave.map(item => item.listId)
          global.app_event.myListMusicUpdate(listIds)
        }
      }
      
      // 更新设置数据（注意：这里可能需要根据实际情况进行合并）
      if (result.data.settings) {
        const { updateSetting } = require('@/core/common')
        updateSetting(result.data.settings)
      }
      
      const syncTime = Date.now()
      authActions.setLastSyncTime(syncTime)
      await saveLastSyncTimeToLocal(syncTime)
      
      // 统计下载的数据
      const totalLists = result.data.lists?.length || 0
      const totalSongs = result.data.lists?.reduce((sum: number, list: any) => sum + (list.musicList?.length || 0), 0) || 0
      
      return {
        success: true,
        message: `下载成功 (${totalLists}个列表, ${totalSongs}首歌曲)`,
      }
    } else {
      return {
        success: false,
        message: result.message || '下载失败',
      }
    }
  } catch (error) {
    console.error('Sync from cloud error:', error)
    return {
      success: false,
      message: '下载失败：' + (error as Error).message,
    }
  } finally {
    authActions.setSyncStatus(false)
  }
}

// 存储key常量
const AUTH_USER_INFO_KEY = storageDataPrefix.syncAuthKey + '_user_info'
const AUTH_LAST_SYNC_TIME_KEY = storageDataPrefix.syncAuthKey + '_last_sync_time'

/**
 * 保存登录信息到本地
 */
export const saveAuthToLocal = async (userInfo: any) => {
  try {
    console.log('保存用户信息到:', AUTH_USER_INFO_KEY)
    await saveData(AUTH_USER_INFO_KEY, userInfo)
    console.log('用户信息保存成功')
  } catch (error) {
    console.error('Save auth to local error:', error)
  }
}

/**
 * 保存最后同步时间到本地
 */
export const saveLastSyncTimeToLocal = async (time: number) => {
  try {
    console.log('保存最后同步时间:', time, new Date(time).toLocaleString())
    console.log('存储key:', AUTH_LAST_SYNC_TIME_KEY)
    await saveData(AUTH_LAST_SYNC_TIME_KEY, time)
    console.log('最后同步时间保存成功')
  } catch (error) {
    console.error('Save last sync time to local error:', error)
  }
}

/**
 * 从本地加载登录信息
 */
export const loadAuthFromLocal = async () => {
  try {
    // 先尝试从旧key加载并迁移数据（兼容性处理）
    const oldUserInfo = await getData<any>('@auth_user_info')
    if (oldUserInfo) {
      console.log('检测到旧版本用户数据，开始迁移...')
      await saveData(AUTH_USER_INFO_KEY, oldUserInfo)
      await saveData('@auth_user_info', null) // 清除旧数据
      console.log('用户信息迁移完成')
    }
    
    const oldSyncTime = await getData<number>('@auth_last_sync_time')
    if (oldSyncTime) {
      console.log('检测到旧版本同步时间，开始迁移...')
      await saveData(AUTH_LAST_SYNC_TIME_KEY, oldSyncTime)
      await saveData('@auth_last_sync_time', null) // 清除旧数据
      console.log('同步时间迁移完成')
    }
    
    // 从新key加载数据
    console.log('从存储加载用户信息，key:', AUTH_USER_INFO_KEY)
    const userInfo = await getData<any>(AUTH_USER_INFO_KEY)
    console.log('加载用户信息:', userInfo ? '成功' : '无数据')
    if (userInfo) {
      authActions.setUserInfo(userInfo)
    }
    
    // 加载最后同步时间
    console.log('从存储加载最后同步时间，key:', AUTH_LAST_SYNC_TIME_KEY)
    const lastSyncTime = await getData<number>(AUTH_LAST_SYNC_TIME_KEY)
    console.log('加载最后同步时间:', lastSyncTime, lastSyncTime ? new Date(lastSyncTime).toLocaleString() : '无数据')
    if (lastSyncTime && typeof lastSyncTime === 'number') {
      authActions.setLastSyncTime(lastSyncTime)
      console.log('最后同步时间设置成功')
    }
  } catch (error) {
    console.error('Load auth from local error:', error)
  }
}

/**
 * 清除本地登录信息
 */
export const clearAuthFromLocal = async () => {
  try {
    console.log('清除用户信息和同步时间')
    await saveData(AUTH_USER_INFO_KEY, null)
    await saveData(AUTH_LAST_SYNC_TIME_KEY, null)
    console.log('清除成功')
  } catch (error) {
    console.error('Clear auth from local error:', error)
  }
}

