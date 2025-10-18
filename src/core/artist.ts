import musicSdk from '@/utils/musicSdk'

export interface ArtistListParams {
  type: number
  area: number
  initial: string
  limit?: number
  offset?: number
}

export interface ArtistInfo {
  id: number
  name: string
  picUrl?: string
  albumSize?: number
}

export interface ArtistListResult {
  list: ArtistInfo[]
  total: number
}

export interface ArtistSongsParams {
  id: number
  order?: 'hot' | 'time'
  limit?: number
  offset?: number
}

export interface ArtistSongsResult {
  list: LX.Music.MusicInfoOnline[]
  total: number
}

export interface ArtistAlbumParams {
  id: number
  limit?: number
  offset?: number
  order?: 'time' | 'hot'
}

export interface AlbumInfo {
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

export interface ArtistAlbumResult {
  list: AlbumInfo[]
  total: number
}

/**
 * 获取歌手分类列表
 * @param source 音乐源
 * @param params 查询参数
 * @returns 歌手列表
 */
export const getArtistList = async (
  source: LX.Source,
  params: ArtistListParams,
): Promise<ArtistListResult> => {
  try {
    console.log('📡 Getting artist list for source:', source, 'params:', params)
    
    // 网易云音乐
    if (source === 'wy' && musicSdk.wy?.artist?.list) {
      return await musicSdk.wy.artist.list(params)
    }
    
    // QQ音乐
    if (source === 'tx' && musicSdk.tx?.artist?.list) {
      return await musicSdk.tx.artist.list(params)
    }
    
    // TODO: 添加其他音乐源的支持
    throw new Error(`Artist list not supported for source: ${source}`)
  } catch (error) {
    console.error('❌ Failed to get artist list:', error)
    throw error
  }
}

/**
 * 获取歌手热门50首歌曲
 * @param source 音乐源
 * @param artistId 歌手ID
 * @returns 歌曲列表
 */
export const getArtistTopSongs = async (
  source: LX.Source,
  artistId: number,
): Promise<LX.Music.MusicInfoOnline[]> => {
  try {
    // 网易云音乐
    if (source === 'wy' && musicSdk.wy?.artist?.topSong) {
      return await musicSdk.wy.artist.topSong(artistId)
    }
    
    // QQ音乐
    if (source === 'tx' && musicSdk.tx?.artist?.topSong) {
      return await musicSdk.tx.artist.topSong(artistId)
    }
    
    // TODO: 添加其他音乐源的支持
    throw new Error(`Artist top songs not supported for source: ${source}`)
  } catch (error) {
    console.error('Failed to get artist top songs:', error)
    throw error
  }
}

/**
 * 获取歌手全部歌曲
 * @param source 音乐源
 * @param params 查询参数
 * @returns 歌曲列表
 */
export const getArtistSongs = async (
  source: LX.Source,
  params: ArtistSongsParams,
): Promise<ArtistSongsResult> => {
  try {
    // 网易云音乐
    if (source === 'wy' && musicSdk.wy?.artist?.songs) {
      return await musicSdk.wy.artist.songs(params)
    }
    
    // QQ音乐
    if (source === 'tx' && musicSdk.tx?.artist?.songs) {
      return await musicSdk.tx.artist.songs(params)
    }
    
    // TODO: 添加其他音乐源的支持
    throw new Error(`Artist songs not supported for source: ${source}`)
  } catch (error) {
    console.error('Failed to get artist songs:', error)
    throw error
  }
}

/**
 * 获取歌手专辑
 * @param source 音乐源
 * @param params 查询参数
 * @returns 专辑列表
 */
export const getArtistAlbums = async (
  source: LX.Source,
  params: ArtistAlbumParams,
): Promise<ArtistAlbumResult> => {
  try {
    console.log('📡 Getting artist albums for source:', source, 'params:', params)
    
    // 网易云音乐
    if (source === 'wy' && musicSdk.wy?.artist?.album) {
      return await musicSdk.wy.artist.album(params)
    }
    
    // QQ音乐
    if (source === 'tx' && musicSdk.tx?.artist?.album) {
      return await musicSdk.tx.artist.album(params)
    }
    
    // TODO: 添加其他音乐源的支持
    throw new Error(`Artist albums not supported for source: ${source}`)
  } catch (error) {
    console.error('❌ Failed to get artist albums:', error)
    throw error
  }
}

