import { httpFetch } from '../../request'
import { weapi } from './utils/crypto'
import { formatSingerName } from '../utils'

export default {
  requestObj: null,
  cancelTipSearch() {
    if (this.requestObj && this.requestObj.cancelHttp) this.requestObj.cancelHttp()
  },
  tipSearchBySong(str) {
    this.cancelTipSearch()
    this.requestObj = httpFetch('https://music.163.com/weapi/search/suggest/web', {
      method: 'POST',
      headers: {
        referer: 'https://music.163.com/',
        origin: 'https://music.163.com/',
      },
      form: weapi({
        s: str,
      }),
    })
    return this.requestObj.promise.then(({ statusCode, body }) => {
      if (statusCode != 200 || body.code != 200) return Promise.reject(new Error('请求失败'))
      // 检查返回数据结构
      if (!body.result) {
        console.warn('网易云音乐tipSearch API返回数据结构异常:', body)
        return []
      }
      // 没有songs字段表示无搜索结果，这是正常情况
      if (!body.result.songs) {
        return []
      }
      return body.result.songs
    })
  },
  handleResult(rawData) {
    // 空数组是正常的无结果情况
    if (!rawData) {
      return []
    }
    if (!Array.isArray(rawData)) {
      console.warn('网易云音乐tipSearch返回数据格式异常:', rawData)
      return []
    }
    return rawData.map(info => `${info.name} - ${formatSingerName(info.artists, 'name')}`)
  },
  async search(str) {
    return this.tipSearchBySong(str).then(result => this.handleResult(result)).catch(err => {
      console.warn('网易云音乐tipSearch搜索失败:', err.message)
      return []
    })
  },
}
