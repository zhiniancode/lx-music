import { useState, useRef } from 'react'
import { View, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import { useIsLoggedIn, useUserInfo, useIsSyncing, useLastSyncTime } from '@/store/auth/hook'
import Text from '@/components/common/Text'
import { login, register } from '@/core/cloud/api'
import { syncToCloud, syncFromCloud, saveAuthToLocal, clearAuthFromLocal } from '@/core/cloud/sync'
import { authActions } from '@/store/auth'
import { scaleSizeH, scaleSizeW } from '@/utils/pixelRatio'
import { Icon } from '@/components/common/Icon'
import TipDialog, { type TipDialogType } from '@/components/common/TipDialog'
import ConfirmDialog, { type ConfirmDialogType } from '@/components/common/ConfirmDialog'

const Login = () => {
  const theme = useTheme()
  const isLoggedIn = useIsLoggedIn()
  const userInfo = useUserInfo()
  const isSyncing = useIsSyncing()
  const lastSyncTime = useLastSyncTime()

  const [isLogin, setIsLogin] = useState(true) // true: 登录, false: 注册
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [usernameFocused, setUsernameFocused] = useState(false)
  const [passwordFocused, setPasswordFocused] = useState(false)
  const [inviteCodeFocused, setInviteCodeFocused] = useState(false)

  // Dialog refs
  const tipDialogRef = useRef<TipDialogType>(null)
  const confirmDialogRef = useRef<ConfirmDialogType>(null)
  const [tipDialogMessage, setTipDialogMessage] = useState('')
  const [confirmDialogConfig, setConfirmDialogConfig] = useState({
    title: '',
    message: '',
    onConfirm: () => {},
  })

  // 处理登录
  const handleLogin = async () => {
    if (!username || !password) {
      setTipDialogMessage('请输入用户名和密码')
      tipDialogRef.current?.setVisible(true)
      return
    }

    setIsLoading(true)
    try {
      const result = await login({ username, password })
      if (result.success && result.data) {
        authActions.setUserInfo(result.data)
        await saveAuthToLocal(result.data)
        setTipDialogMessage('登录成功！')
        tipDialogRef.current?.setVisible(true)
        setUsername('')
        setPassword('')
        // 登录成功后，切换导航状态为 nav_my
        const { setNavActiveId } = require('@/core/common')
        const commonState = require('@/store/common/state').default
        if (commonState.navActiveId === 'nav_login') {
          setNavActiveId('nav_my')
        }
      } else {
        setTipDialogMessage(result.message || '登录失败')
        tipDialogRef.current?.setVisible(true)
      }
    } catch (error) {
      setTipDialogMessage('登录失败，请重试')
      tipDialogRef.current?.setVisible(true)
    } finally {
      setIsLoading(false)
    }
  }

  // 处理注册
  const handleRegister = async () => {
    if (!username || !password) {
      setTipDialogMessage('请输入用户名和密码')
      tipDialogRef.current?.setVisible(true)
      return
    }

    if (!inviteCode) {
      setTipDialogMessage('请输入邀请码')
      tipDialogRef.current?.setVisible(true)
      return
    }

    setIsLoading(true)
    try {
      const result = await register({ username, password, email: '', inviteCode })
      if (result.success && result.data) {
        authActions.setUserInfo(result.data)
        await saveAuthToLocal(result.data)
        setTipDialogMessage('注册成功！')
        tipDialogRef.current?.setVisible(true)
        setUsername('')
        setPassword('')
        setInviteCode('')
        // 注册成功后，切换导航状态为 nav_my
        const { setNavActiveId } = require('@/core/common')
        const commonState = require('@/store/common/state').default
        if (commonState.navActiveId === 'nav_login') {
          setNavActiveId('nav_my')
        }
      } else {
        setTipDialogMessage(result.message || '注册失败')
        tipDialogRef.current?.setVisible(true)
      }
    } catch (error) {
      setTipDialogMessage('注册失败，请重试')
      tipDialogRef.current?.setVisible(true)
    } finally {
      setIsLoading(false)
    }
  }

  // 退出登录
  const handleLogout = async () => {
    setConfirmDialogConfig({
      title: '确认退出',
      message: '确定要退出登录吗？',
      onConfirm: async () => {
        authActions.logout()
        await clearAuthFromLocal()
        // 退出登录后，切换导航状态为 nav_login
        const { setNavActiveId } = require('@/core/common')
        const commonState = require('@/store/common/state').default
        if (commonState.navActiveId === 'nav_my') {
          setNavActiveId('nav_login')
        }
      },
    })
    confirmDialogRef.current?.setVisible(true)
  }

  // 同步到云端
  const handleSyncToCloud = async () => {
    const result = await syncToCloud()
    setTipDialogMessage(result.message)
    tipDialogRef.current?.setVisible(true)
  }

  // 从云端下载
  const handleSyncFromCloud = async () => {
    setConfirmDialogConfig({
      title: '确认下载',
      message: '从云端下载数据将覆盖本地数据，确定继续吗？',
      onConfirm: async () => {
        const result = await syncFromCloud()
        setTipDialogMessage(result.message)
        tipDialogRef.current?.setVisible(true)
      },
    })
    confirmDialogRef.current?.setVisible(true)
  }

  // 格式化时间
  const formatTime = (timestamp: number | null) => {
    if (!timestamp) return '从未同步'
    const date = new Date(timestamp)
    return date.toLocaleString('zh-CN')
  }

  const styles = createStyle({
    container: {
      flex: 1,
      backgroundColor: theme['c-content-background'],
    },
    scrollView: {
      flex: 1,
    },
    content: {
      padding: scaleSizeW(20),
    },
    title: {
      fontSize: scaleSizeW(28),
      fontWeight: 'bold',
      marginBottom: scaleSizeH(30),
      textAlign: 'center',
      marginTop: scaleSizeH(40),
    },
    inputContainer: {
      marginBottom: scaleSizeH(18),
    },
    label: {
      fontSize: scaleSizeW(14),
      marginBottom: scaleSizeH(10),
      fontWeight: '600',
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme['c-border-background'] + '40',
      borderRadius: scaleSizeW(10),
      backgroundColor: 'transparent',
    },
    inputWrapperFocused: {
      borderColor: theme['c-primary-light-100'],
    },
    input: {
      flex: 1,
      padding: scaleSizeW(14),
      paddingHorizontal: scaleSizeW(15),
      fontSize: scaleSizeW(15),
      color: theme['c-font'],
      backgroundColor: 'transparent',
    },
    button: {
      alignSelf: 'center',
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: theme['c-primary-light-100'],
      paddingVertical: scaleSizeH(8),
      paddingHorizontal: scaleSizeW(24),
      minWidth: scaleSizeW(100),
      borderRadius: scaleSizeW(6),
      alignItems: 'center',
      marginTop: scaleSizeH(10),
    },
    buttonDisabled: {
      opacity: 0.6,
    },
    buttonText: {
      fontSize: scaleSizeW(17),
      fontWeight: 'bold',
    },
    switchButton: {
      marginTop: scaleSizeH(15),
      alignItems: 'center',
    },
    switchButtonText: {
      fontSize: scaleSizeW(14),
    },
    loggedInContainer: {
      alignItems: 'center',
    },
    avatar: {
      width: scaleSizeW(80),
      height: scaleSizeW(80),
      borderRadius: scaleSizeW(40),
      backgroundColor: theme['c-primary-light-100'],
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: scaleSizeH(15),
    },
    avatarText: {
      fontSize: scaleSizeW(32),
      fontWeight: 'bold',
    },
    infoContainer: {
      width: '100%',
      marginTop: scaleSizeH(20),
    },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: scaleSizeH(10),
    },
    syncButtonsContainer: {
      marginTop: scaleSizeH(20),
    },
    syncButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: theme['c-primary-light-100'],
      paddingVertical: scaleSizeH(12),
      paddingHorizontal: scaleSizeW(20),
      borderRadius: scaleSizeW(8),
      marginBottom: scaleSizeH(10),
    },
    syncButtonIcon: {
      marginRight: scaleSizeW(8),
    },
    logoutButton: {
      backgroundColor: '#FF5252',
      borderColor: '#FF5252',
      marginTop: scaleSizeH(20),
    },
  })

  if (isLoggedIn && userInfo) {
    // 已登录状态
    return (
      <View style={styles.container}>
        <ScrollView style={styles.scrollView}>
          <View style={styles.content}>
            <View style={styles.loggedInContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText} color={theme['c-font']}>
                  {userInfo.username.charAt(0).toUpperCase()}
                </Text>
              </View>
              
              <Text style={{ fontSize: 20, fontWeight: 'bold' }} color={theme['c-font']}>
                {userInfo.username}
              </Text>
              
            </View>

            <View style={styles.infoContainer}>
              <View style={styles.infoRow}>
                <Text color={theme['c-font-label']}>用户ID:</Text>
                <Text color={theme['c-font']}>{userInfo.id}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text color={theme['c-font-label']}>最后同步:</Text>
                <Text color={theme['c-font']}>{formatTime(lastSyncTime)}</Text>
              </View>
            </View>

            <View style={styles.syncButtonsContainer}>
              <TouchableOpacity
                style={[styles.syncButton, isSyncing && styles.buttonDisabled]}
                onPress={handleSyncToCloud}
                disabled={isSyncing}
                activeOpacity={0.8}
              >
                {isSyncing ? (
                  <ActivityIndicator color={theme['c-primary-light-100']} size="small" />
                ) : (
                  <>
                    <Icon name="available_updates" size={20} color={theme['c-primary-light-100']} style={styles.syncButtonIcon} />
                    <Text style={styles.buttonText} color={theme['c-primary-light-100']}>
                      同步数据到云端
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.syncButton, isSyncing && styles.buttonDisabled]}
                onPress={handleSyncFromCloud}
                disabled={isSyncing}
                activeOpacity={0.8}
              >
                {isSyncing ? (
                  <ActivityIndicator color={theme['c-primary-light-100']} size="small" />
                ) : (
                  <>
                    <Icon name="download-2" size={20} color={theme['c-primary-light-100']} style={styles.syncButtonIcon} />
                    <Text style={styles.buttonText} color={theme['c-primary-light-100']}>
                      从云端下载数据
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.logoutButton]}
                onPress={handleLogout}
                activeOpacity={0.8}
              >
                <Text style={styles.buttonText} color="#FFFFFF">
                  退出登录
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
        
        <TipDialog
          ref={tipDialogRef}
          message={tipDialogMessage}
          btnText="确定"
        />
        
        <ConfirmDialog
          ref={confirmDialogRef}
          title={confirmDialogConfig.title}
          message={confirmDialogConfig.message}
          cancelButtonText="取消"
          confirmButtonText="确定"
          onConfirm={confirmDialogConfig.onConfirm}
        />
      </View>
    )
  }

  // 未登录状态
  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">
        <View style={styles.content}>
          <Text style={styles.title} color={theme['c-font']}>
            {isLogin ? '登录账户' : '注册账户'}
          </Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label} color={theme['c-font']}>用户名</Text>
            <View style={[styles.inputWrapper, usernameFocused && styles.inputWrapperFocused]}>
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                placeholder="请输入用户名"
                placeholderTextColor={theme['c-font-label']}
                autoCapitalize="none"
                editable={!isLoading}
                onFocus={() => setUsernameFocused(true)}
                onBlur={() => setUsernameFocused(false)}
                underlineColorAndroid="transparent"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label} color={theme['c-font']}>密码</Text>
            <View style={[styles.inputWrapper, passwordFocused && styles.inputWrapperFocused]}>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="请输入密码"
                placeholderTextColor={theme['c-font-label']}
                secureTextEntry
                editable={!isLoading}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                underlineColorAndroid="transparent"
              />
            </View>
          </View>

          {!isLogin && (
            <View style={styles.inputContainer}>
              <Text style={styles.label} color={theme['c-font']}>邀请码</Text>
              <View style={[styles.inputWrapper, inviteCodeFocused && styles.inputWrapperFocused]}>
                <TextInput
                  style={styles.input}
                  value={inviteCode}
                  onChangeText={setInviteCode}
                  placeholder="请输入邀请码"
                  placeholderTextColor={theme['c-font-label']}
                  autoCapitalize="none"
                  editable={!isLoading}
                  onFocus={() => setInviteCodeFocused(true)}
                  onBlur={() => setInviteCodeFocused(false)}
                  underlineColorAndroid="transparent"
                />
              </View>
            </View>
          )}

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={isLogin ? handleLogin : handleRegister}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color={theme['c-primary-light-100']} size="small" />
            ) : (
              <Text style={styles.buttonText} color={theme['c-primary-light-100']}>
                {isLogin ? '登录' : '注册'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switchButton}
            onPress={() => setIsLogin(!isLogin)}
            disabled={isLoading}
            activeOpacity={0.7}
          >
            <Text style={styles.switchButtonText} color={theme['c-primary-light-100']}>
              {isLogin ? '还没有账户？点击注册' : '已有账户？点击登录'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      
      <TipDialog
        ref={tipDialogRef}
        message={tipDialogMessage}
        btnText="确定"
      />
      
      <ConfirmDialog
        ref={confirmDialogRef}
        title={confirmDialogConfig.title}
        message={confirmDialogConfig.message}
        cancelButtonText="取消"
        confirmButtonText="确定"
        onConfirm={confirmDialogConfig.onConfirm}
      />
    </View>
  )
}

export default Login

