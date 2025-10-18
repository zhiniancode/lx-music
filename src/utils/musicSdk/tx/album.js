import { httpFetch } from '../../request'
import { formatPlayTime, sizeFormate } from '../../index'
import { formatSingerName } from '../utils'

/**
 * 获取歌手信息字符串
 */
const getSinger = (singers) => {
  if (!singers) return ''
  if (typeof singers === 'string') return singers
  if (!Array.isArray(singers)) {
    // 如果是单个对象，转为数组
    singers = [singers]
  }
  return singers.map(singer => {
    if (typeof singer === 'string') return singer
    return singer.name || singer.singerName || ''
  }).filter(Boolean).join('、')
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
    const singerMid = Array.isArray(singerList) && singerList.length > 0 ? singerList[0].mid : ''

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
   * 获取专辑详情及歌曲列表
   * @param {string|number} albumId - 专辑 ID 或 MID
   * @returns {Promise}
   */
  detail(albumId) {
    console.log('💿 Fetching album detail:', albumId)
    
    // 使用新版musicu.fcg API
    const requestObj = httpFetch('https://u.y.qq.com/cgi-bin/musicu.fcg', {
      method: 'post',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://y.qq.com/',
      },
      body: {
        comm: {
          ct: 24,
          cv: 0,
        },
        albumSonglist: {
          method: 'GetAlbumSongList',
          param: {
            albumMid: albumId,
            albumID: 0,
            begin: 0,
            num: 999,
            order: 2,
          },
          module: 'music.musichallAlbum.AlbumSongList',
        },
      },
    })
    
    return requestObj.promise.then(({ body, statusCode }) => {
      console.log('💿 Raw response code:', statusCode, 'body code:', body?.code)
      
      if (statusCode !== 200) {
        console.error('❌ HTTP error:', statusCode)
        throw new Error(`HTTP错误: ${statusCode}`)
      }
      
      if (!body || body.code !== 0) {
        console.error('❌ Album API error:', body?.code)
        console.log('💿 Full response:', JSON.stringify(body, null, 2))
        throw new Error(`API错误: ${body?.code}`)
      }
      
      const data = body.albumSonglist?.data || {}
      const songs = data.songList || []
      
      console.log('💿 Album songs:', songs.length)
      
      if (songs.length > 0) {
        console.log('💿 First song structure:', JSON.stringify(songs[0], null, 2))
      }
      
      // 从第一首歌曲获取专辑信息
      let albumName = '未知专辑'
      let artistName = '未知歌手'
      let albumMid = albumId
      
      if (songs.length > 0) {
        const firstSong = songs[0].songInfo || songs[0]
        if (firstSong.album) {
          albumName = firstSong.album.name || firstSong.album.title || albumName
          albumMid = firstSong.album.mid || albumMid
        }
        if (firstSong.singer && Array.isArray(firstSong.singer)) {
          artistName = firstSong.singer.map(s => s.name).join('、')
        }
      }
      
      console.log('💿 Album loaded:', albumName, 'by', artistName, 'with', songs.length, 'songs')
      
      return {
        info: {
          id: 0,
          mid: albumMid,
          name: albumName,
          picUrl: `https://y.gtimg.cn/music/photo_new/T002R500x500M000${albumMid}.jpg`,
          artistId: 0,
          artistName: artistName,
          size: songs.length,
          publishTime: 0,
          company: '',
          description: '',
        },
        songs: handleMusicResult(songs),
      }
    }).catch(error => {
      console.error('❌ Album detail request error:', error)
      throw error
    })
  },
}

