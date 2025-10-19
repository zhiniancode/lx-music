/**
 * 云端数据同步功能
 */

import { uploadSyncData, downloadSyncData } from './api'
import { authActions, authState } from '@/store/auth'
import { getData, saveData } from '@/plugins/storage'
import { storageDataPrefix } from '@/config/constant'
import settingState from '@/store/setting/state'

/**
 * 收集需要同步的本地数据
 */
const collectLocalData = async () => {
  try {
    // 获取所有列表数据
    const lists = await getData<any[]>(storageDataPrefix.userList)
    
    // 获取设置数据
    const settings = settingState.setting

    return {
      lists: lists || [],
      settings,
      timestamp: Date.now(),
    }
  } catch (error) {
    console.error('Collect local data error:', error)
    throw error
  }
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
    
    // 上传到云端
    const result = await uploadSyncData(authState.userInfo.token, localData)
    
    if (result.success) {
      const syncTime = Date.now()
      authActions.setLastSyncTime(syncTime)
      await saveLastSyncTimeToLocal(syncTime)
      return {
        success: true,
        message: '同步成功',
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
      // 保存列表数据
      if (result.data.lists) {
        await saveData(storageDataPrefix.userList, result.data.lists)
        
        // 立即更新列表状态，让UI实时刷新
        const listActions = require('@/store/list/action').default
        if (listActions && listActions.setUserLists) {
          listActions.setUserLists(result.data.lists)
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
      
      return {
        success: true,
        message: '数据下载成功，列表已更新',
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

