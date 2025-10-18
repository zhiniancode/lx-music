import { httpFetch } from '../../request'
import { formatPlayTime, sizeFormate } from '../../index'
import { formatSingerName } from '../utils'

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
  
  return rawList.map(rawItem => {
    // QQ音乐的歌曲数据可能在 songInfo 里面
    const item = rawItem.songInfo || rawItem
    
    const types = []
    const _types = {}
    let size

    // 处理音质信息
    const file = item.file || {}
    
    if (file.size_128mp3 && file.size_128mp3 != 0) {
      size = sizeFormate(file.size_128mp3)
      types.push({ type: '128k', size })
      _types['128k'] = { size }
    }
    if (file.size_320mp3 && file.size_320mp3 !== 0) {
      size = sizeFormate(file.size_320mp3)
      types.push({ type: '320k', size })
      _types['320k'] = { size }
    }
    if (file.size_flac && file.size_flac !== 0) {
      size = sizeFormate(file.size_flac)
      types.push({ type: 'flac', size })
      _types.flac = { size }
    }
    if (file.size_hires && file.size_hires !== 0) {
      size = sizeFormate(file.size_hires)
      types.push({ type: 'flac24bit', size })
      _types.flac24bit = { size }
    }

    // 处理专辑信息
    let albumId = ''
    let albumName = ''
    let albumMid = ''
    if (item.album) {
      albumName = item.album.name || item.album.title || ''
      albumId = item.album.id || item.album.albumID || ''
      albumMid = item.album.mid || item.album.albumMid || item.album.albumMID || ''
    }

    // 处理歌手信息
    const singerList = item.singer || item.singers || []
    const singerName = getSinger(singerList)
    const singerMid = singerList.length > 0 ? singerList[0].mid : ''

    // 返回符合 LX.Music.MusicInfo 类型的结构
    return {
      id: String(item.mid || item.songmid),
      name: item.name || item.title || item.songname || '',
      singer: singerName,
      source: 'tx',
      interval: formatPlayTime(item.interval || item.time_public || 0),
      meta: {
        songId: item.id || item.songid,
        albumName,
        albumId: albumMid || albumId,
        albumMid: albumMid,
        strMediaMid: file.media_mid || '',
        songmid: item.mid || item.songmid,
        picUrl: (albumMid === '' || albumMid === '空')
          ? (singerMid ? `https://y.gtimg.cn/music/photo_new/T001R500x500M000${singerMid}.jpg` : '')
          : `https://y.gtimg.cn/music/photo_new/T002R500x500M000${albumMid}.jpg`,
        qualitys: types,
        _qualitys: _types,
      },
    }
  })
}

export default {
  /**
   * 获取歌手分类列表
   * 注意：QQ音乐开放平台API需要 app_id 等认证信息
   * 这里使用公开的 QQ音乐 API（功能受限）
   * 
   * @param {Object} params - 查询参数
   * @param {number} params.area - 地区: -100:全部, 200:内地, 2:港台, 3:韩国, 4:日本, 5:欧美
   * @param {number} params.type - 类型: -100:全部, 0:男, 1:女, 2:组合
   * @param {number} params.genre - 流派: -100:全部, 1:流行, 2:摇滚, etc.
   * @param {string} params.initial - 首字母: 'Hot':全部(热门), 'A'-'Z', '#':特殊字符
   * @param {number} params.limit - 返回数量，默认30
   * @param {number} params.offset - 偏移数量，默认0
   * @returns {Promise}
   */
  list(params = {}) {
    const { area = -100, type = -100, genre = -100, initial = 'Hot', limit = 30, offset = 0 } = params
    
    console.log('🔍 Fetching QQ Music artist list:', { area, type, genre, initial, limit, offset })
    
    // 计算 index 参数（首字母索引，-100表示热门）
    let indexParam = -100
    if (initial !== 'Hot' && initial !== '-1' && initial !== -1) {
      // 如果是字母或#，使用相应的索引
      if (initial === '#') {
        indexParam = 0
      } else if (initial >= 'A' && initial <= 'Z') {
        indexParam = initial.charCodeAt(0) - 'A'.charCodeAt(0) + 1
      } else if (initial >= 'a' && initial <= 'z') {
        indexParam = initial.charCodeAt(0) - 'a'.charCodeAt(0) + 1
      }
    }
    
    // 使用QQ音乐的歌手列表API
    const requestObj = httpFetch('https://u.y.qq.com/cgi-bin/musicu.fcg', {
      method: 'post',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Referer': 'https://y.qq.com/',
      },
      body: {
        comm: {
          ct: 24,
          cv: 0,
        },
        singerList: {
          module: 'Music.SingerListServer',
          method: 'get_singer_list',
          param: {
            area,
            sex: type,
            genre,
            index: indexParam,
            sin: offset,
            cur_page: Math.floor(offset / limit) + 1,
          },
        },
      },
    })
    
    return requestObj.promise.then(({ body, statusCode }) => {
      console.log('📦 QQ Music API response:', { statusCode, code: body?.code })
      
      if (statusCode !== 200) {
        console.error('❌ HTTP error:', statusCode)
        return { list: [], total: 0 }
      }
      
      if (!body || body.code !== 0) {
        console.error('❌ API error:', body?.code, body?.message)
        console.log('📦 Full response:', JSON.stringify(body, null, 2))
        return { list: [], total: 0 }
      }
      
      const data = body.singerList?.data || {}
      const artists = data.singerlist || []
      
      console.log('👥 Found', artists.length, 'artists, total:', data.total)
      
      if (artists.length > 0) {
        console.log('📋 First artist:', artists[0])
        console.log('📋 First artist keys:', Object.keys(artists[0]))
      }
      
      return {
        list: artists.map(artist => ({
          id: artist.singer_id,
          name: artist.singer_name,
          picUrl: `https://y.gtimg.cn/music/photo_new/T001R300x300M000${artist.singer_mid}.jpg`,
          // QQ音乐API可能没有返回专辑数量，暂时设为0或从其他字段获取
          albumSize: artist.albumsize || artist.album_num || artist.albumNum || 0,
          musicSize: artist.songnum || artist.song_num || artist.songNum || 0,
        })),
        total: data.total || artists.length,
      }
    }).catch(error => {
      console.error('❌ Artist list request failed:', error)
      return { list: [], total: 0 }
    })
  },

  /**
   * 获取歌手热门50首歌曲
   * @param {number} singerId - 歌手ID
   * @returns {Promise}
   */
  topSong(singerId) {
    console.log('🎵 Fetching top songs for artist:', singerId)
    
    const requestObj = httpFetch('https://u.y.qq.com/cgi-bin/musicu.fcg', {
      method: 'post',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; WOW64; Trident/5.0)',
        'Referer': 'https://y.qq.com/',
      },
      body: {
        comm: {
          ct: 24,
          cv: 0,
        },
        singerSong: {
          method: 'GetSingerSongList',
          param: {
            order: 1, // 1: 按热度, 0: 按时间
            singerMid: '',
            singerId: singerId,
            begin: 0,
            num: 50,
          },
          module: 'musichall.song_list_server',
        },
      },
    })
    
    return requestObj.promise.then(({ body, statusCode }) => {
      if (statusCode !== 200) {
        console.error('❌ HTTP error:', statusCode)
        return []
      }
      
      if (!body || body.code !== 0) {
        console.error('❌ API error:', body?.code)
        return []
      }
      
      const data = body.singerSong?.data || {}
      const songs = data.songList || []
      
      console.log('🎵 Found', songs.length, 'top songs')
      
      if (songs.length > 0) {
        console.log('🎵 First song raw data:', JSON.stringify(songs[0], null, 2))
      }
      
      const result = handleMusicResult(songs)
      
      if (result.length > 0) {
        console.log('🎵 First song processed:', JSON.stringify(result[0], null, 2))
      }
      
      return result
    }).catch(error => {
      console.error('❌ Top songs request error:', error)
      return []
    })
  },

  /**
   * 获取歌手全部歌曲
   * @param {Object} params - 查询参数
   * @param {number} params.id - 歌手ID
   * @param {string} params.order - 排序: 'hot'(热门) 或 'time'(时间)
   * @param {number} params.limit - 返回数量，默认50
   * @param {number} params.offset - 偏移数量，默认0
   * @returns {Promise}
   */
  songs(params = {}) {
    const { id, order = 'hot', limit = 50, offset = 0 } = params
    
    console.log('🎵 Fetching songs for artist:', id, { order, limit, offset })
    
    const requestObj = httpFetch('https://u.y.qq.com/cgi-bin/musicu.fcg', {
      method: 'post',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; WOW64; Trident/5.0)',
        'Referer': 'https://y.qq.com/',
      },
      body: {
        comm: {
          ct: 24,
          cv: 0,
        },
        singerSong: {
          method: 'GetSingerSongList',
          param: {
            order: order === 'hot' ? 1 : 0, // 1: 按热度, 0: 按时间
            singerMid: '',
            singerId: id,
            begin: offset,
            num: limit,
          },
          module: 'musichall.song_list_server',
        },
      },
    })
    
    return requestObj.promise.then(({ body, statusCode }) => {
      if (statusCode !== 200) {
        console.error('❌ HTTP error:', statusCode)
        return { list: [], total: 0 }
      }
      
      if (!body || body.code !== 0) {
        console.error('❌ Songs API error:', body?.code)
        return { list: [], total: 0 }
      }
      
      const data = body.singerSong?.data || {}
      const songs = data.songList || []
      const total = data.totalNum || 0
      
      console.log('🎵 Found', songs.length, 'songs, total:', total)
      
      return {
        list: handleMusicResult(songs),
        total,
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
   * @param {string} params.order - 排序方式: 'time'(时间, 默认) 或 'hot'(热度)
   * @returns {Promise}
   */
  album(params = {}) {
    const { id, limit = 50, offset = 0, order = 'time' } = params
    
    console.log('💿 Fetching albums for artist:', id, { limit, offset, order })
    
    // 使用QQ音乐旧版API
    const requestObj = httpFetch(`https://c.y.qq.com/v8/fcg-bin/fcg_v8_singer_album.fcg?singerid=${id}&order=${order === 'hot' ? 'listen' : 'time'}&begin=${offset}&num=${limit}&format=json&inCharset=utf8&outCharset=utf-8`, {
      method: 'get',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://y.qq.com/n/yqq/singer/',
      },
    })
    
    return requestObj.promise.then(({ body, statusCode }) => {
      console.log('💿 Album API response:', { statusCode, code: body?.code })
      
      if (statusCode !== 200) {
        console.error('❌ HTTP error:', statusCode)
        return { list: [], total: 0 }
      }
      
      if (!body || body.code !== 0) {
        console.error('❌ Album API error:', body?.code)
        console.log('💿 Full response:', JSON.stringify(body, null, 2))
        return { list: [], total: 0 }
      }
      
      // 旧版API的数据结构
      const data = body.data || {}
      const albums = data.list || []
      const total = data.total || 0
      
      console.log('💿 Found', albums.length, 'albums, total:', total)
      
      if (albums.length > 0) {
        console.log('💿 First album:', JSON.stringify(albums[0], null, 2))
        console.log('💿 First album keys:', Object.keys(albums[0]))
      }
      
      return {
        list: albums.map(album => ({
          id: album.albumID || album.albumid,
          name: album.albumName || album.albumname,
          mid: album.albumMID || album.albummid,
          picUrl: `https://y.gtimg.cn/music/photo_new/T002R300x300M000${album.albumMID || album.albummid}.jpg`,
          artistId: id,
          artistName: album.singerName || album.singername || '',
          // 尝试多种可能的字段名，新API的歌曲数在 latest_song.song_count 里
          size: (album.latest_song && album.latest_song.song_count) || album.song_count || album.songnum || album.songNum || album.cur_song_num || album.songCount || 0,
          publishTime: album.pub_time ? new Date(album.pub_time * 1000).getTime() : 0,
          company: album.company || '',
          description: album.desc || '',
        })),
        total,
      }
    }).catch(error => {
      console.error('❌ Album request error:', error)
      return { list: [], total: 0 }
    })
  },
}

