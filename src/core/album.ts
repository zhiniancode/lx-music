import musicSdk from '@/utils/musicSdk'

export interface AlbumDetailInfo {
  id: number
  name: string
  picUrl?: string
  artistId: number
  artistName: string
  size: number
  publishTime: number
  company?: string
  description?: string
}

export interface AlbumDetailResult {
  info: AlbumDetailInfo
  songs: LX.Music.MusicInfoOnline[]
}

/**
 * 获取专辑详情及歌曲列表
 * @param source 音乐源
 * @param albumId 专辑ID
 * @returns 专辑详情和歌曲列表
 */
export const getAlbumDetail = async (
  source: LX.Source,
  albumId: number | string,
): Promise<AlbumDetailResult> => {
  try {
    console.log('📡 Getting album detail for source:', source, 'albumId:', albumId)
    
    // 网易云音乐
    if (source === 'wy' && musicSdk.wy?.album?.detail) {
      return await musicSdk.wy.album.detail(albumId)
    }
    
    // QQ音乐
    if (source === 'tx' && musicSdk.tx?.album?.detail) {
      return await musicSdk.tx.album.detail(albumId)
    }
    
    // TODO: 添加其他音乐源的支持
    throw new Error(`Album detail not supported for source: ${source}`)
  } catch (error) {
    console.error('❌ Failed to get album detail:', error)
    throw error
  }
}


