import { useState, useEffect } from 'react'
import settingState from '@/store/setting/state'

interface ArtistState {
  source: LX.Source
  initial: string
  page: number
  hasMore: boolean
  area: number
  type: number
  genre: number
}

const state: ArtistState = {
  source: 'tx', // 默认使用QQ音乐（企鹅音乐）
  initial: '-1',
  page: 1,
  hasMore: true,
  area: -100,  // QQ音乐: -100全部, 200内地, 2港台, 3韩国, 4日本, 5欧美
  type: -100,  // QQ音乐: -100全部, 0男, 1女, 2组合
  genre: -100, // QQ音乐: -100全部, 1流行, 2摇滚, 3民谣, 4电子, 5爵士, 6嘻哈, 8R&B, 9轻音乐
}

// State hooks
export const useArtistSource = () => {
  const [source, setSource] = useState(state.source)
  
  useEffect(() => {
    const handleUpdate = (source: LX.Source) => {
      setSource(source)
    }

    // @ts-ignore - custom event
    global.state_event.on('artistSourceUpdated', handleUpdate)
    
    return () => {
      // @ts-ignore - custom event
      global.state_event.off('artistSourceUpdated', handleUpdate)
    }
  }, [])

  return source
}

export const useArtistArea = () => {
  const [area, setArea] = useState(state.area)
  
  useEffect(() => {
    const handleUpdate = () => {
      setArea(state.area)
    }

    // @ts-ignore - custom event
    global.state_event.on('artistFilterUpdated', handleUpdate)
    // @ts-ignore - custom event
    global.state_event.on('artistSourceUpdated', handleUpdate)
    
    return () => {
      // @ts-ignore - custom event
      global.state_event.off('artistFilterUpdated', handleUpdate)
      // @ts-ignore - custom event
      global.state_event.off('artistSourceUpdated', handleUpdate)
    }
  }, [])

  return area
}

export const useArtistType = () => {
  const [type, setType] = useState(state.type)
  
  useEffect(() => {
    const handleUpdate = () => {
      setType(state.type)
    }

    // @ts-ignore - custom event
    global.state_event.on('artistFilterUpdated', handleUpdate)
    // @ts-ignore - custom event
    global.state_event.on('artistSourceUpdated', handleUpdate)
    
    return () => {
      // @ts-ignore - custom event
      global.state_event.off('artistFilterUpdated', handleUpdate)
      // @ts-ignore - custom event
      global.state_event.off('artistSourceUpdated', handleUpdate)
    }
  }, [])

  return type
}

export const useArtistGenre = () => {
  const [genre, setGenre] = useState(state.genre)
  
  useEffect(() => {
    const handleUpdate = () => {
      setGenre(state.genre)
    }

    // @ts-ignore - custom event
    global.state_event.on('artistFilterUpdated', handleUpdate)
    // @ts-ignore - custom event
    global.state_event.on('artistSourceUpdated', handleUpdate)
    
    return () => {
      // @ts-ignore - custom event
      global.state_event.off('artistFilterUpdated', handleUpdate)
      // @ts-ignore - custom event
      global.state_event.off('artistSourceUpdated', handleUpdate)
    }
  }, [])

  return genre
}

// State setters
export const setArtistSource = (source: LX.Source) => {
  state.source = source
  state.page = 1
  // 切换音乐源时重置筛选参数
  if (source === 'tx') {
    // QQ音乐默认值
    state.area = -100
    state.type = -100
    state.genre = -100
  } else {
    // 网易云默认值
    state.area = -1
    state.type = -1
    state.genre = -1
  }
  // @ts-ignore - custom event
  global.state_event.emit('artistSourceUpdated', source)
  // @ts-ignore - custom event
  global.state_event.emit('artistListNeedRefresh')
}

export const setArtistInitial = (initial: string) => {
  state.initial = initial
  state.page = 1
  // @ts-ignore - custom event
  global.state_event.emit('artistListNeedRefresh')
}

export const setArtistArea = (area: number) => {
  state.area = area
  state.page = 1
  // @ts-ignore - custom event
  global.state_event.emit('artistFilterUpdated')
  // @ts-ignore - custom event
  global.state_event.emit('artistListNeedRefresh')
}

export const setArtistType = (type: number) => {
  state.type = type
  state.page = 1
  // @ts-ignore - custom event
  global.state_event.emit('artistFilterUpdated')
  // @ts-ignore - custom event
  global.state_event.emit('artistListNeedRefresh')
}

export const setArtistGenre = (genre: number) => {
  state.genre = genre
  state.page = 1
  // @ts-ignore - custom event
  global.state_event.emit('artistFilterUpdated')
  // @ts-ignore - custom event
  global.state_event.emit('artistListNeedRefresh')
}

export const getArtistState = () => state

export default state

