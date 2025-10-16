import { eapiRequest } from './utils/index'

export default {
  _requestObj: null,
  async getList(retryNum = 0) {
    if (this._requestObj) this._requestObj.cancelHttp()
    if (retryNum > 2) return Promise.reject(new Error('try max num'))

    const _requestObj = eapiRequest('/api/search/chart/detail', {
      id: 'HOT_SEARCH_SONG#@#',
    })
    const { body, statusCode } = await _requestObj.promise
    if (statusCode != 200 || body.code !== 200) throw new Error('获取热搜词失败')

    // 添加防御性检查，确保数据结构完整
    if (!body.data || !body.data.itemList) {
      console.warn('网易云热搜数据结构异常:', body)
      return { source: 'wy', list: [] }
    }

    return { source: 'wy', list: this.filterList(body.data.itemList) }
  },
  filterList(rawList) {
    // 添加防御性检查
    if (!rawList || !Array.isArray(rawList)) {
      console.warn('热搜列表数据格式异常:', rawList)
      return []
    }
    return rawList.map(item => item.searchWord)
  },
}
