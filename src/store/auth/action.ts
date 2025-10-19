import state, { type InitState } from './state'

export default {
  setUserInfo(userInfo: InitState['userInfo']) {
    state.userInfo = userInfo
    state.isLoggedIn = !!userInfo
    global.state_event.authUpdated(userInfo)
  },
  
  logout() {
    state.userInfo = null
    state.isLoggedIn = false
    global.state_event.authUpdated(null)
  },
  
  setSyncStatus(isSyncing: boolean) {
    state.isSyncing = isSyncing
    global.state_event.syncStatusUpdated(isSyncing)
  },
  
  setLastSyncTime(time: number) {
    state.lastSyncTime = time
    global.state_event.lastSyncTimeUpdated(time)
  },
}

