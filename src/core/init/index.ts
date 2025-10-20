import { initSetting } from '@/core/common'
import registerPlaybackService from '@/plugins/player/service'
import initTheme from './theme'
import initI18n from './i18n'
import initUserApi from './userApi'
import initPlayer from './player'
import dataInit from './dataInit'
import initSync from './sync'
import initCommonState from './common'
import { initDeeplink } from './deeplink'
import { setApiSource } from '@/core/apiSource'
import commonActions from '@/store/common/action'
import settingState from '@/store/setting/state'
import { checkUpdate } from '@/core/version'
import { bootLog } from '@/utils/bootLog'
import { loadAuthFromLocal } from '@/core/cloud/sync'

let isFirstPush = true
const handlePushedHomeScreen = async() => {
  // await cheatTip() // 已移除受骗提示
  // 已移除协议弹窗检查，直接执行初始化
  if (isFirstPush) {
    isFirstPush = false
     void checkUpdate() 
    void initDeeplink()
  }
}

let isInited = false
export default async() => {
  if (isInited) return handlePushedHomeScreen
  bootLog('Initing...')
  commonActions.setFontSize(global.lx.fontSize)
  bootLog('Font size changed.')
  const setting = await initSetting()
  bootLog('Setting inited.')
  // console.log(setting)

  await initTheme(setting)
  bootLog('Theme inited.')
  await initI18n(setting)
  bootLog('I18n inited.')

  await initUserApi(setting)
  bootLog('User Api inited.')

  // 先初始化数据（包括设置默认源），再设置API源
  await dataInit(setting)
  bootLog('Data inited.')

  // 使用 settingState.setting 而不是局部变量，确保获取到最新更新的值
  setApiSource(settingState.setting['common.apiSource'])
  bootLog('Api inited.')

  registerPlaybackService()
  bootLog('Playback Service Registered.')
  await initPlayer(setting)
  bootLog('Player inited.')
  await initCommonState(setting)
  bootLog('Common State inited.')

  void initSync(setting)
  bootLog('Sync inited.')

  // 加载保存的登录信息
  await loadAuthFromLocal()
  bootLog('Auth loaded.')

  // syncSetting()

  isInited ||= true

  return handlePushedHomeScreen
}
