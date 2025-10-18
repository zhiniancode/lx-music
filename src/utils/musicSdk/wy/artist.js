import { eapiRequest } from './utils/index'
import { weapi } from './utils/crypto'
import { httpFetch } from '../../request'
import { sizeFormate, formatPlayTime } from '../../index'

/**
 * 获取歌手信息字符串
 */
const getSinger = (singers) => {
  if (!singers || !Array.isArray(singers)) return ''
  return singers.map(singer => singer.name).join('、')
}

/**
 * 处理歌曲列表数据
 * 返回符合 LX.Music.MusicInfo 类型的数据结构
 */
const handleMusicResult = (rawList) => {
  if (!rawList || !Array.isArray(rawList)) return []
  
  return rawList.map(item => {
    const types = []
    const _types = {}
    let size

    // 处理音质信息
    if (item.privilege?.maxBrLevel === 'hires') {
      size = item.hr ? sizeFormate(item.hr.size) : null
      types.push({ type: 'flac24bit', size })
      _types.flac24bit = { size }
    }
    
    switch (item.privilege?.maxbr) {
      case 999000:
        size = item.sq ? sizeFormate(item.sq.size) : null
        types.push({ type: 'flac', size })
        _types.flac = { size }
      case 320000:
        size = item.h ? sizeFormate(item.h.size) : null
        types.push({ type: '320k', size })
        _types['320k'] = { size }
      case 192000:
      case 128000:
        size = item.l ? sizeFormate(item.l.size) : null
        types.push({ type: '128k', size })
        _types['128k'] = { size }
    }

    types.reverse()

    // 返回符合 LX.Music.MusicInfo 类型的结构
    return {
      id: String(item.id),
      name: item.name,
      singer: getSinger(item.ar),
      source: 'wy',
      interval: formatPlayTime(item.dt / 1000),
      meta: {
        songId: item.id,
        albumName: item.al?.name || '',
        albumId: item.al?.id || '',
        picUrl: item.al?.picUrl || null,
        qualitys: types,
        _qualitys: _types,
      },
    }
  })
}

export default {
  /**
   * 获取歌手分类列表
   * @param {Object} params - 查询参数
   * @param {number} params.type - 类型: -1:全部, 1:男歌手, 2:女歌手, 3:乐队
   * @param {number} params.area - 地区: -1:全部, 7:华语, 96:欧美, 8:日本, 16:韩国, 0:其他
   * @param {string} params.initial - 首字母: -1:热门, 0:#, a-z
   * @param {number} params.limit - 返回数量，默认30
   * @param {number} params.offset - 偏移数量，默认0
   * @returns {Promise}
   */
  list(params = {}) {
    const { type = -1, area = -1, initial = '-1', limit = 30, offset = 0 } = params
    
    // 当type和area都是-1时，使用热门歌手API
    if (type === -1 && area === -1) {
      console.log('🔍 使用 /top/artists API (全部类型+全部地区)')
      
      const requestObj = httpFetch('https://music.163.com/weapi/artist/top', {
        method: 'post',
        form: weapi({
          limit,
          offset,
          total: true,
        }),
      })
      
      return requestObj.promise.then(({ body, statusCode }) => {
        if (!body) {
          throw new Error('API返回空响应')
        }
        
        if (statusCode !== 200) {
          console.error('❌ HTTP Error:', statusCode)
          throw new Error(`HTTP错误: ${statusCode}`)
        }
        
        if (body.code !== 200) {
          console.error('❌ API Error:', body.code, body.message || body.msg)
          throw new Error(`API错误: ${body.message || body.msg || body.code}`)
        }
        
        const artists = body.artists || []
        console.log('👥 Found', artists.length, 'artists (热门歌手)')
        
        if (artists.length > 0) {
          console.log('📋 前3个歌手:', artists.slice(0, 3).map(a => `${a.name}(ID:${a.id})`).join(', '))
        }
        
        return {
          list: artists.map(artist => ({
            id: artist.id,
            name: artist.name,
            picUrl: artist.picUrl || artist.img1v1Url,
            albumSize: artist.albumSize || 0,
            musicSize: artist.musicSize || 0,
          })),
          total: body.more ? 100 : artists.length,
        }
      }).catch(error => {
        console.error('❌ Top artists request failed:', error)
        throw error
      })
    }
    
    // 网易云的 /weapi/artist/list API 已经失效，cat参数不起作用
    // 所有请求都返回同样的热门歌手列表
    // 暂时的解决方案：忽略type参数，只按area筛选（如果area筛选也能工作的话）
    
    console.warn('⚠️ 网易云的歌手分类API已失效，类型筛选功能暂时不可用')
    console.log('📡 尝试使用 /top/artists API 获取热门歌手列表')
    
    // 回退到使用热门歌手API
    const requestObj = httpFetch('https://music.163.com/weapi/artist/top', {
      method: 'post',
      form: weapi({
        limit,
        offset,
        total: true,
      }),
    })
    
    return requestObj.promise.then(({ body, statusCode }) => {
      if (!body) {
        throw new Error('API返回空响应')
      }
      
      if (statusCode !== 200) {
        console.error('❌ HTTP Error:', statusCode)
        throw new Error(`HTTP错误: ${statusCode}`)
      }
      
      if (body.code !== 200) {
        console.error('❌ API Error:', body.code, body.message || body.msg)
        throw new Error(`API错误: ${body.message || body.msg || body.code}`)
      }
      
      const artists = body.artists || []
      console.log('👥 Found', artists.length, 'artists (热门歌手)')
      
      if (artists.length > 0) {
        console.log('📋 前3个歌手:', artists.slice(0, 3).map(a => `${a.name}(ID:${a.id})`).join(', '))
      }
      
      // 提示用户筛选功能不可用
      if (type !== -1) {
        console.warn(`⚠️ 类型筛选(${type})暂时不可用，显示所有类型`)
      }
      if (area !== -1) {
        console.warn(`⚠️ 地区筛选(${area})暂时不可用，显示所有地区`)
      }
      
      return {
        list: artists.map(artist => ({
          id: artist.id,
          name: artist.name,
          picUrl: artist.picUrl || artist.img1v1Url,
          albumSize: artist.albumSize || 0,
          musicSize: artist.musicSize || 0,
        })),
        total: body.more ? 100 : artists.length,
      }
    }).catch(error => {
      console.error('❌ Top artists request failed:', error)
      throw error
    })
    
    // 以下代码保留，如果将来网易云修复了API可以重新启用
    /*
    const areaMap = {
      7: 1000,   // 华语
      96: 2000,  // 欧美
      0: 4000,   // 其他
      8: 6000,   // 日本
      16: 7000,  // 韩国
    }
    
    const areas = area === -1 ? [7, 96, 8, 16, 0] : [area]
    const types = type === -1 ? [1, 2, 3] : [type]
    
    const requests = []
    for (const a of areas) {
      for (const t of types) {
        const cat = areaMap[a] + t
        requests.push({
          cat,
          area: a,
          type: t,
        })
      }
    }
    
    console.log(\`🔍 使用 /artist/list API, 需要请求 \${requests.length} 个分类 (type=\${type}, area=\${area})\`)
    ... (省略请求代码)
    */
  },

  /**
   * 获取歌手热门50首歌曲
   * @param {number} artistId - 歌手ID
   * @returns {Promise}
   */
  topSong(artistId) {
    const requestObj = httpFetch('https://music.163.com/weapi/artist/top/song', {
      method: 'post',
      form: weapi({
        id: artistId,
      }),
    })
    
    return requestObj.promise.then(({ body, statusCode }) => {
      if (statusCode !== 200) {
        console.error('❌ HTTP error:', statusCode)
        throw new Error(`HTTP错误: ${statusCode}`)
      }
      
      if (!body) {
        console.error('❌ Empty response body')
        return []
      }
      
      if (body.code !== 200) {
        console.error('❌ API error - code:', body.code, 'message:', body.message || body.msg)
        // 不抛出错误，而是返回空数组
        return []
      }
      
      const songs = body.songs || []
      console.log('🎵 Found', songs.length, 'top songs for artist:', artistId)
      
      if (songs.length === 0) {
        console.warn('⚠️ No songs found for artist:', artistId)
        return []
      }
      
      return handleMusicResult(songs)
    }).catch(error => {
      console.error('❌ Top songs request error:', error)
      // 返回空数组而不是抛出错误
      return []
    })
  },

  /**
   * 获取歌手全部歌曲
   * @param {Object} params - 查询参数
   * @param {number} params.id - 歌手ID
   * @param {string} params.order - 排序: hot(热门) 或 time(时间)
   * @param {number} params.limit - 返回数量，默认50
   * @param {number} params.offset - 偏移数量，默认0
   * @returns {Promise}
   */
  songs(params = {}) {
    const { id, order = 'hot', limit = 50, offset = 0 } = params
    
    const requestObj = httpFetch('https://music.163.com/weapi/v1/artist/songs', {
      method: 'post',
      form: weapi({
        id,
        private_cloud: 'true',
        work_type: 1,
        order,
        offset,
        limit,
      }),
    })
    
    return requestObj.promise.then(({ body, statusCode }) => {
      if (statusCode !== 200) {
        console.error('❌ HTTP error:', statusCode)
        return { list: [], total: 0 }
      }
      
      if (!body) {
        console.error('❌ Empty response body')
        return { list: [], total: 0 }
      }
      
      if (body.code !== 200) {
        console.error('❌ Songs API error - code:', body.code, 'message:', body.message || body.msg)
        return { list: [], total: 0 }
      }
      
      const songs = body.songs || []
      console.log('🎵 Found', songs.length, 'songs for artist:', id)
      
      if (songs.length === 0) {
        console.warn('⚠️ No songs found for artist:', id)
      }
      
      return {
        list: handleMusicResult(songs),
        total: body.total || 0,
      }
    }).catch(error => {
      console.error('❌ Songs request error:', error)
      return { list: [], total: 0 }
    })
  },

  /**
   * 获取歌手专辑
   * @param {Object} params - 查询参数
   * @param {number} params.id - 歌手ID
   * @param {number} params.limit - 返回数量，默认50
   * @param {number} params.offset - 偏移数量，默认0
   * @param {string} params.order - 排序方式 (网易云不支持此参数，会被忽略)
   * @returns {Promise}
   */
  album(params = {}) {
    const { id, limit = 50, offset = 0, order } = params
    
    // 网易云API不支持按热度排序，order参数会被忽略
    if (order === 'hot') {
      console.warn('⚠️ 网易云不支持按热度排序专辑，将按时间排序')
    }
    
    const requestObj = httpFetch(`https://music.163.com/weapi/artist/albums/${id}`, {
      method: 'post',
      form: weapi({
        limit,
        offset,
        total: true,
      }),
    })
    
    return requestObj.promise.then(({ body, statusCode }) => {
      if (statusCode !== 200) {
        console.error('❌ HTTP error:', statusCode)
        return { list: [], total: 0 }
      }
      
      if (!body) {
        console.error('❌ Empty response body')
        return { list: [], total: 0 }
      }
      
      if (body.code !== 200) {
        console.error('❌ Album API error - code:', body.code, 'message:', body.message || body.msg)
        return { list: [], total: 0 }
      }
      
      const albums = body.hotAlbums || []
      console.log('💿 Found', albums.length, 'albums for artist:', id)
      
      if (albums.length === 0) {
        console.warn('⚠️ No albums found for artist:', id)
      }
      
      return {
        list: albums.map(album => ({
          id: album.id,
          name: album.name,
          picUrl: album.picUrl || album.blurPicUrl,
          artistId: album.artist?.id || id,
          artistName: album.artist?.name || '',
          size: album.size || 0,
          publishTime: album.publishTime || 0,
          company: album.company || '',
          description: album.description || '',
        })),
        total: body.artist?.albumSize || albums.length,
      }
    }).catch(error => {
      console.error('❌ Album request error:', error)
      return { list: [], total: 0 }
    })
  },
}

