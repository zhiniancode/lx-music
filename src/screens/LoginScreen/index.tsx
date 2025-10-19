import { useState } from 'react'
import { View, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Image } from 'react-native'
import { Navigation, NavigationFunctionComponent } from 'react-native-navigation'
import { createStyle, confirmDialog, tipDialog } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import { useI18n } from '@/lang'
import Text from '@/components/common/Text'
import { login, register, API_BASE_URL } from '@/core/cloud/api'
import { saveAuthToLocal } from '@/core/cloud/sync'
import { authActions } from '@/store/auth'
import { scaleSizeH, scaleSizeW } from '@/utils/pixelRatio'
import { navigations } from '@/navigation'

const logoImage = require('@/resources/images/logo.png')

const LoginScreen: NavigationFunctionComponent = ({ componentId }) => {
  const theme = useTheme()
  const t = useI18n()

  const [isLogin, setIsLogin] = useState(true) // true: 登录, false: 注册
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // 处理登录成功后的导航
  const handleLoginSuccess = async () => {
    try {
      await navigations.pushHomeScreen()
      // 移除当前登录页面（使用setRoot方式不需要移除）
    } catch (error) {
      console.error('Navigation error:', error)
    }
  }

  // 处理登录
  const handleLogin = async () => {
    if (!username || !password) {
      void tipDialog({
        title: t('login_hint'),
        message: t('login_input_required'),
      })
      return
    }

    setIsLoading(true)
    try {
      const result = await login({ username, password })
      if (result.success && result.data) {
        authActions.setUserInfo(result.data)
        await saveAuthToLocal(result.data)
        void tipDialog({
          title: t('login_success'),
          message: t('login_success_message'),
        }).then(() => {
          handleLoginSuccess()
        })
      } else {
        void tipDialog({
          title: t('login_failed'),
          message: result.message || t('login_failed_message'),
        })
      }
    } catch (error: any) {
      void tipDialog({
        title: t('login_error'),
        message: error.message || t('login_error_message'),
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 处理注册
  const handleRegister = async () => {
    if (!username || !password) {
      void tipDialog({
        title: t('register_hint'),
        message: t('register_input_required'),
      })
      return
    }

    if (password.length < 6) {
      void tipDialog({
        title: t('register_hint'),
        message: t('register_password_length'),
      })
      return
    }

    if (!inviteCode) {
      void tipDialog({
        title: t('register_hint'),
        message: '请输入邀请码',
      })
      return
    }

    setIsLoading(true)
    try {
      const result = await register({ username, password, email: '', inviteCode })
      if (result.success && result.data) {
        authActions.setUserInfo(result.data)
        await saveAuthToLocal(result.data)
        void tipDialog({
          title: t('register_success'),
          message: t('register_success_message'),
        }).then(() => {
          handleLoginSuccess()
        })
      } else {
        void tipDialog({
          title: t('register_failed'),
          message: result.message || t('register_failed_message'),
        })
      }
    } catch (error: any) {
      void tipDialog({
        title: t('register_error'),
        message: error.message || t('register_error_message'),
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 跳过登录（临时进入应用）
  const handleSkipLogin = async () => {
    const confirmed = await confirmDialog({
      title: t('skip_login_title'),
      message: t('skip_login_message'),
      cancelButtonText: t('cancel'),
      confirmButtonText: t('confirm'),
    })
    if (confirmed) {
      handleLoginSuccess()
    }
  }

  const styles = createStyle({
    container: {
      flex: 1,
      backgroundColor: theme['c-content-background'],
    },
    gradientBackground: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: scaleSizeH(300),
      backgroundColor: theme['c-primary-light-100'],
      opacity: 0.08,
      borderBottomLeftRadius: scaleSizeW(50),
      borderBottomRightRadius: scaleSizeW(50),
    },
    scrollView: {
      flex: 1,
    },
    content: {
      padding: scaleSizeW(30),
      paddingTop: scaleSizeH(60),
    },
    logoContainer: {
      alignItems: 'center',
      marginBottom: scaleSizeH(50),
    },
    logoImage: {
      width: scaleSizeW(120),
      height: scaleSizeW(120),
      marginBottom: scaleSizeH(20),
    },
    appName: {
      fontSize: scaleSizeW(32),
      fontWeight: 'bold',
      marginBottom: scaleSizeH(8),
      letterSpacing: 1,
    },
    appSlogan: {
      fontSize: scaleSizeW(14),
      opacity: 0.7,
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
    switchContainer: {
      marginTop: scaleSizeH(20),
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
    },
    switchText: {
      fontSize: scaleSizeW(14),
      marginRight: scaleSizeW(8),
    },
    switchButton: {
      paddingVertical: scaleSizeH(6),
      paddingHorizontal: scaleSizeW(12),
    },
    switchButtonText: {
      fontSize: scaleSizeW(14),
      fontWeight: '600',
    },
    skipButton: {
      marginTop: scaleSizeH(5),
      alignItems: 'center',
      padding: scaleSizeH(12),
    },
    skipButtonText: {
      fontSize: scaleSizeW(14),
      opacity: 0.6,
    },
    divider: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: scaleSizeH(15),
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: theme['c-border-background'],
      opacity: 0.3,
    },
    dividerText: {
      marginHorizontal: scaleSizeW(15),
      fontSize: scaleSizeW(12),
      opacity: 0.5,
    },
  })

  const [usernameFocused, setUsernameFocused] = useState(false)
  const [passwordFocused, setPasswordFocused] = useState(false)
  const [inviteCodeFocused, setInviteCodeFocused] = useState(false)

  return (
    <View style={styles.container}>
      <View style={styles.gradientBackground} />
      <ScrollView 
        style={styles.scrollView} 
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Logo和应用名称 */}
          <View style={styles.logoContainer}>
            <Image 
              source={logoImage} 
              style={styles.logoImage}
              resizeMode="contain"
            />
            <Text style={styles.appName} color={theme['c-font']}>
              {t('app_name')}
            </Text>
            <Text style={styles.appSlogan} color={theme['c-font']}>
              {t('app_slogan')}
            </Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label} color={theme['c-font']}>
              {t('username')}
            </Text>
            <View style={[styles.inputWrapper, usernameFocused && styles.inputWrapperFocused]}>
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                placeholder={t('username_placeholder')}
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
            <Text style={styles.label} color={theme['c-font']}>
              {t('password')}
            </Text>
            <View style={[styles.inputWrapper, passwordFocused && styles.inputWrapperFocused]}>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder={t('password_placeholder')}
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
              <Text style={styles.label} color={theme['c-font']}>
                邀请码
              </Text>
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
                {isLogin ? t('login_button') : t('register_button')}
              </Text>
            )}
          </TouchableOpacity>

          <View style={styles.switchContainer}>
            <Text style={styles.switchText} color={theme['c-font-label']}>
              {isLogin ? t('no_account_text') : t('have_account_text')}
            </Text>
            <TouchableOpacity
              style={styles.switchButton}
              onPress={() => setIsLogin(!isLogin)}
              disabled={isLoading}
              activeOpacity={0.7}
            >
              <Text style={styles.switchButtonText} color="#2196F3">
                {isLogin ? t('register_link') : t('login_link')}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText} color={theme['c-font']}>
              {t('or')}
            </Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkipLogin}
            disabled={isLoading}
            activeOpacity={0.7}
          >
            <Text style={styles.skipButtonText} color="#2196F3">
              {t('skip_login')}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  )
}

LoginScreen.options = {
  topBar: {
    visible: false,
    height: 0,
  },
  statusBar: {
    drawBehind: true,
    visible: true,
    style: 'light',
  },
}

export default LoginScreen

