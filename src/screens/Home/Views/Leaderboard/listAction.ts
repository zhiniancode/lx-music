import { createList, setTempList, addListMusics, getListMusics } from '@/core/list'
import { playList } from '@/core/player/player'
import { getListDetail, getListDetailAll } from '@/core/leaderboard'
import { LIST_IDS } from '@/config/constant'
import listState from '@/store/list/state'
import syncSourceList from '@/core/syncSourceList'
import { confirmDialog, toMD5, toast } from '@/utils/tools'
import playerState from '@/store/player/state'


const getListId = (id: string) => `board__${id}`

export const handlePlay = async(id: string, list?: LX.Music.MusicInfoOnline[], index = 0, singleMode = false) => {
  let isPlayingList = false
  // console.log(list)
  const listId = getListId(id)
  if (!list?.length) list = (await getListDetail(id, 1)).list
  
  // 如果是单首模式，直接添加到默认播放列表
  if (singleMode && list?.length) {
    // 获取添加前的列表长度
    const currentList = await getListMusics(LIST_IDS.DEFAULT)
    const currentLength = currentList.length
    
    // 添加歌曲到默认播放列表
    await addListMusics(LIST_IDS.DEFAULT, list as LX.Music.MusicInfo[], 'bottom')
    
    // 播放新添加的歌曲（索引 = 原列表长度 + 新歌曲在传入列表中的索引）
    const newSongIndex = currentLength + index
    void playList(LIST_IDS.DEFAULT, newSongIndex)
    return
  }
  
  if (list?.length) {
    await setTempList(listId, [...list])
    void playList(LIST_IDS.TEMP, index)
    isPlayingList = true
  }
  
  // 如果是单首模式，不获取完整列表
  if (singleMode) {
    return
  }
  
  const fullList = await getListDetailAll(id)
  if (!fullList.length) return
  if (isPlayingList) {
    if (listState.tempListMeta.id == listId) {
      await setTempList(listId, [...fullList])
    }
  } else {
    await setTempList(listId, [...fullList])
    void playList(LIST_IDS.TEMP, index)
  }
}

export const handleCollect = async(id: string, name: string, source: LX.OnlineSource) => {
  const listId = getListId(id)
  const targetList = listState.userList.find(l => l.sourceListId == listId)
  if (targetList) {
    const confirm = await confirmDialog({
      message: global.i18n.t('duplicate_list_tip', { name: targetList.name }),
      cancelButtonText: global.i18n.t('list_import_part_button_cancel'),
      confirmButtonText: global.i18n.t('confirm_button_text'),
    })
    if (!confirm) return
    void syncSourceList(targetList)
    return
  }

  const list = await getListDetailAll(id)
  await createList({
    name,
    id: `${source}_${toMD5(listId)}`,
    list,
    source,
    sourceListId: listId,
  })
  toast(global.i18n.t('collect_success'))
}
