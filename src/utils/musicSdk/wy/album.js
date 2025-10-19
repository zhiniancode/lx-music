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
   * 获取专辑详情及歌曲列表
   * @param {number} albumId - 专辑ID
   * @returns {Promise}
   */
  detail(albumId) {
    const requestObj = httpFetch('https://music.163.com/weapi/v1/album/' + albumId, {
      method: 'post',
      form: weapi({}),
    })
    
    return requestObj.promise.then(({ body, statusCode }) => {
      if (statusCode !== 200) {
        console.error('❌ HTTP error:', statusCode)
        throw new Error(`HTTP错误: ${statusCode}`)
      }
      
      if (!body) {
        console.error('❌ Empty response body')
        throw new Error('API返回空响应')
      }
      
      if (body.code !== 200) {
        console.error('❌ Album API error - code:', body.code, 'message:', body.message || body.msg)
        throw new Error(`API错误: ${body.message || body.msg || body.code}`)
      }
      
      const album = body.album || {}
      const songs = body.songs || []
      
      console.log('💿 Album detail loaded:', album.name, 'with', songs.length, 'songs')
      
      return {
        info: {
          id: album.id,
          name: album.name,
          picUrl: album.picUrl || album.blurPicUrl,
          artistId: album.artist?.id || 0,
          artistName: album.artist?.name || '',
          size: album.size || songs.length,
          publishTime: album.publishTime || 0,
          company: album.company || '',
          description: album.description || '',
        },
        songs: handleMusicResult(songs),
      }
    }).catch(error => {
      console.error('❌ Album detail request error:', error)
      throw error
    })
  },
}





