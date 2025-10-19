import { useEffect, useState } from 'react'
import authState from './state'

export const useIsLoggedIn = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(authState.isLoggedIn)

  useEffect(() => {
    const handleUpdate = () => {
      setIsLoggedIn(authState.isLoggedIn)
    }
    global.state_event.on('authUpdated', handleUpdate)
    return () => {
      global.state_event.off('authUpdated', handleUpdate)
    }
  }, [])

  return isLoggedIn
}

export const useUserInfo = () => {
  const [userInfo, setUserInfo] = useState(authState.userInfo)

  useEffect(() => {
    const handleUpdate = () => {
      setUserInfo(authState.userInfo)
    }
    global.state_event.on('authUpdated', handleUpdate)
    return () => {
      global.state_event.off('authUpdated', handleUpdate)
    }
  }, [])

  return userInfo
}

export const useIsSyncing = () => {
  const [isSyncing, setIsSyncing] = useState(authState.isSyncing)

  useEffect(() => {
    const handleUpdate = (status: boolean) => {
      setIsSyncing(status)
    }
    global.state_event.on('syncStatusUpdated', handleUpdate)
    return () => {
      global.state_event.off('syncStatusUpdated', handleUpdate)
    }
  }, [])

  return isSyncing
}

export const useLastSyncTime = () => {
  const [lastSyncTime, setLastSyncTime] = useState(authState.lastSyncTime)

  useEffect(() => {
    const handleUpdate = (time: number) => {
      setLastSyncTime(time)
    }
    global.state_event.on('lastSyncTimeUpdated', handleUpdate)
    return () => {
      global.state_event.off('lastSyncTimeUpdated', handleUpdate)
    }
  }, [])

  return lastSyncTime
}

