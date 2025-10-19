export interface InitState {
  isLoggedIn: boolean
  userInfo: {
    id: string
    username: string
    email: string
    token: string
  } | null
  isSyncing: boolean
  lastSyncTime: number | null
}

const state: InitState = {
  isLoggedIn: false,
  userInfo: null,
  isSyncing: false,
  lastSyncTime: null,
}

export default state

