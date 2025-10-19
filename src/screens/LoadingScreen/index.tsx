import React, { useEffect, useRef } from 'react'
import { View, StyleSheet, Animated, Easing } from 'react-native'
import { useTheme } from '@/store/theme/hook'

const LoadingScreen = () => {
  const theme = useTheme()

  // 动画值
  const titleFadeAnim = useRef(new Animated.Value(0)).current // 标题淡入
  const titleScaleAnim = useRef(new Animated.Value(0.8)).current // 标题缩放
  const contentFadeAnim = useRef(new Animated.Value(0)).current // 其他内容淡入
  const pulseAnim = useRef(new Animated.Value(1)).current
  const rotateAnim = useRef(new Animated.Value(0)).current
  const rotateAnim2 = useRef(new Animated.Value(0)).current // 反向旋转
  const glowAnim = useRef(new Animated.Value(0)).current
  const waveAnim = useRef(new Animated.Value(1)).current // 波纹扩散
  const particleAnim = useRef(new Animated.Value(0)).current // 粒子动画

  useEffect(() => {
    // 淡入动画 - 0.8秒
    Animated.parallel([
      Animated.timing(titleFadeAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(contentFadeAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start()

    // 呼吸脉冲 - 1.5秒周期
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 750,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 750,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start()

    // 背景旋转 - 2.5秒一圈（顺时针）
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2500,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start()

    // 背景反向旋转 - 3秒一圈（逆时针）
    Animated.loop(
      Animated.timing(rotateAnim2, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start()

    // 发光闪烁 - 1.5秒周期
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 750,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 750,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start()

    // 波纹扩散效果 - 2秒周期
    Animated.loop(
      Animated.sequence([
        Animated.timing(waveAnim, {
          toValue: 1.5,
          duration: 2000,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(waveAnim, {
          toValue: 1,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start()

    // 粒子旋转效果 - 4秒周期
    Animated.loop(
      Animated.timing(particleAnim, {
        toValue: 1,
        duration: 4000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start()
  }, [titleFadeAnim, titleScaleAnim, contentFadeAnim, pulseAnim, rotateAnim, rotateAnim2, glowAnim, waveAnim, particleAnim])

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  })

  const spinReverse = rotateAnim2.interpolate({
    inputRange: [0, 1],
    outputRange: ['360deg', '0deg'],
  })

  const particleSpin = particleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  })

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1],
  })

  const waveOpacity = waveAnim.interpolate({
    inputRange: [1, 1.5],
    outputRange: [0.6, 0],
  })

  return (
    <View style={[styles.container, { backgroundColor: theme['c-primary-background'] }]}>
      {/* 背景装饰圆圈 - 顺时针旋转 */}
      <Animated.View
        style={[
          styles.backgroundCircle,
          {
            borderColor: theme['c-primary-light-100'],
            transform: [{ rotate: spin }, { scale: 1.8 }],
            opacity: Animated.multiply(contentFadeAnim, 0.08),
          },
        ]}
      />
      <Animated.View
        style={[
          styles.backgroundCircle,
          {
            borderColor: theme['c-primary-light-100'],
            transform: [{ rotate: spinReverse }, { scale: 1.5 }],
            opacity: Animated.multiply(contentFadeAnim, 0.12),
          },
        ]}
      />
      <Animated.View
        style={[
          styles.backgroundCircle,
          {
            borderColor: theme['c-primary-light-100'],
            transform: [{ rotate: spin }, { scale: 1.2 }],
            opacity: Animated.multiply(contentFadeAnim, 0.15),
          },
        ]}
      />

      {/* 波纹扩散效果 */}
      <Animated.View
        style={[
          styles.waveCircle,
          {
            borderColor: theme['c-primary-light-100'],
            transform: [{ scale: waveAnim }],
            opacity: Animated.multiply(contentFadeAnim, waveOpacity),
          },
        ]}
      />

      <View style={styles.content}>
        {/* 炫酷的中心动画元素 */}
        <Animated.View
          style={{
            opacity: contentFadeAnim,
            alignItems: 'center',
          }}
        >
          {/* 粒子轨道圆环 */}
          <Animated.View
            style={[
              styles.particleOrbit,
              {
                transform: [{ rotate: particleSpin }],
              },
            ]}
          >
            {[0, 1, 2, 3, 4, 5].map((index) => (
              <View
                key={index}
                style={[
                  styles.particle,
                  {
                    backgroundColor: theme['c-primary-light-100'],
                    transform: [
                      { rotate: `${index * 60}deg` },
                      { translateY: -110 },
                    ],
                  },
                ]}
              />
            ))}
          </Animated.View>

          {/* 多层发光圆环 - 营造深度感 */}
          <Animated.View
            style={[
              styles.glowRing,
              {
                borderColor: theme['c-primary-light-100'],
                opacity: Animated.multiply(glowOpacity, 0.35),
                transform: [{ scale: Animated.multiply(pulseAnim, 1.4) }],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.glowRing,
              {
                borderColor: theme['c-primary-light-100'],
                opacity: Animated.multiply(glowOpacity, 0.5),
                transform: [{ scale: Animated.multiply(pulseAnim, 1.2) }],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.glowRing,
              {
                borderColor: theme['c-primary-light-100'],
                opacity: Animated.multiply(glowOpacity, 0.7),
                transform: [{ scale: Animated.multiply(pulseAnim, 1.1) }],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.glowRing,
              {
                borderColor: theme['c-primary-light-100'],
                opacity: glowOpacity,
                transform: [{ scale: pulseAnim }],
              },
            ]}
          />

          {/* 中心发光核心 */}
          <Animated.View
            style={[
              styles.core,
              {
                backgroundColor: theme['c-primary-light-100'],
                opacity: glowOpacity,
                transform: [{ scale: pulseAnim }],
              },
            ]}
          />
        </Animated.View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  backgroundCircle: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    borderWidth: 2,
  },
  waveCircle: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 3,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  particleOrbit: {
    position: 'absolute',
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
  },
  particle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  glowRing: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 4,
  },
  core: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
  },
})

export default LoadingScreen

