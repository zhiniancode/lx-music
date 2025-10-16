import hotSearchState, { type Source } from '@/store/hotSearch/state'
import hotSearchActions, { type Lists } from '@/store/hotSearch/action'
import musicSdk from '@/utils/musicSdk'

export const getList = async(source: Source): Promise<string[]> => {
  if (source == 'all') {
    let task = []
    for (const source of hotSearchState.sources) {
      if (source == 'all') continue
      task.push(
        hotSearchState.sourceList[source]?.length
          ? Promise.resolve({ source, list: hotSearchState.sourceList[source]! })
          : ((musicSdk[source]?.hotSearch.getList() as Promise<Lists[number]>) ?? Promise.reject(new Error('source not found: ' + source))).catch((err: any) => {
              console.log(err)
              return { source, list: [] }
            }),
      )
    }
    return Promise.all(task).then((results: Lists) => {
      return hotSearchActions.setList(source, results)
    })
  } else {
    if (hotSearchState.sourceList[source]?.length) return hotSearchState.sourceList[source]!
    if (!musicSdk[source]?.hotSearch) {
      console.warn(`音源 ${source} 不存在或不支持热搜功能`)
      hotSearchActions.setList(source, [])
      return []
    }
    return musicSdk[source]?.hotSearch.getList().catch((err: any) => {
      console.warn(`获取 ${source} 热搜列表失败:`, err.message)
      return { source, list: [] }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    }).then(data => {
      // 防御性检查，确保data存在且有list属性
      if (!data || !data.list) {
        console.warn(`音源 ${source} 热搜数据格式异常:`, data)
        hotSearchActions.setList(source, [])
        return []
      }
      return hotSearchActions.setList(source, data.list)
    })
  }
}


