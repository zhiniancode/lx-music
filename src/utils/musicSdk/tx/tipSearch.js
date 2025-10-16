import { httpFetch } from '../../request'

export default {
  // regExps: {
  //   relWord: /RELWORD=(.+)/,
  // },
  requestObj: null,
  tipSearch(str) {
    this.cancelTipSearch()
    this.requestObj = httpFetch(`https://c.y.qq.com/splcloud/fcgi-bin/smartbox_new.fcg?is_xml=0&format=json&key=${encodeURIComponent(str)}&loginUin=0&hostUin=0&format=json&inCharset=utf8&outCharset=utf-8&notice=0&platform=yqq&needNewCode=0`, {
      headers: {
        Referer: 'https://y.qq.com/portal/player.html',
      },
    })
    return this.requestObj.promise.then(({ statusCode, body }) => {
      if (statusCode != 200 || body.code != 0) return Promise.reject(new Error('请求失败'))
      // 检查返回数据结构
      if (!body.data) {
        // 无数据时返回空结构，这可能是正常的无结果情况
        return { song: { itemlist: [] } }
      }
      return body.data
    })
  },
  handleResult(rawData) {
    // 空数组是正常的无结果情况  
    if (!rawData) {
      return []
    }
    if (!Array.isArray(rawData)) {
      console.warn('QQ音乐tipSearch返回数据格式异常:', rawData)
      return []
    }
    return rawData.map(info => `${info.name} - ${info.singer}`)
  },
  cancelTipSearch() {
    if (this.requestObj && this.requestObj.cancelHttp) this.requestObj.cancelHttp()
  },
  async search(str) {
    return this.tipSearch(str).then(result => {
      // 检查返回数据结构
      if (!result || !result.song) {
        console.warn('QQ音乐tipSearch返回数据结构异常:', result)
        return []
      }
      // 没有itemlist字段表示无搜索结果，这是正常情况
      if (!result.song.itemlist) {
        return []
      }
      return this.handleResult(result.song.itemlist)
    }).catch(err => {
      console.warn('QQ音乐tipSearch搜索失败:', err.message)
      return []
    })
  },
}
