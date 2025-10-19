import leaderboard from './leaderboard'
import lyric from './lyric'
import songList from './songList'
import musicSearch from './musicSearch'
import { apis } from '../api-source'
import hotSearch from './hotSearch'
import comment from './comment'
import tipSearch from './tipSearch'
import artist from './artist'
import album from './album'

const tx = {
  tipSearch,
  leaderboard,
  songList,
  musicSearch,
  hotSearch,
  comment,
  artist,
  album,

  getMusicUrl(songInfo, type) {
    return apis('tx').getMusicUrl(songInfo, type)
  },
  getLyric(songInfo) {
    // let singer = songInfo.singer.indexOf('、') > -1 ? songInfo.singer.split('、')[0] : songInfo.singer
    return lyric.getLyric(songInfo.songmid)
  },
  getPic(songInfo) {
    // 直接返回已经生成的图片URL，避免调用可能不存在的API
    return {
      promise: Promise.resolve(songInfo.meta?.picUrl || '')
    }
  },
  getMusicDetailPageUrl(songInfo) {
    return `https://y.qq.com/n/yqq/song/${songInfo.songmid}.html`
  },
}

export default tx
