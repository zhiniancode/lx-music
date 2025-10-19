/**
 * 云端API接口模块
 * 服务器地址配置在 src/config/cloudConfig.ts
 */

import { API_BASE_URL } from '@/config/cloudConfig'

export { API_BASE_URL }

interface LoginParams {
  username: string
  password: string
}

interface RegisterParams {
  username: string
  password: string
  email: string
  inviteCode: string
}

interface LoginResponse {
  success: boolean
  data?: {
    id: string
    username: string
    email: string
    token: string
  }
  message?: string
}

interface SyncData {
  lists: any[] // 歌单数据
  settings: any // 设置数据
  timestamp: number
}

interface SyncResponse {
  success: boolean
  data?: SyncData
  message?: string
}

/**
 * 用户登录
 */
export const login = async (params: LoginParams): Promise<LoginResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    })
    return await response.json()
  } catch (error) {
    console.error('Login error:', error)
    return {
      success: false,
      message: '网络错误，请检查服务器连接',
    }
  }
}

/**
 * 用户注册
 */
export const register = async (params: RegisterParams): Promise<LoginResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    })
    return await response.json()
  } catch (error) {
    console.error('Register error:', error)
    return {
      success: false,
      message: '网络错误，请检查服务器连接',
    }
  }
}

/**
 * 上传同步数据到云端
 */
export const uploadSyncData = async (token: string, data: SyncData): Promise<SyncResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/sync/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    })
    return await response.json()
  } catch (error) {
    console.error('Upload sync data error:', error)
    return {
      success: false,
      message: '上传失败，请检查网络连接',
    }
  }
}

/**
 * 从云端下载同步数据
 */
export const downloadSyncData = async (token: string): Promise<SyncResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/sync/download`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
    return await response.json()
  } catch (error) {
    console.error('Download sync data error:', error)
    return {
      success: false,
      message: '下载失败，请检查网络连接',
    }
  }
}

/**
 * 获取云端歌单列表
 */
export const getCloudPlaylists = async (token: string): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE_URL}/playlists`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
    return await response.json()
  } catch (error) {
    console.error('Get cloud playlists error:', error)
    return {
      success: false,
      message: '获取歌单失败，请检查网络连接',
    }
  }
}

