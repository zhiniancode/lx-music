import { memo, useMemo } from 'react'
import { View, type TextStyle } from 'react-native'
import Text from './Text'
import { useTheme } from '@/store/theme/hook'
import { createStyle } from '@/utils/tools'

interface MarkdownTextProps {
  children: string
  selectable?: boolean
  style?: TextStyle
}

/**
 * 简单的 Markdown 文本渲染组件
 * 支持：
 * - ### 标题（加粗、稍大字号）
 * - - 列表项（带缩进和颜色）
 * - 普通文本
 */
const MarkdownText = memo(({ children, selectable = false, style }: MarkdownTextProps) => {
  const theme = useTheme()

  const lines = useMemo(() => {
    if (!children) return []
    
    return children.split(/\r?\n/).map((line, index) => {
      // 标题行 (### 开头)
      if (/^#{1,6}\s+/.test(line)) {
        const text = line.replace(/^#{1,6}\s+/, '')
        const level = line.match(/^(#{1,6})/)?.[1].length || 3
        return {
          type: 'heading' as const,
          text,
          level,
          key: `h-${index}`,
        }
      }
      
      // 列表项 (- 或 * 开头)
      if (/^[-*]\s+/.test(line)) {
        const text = line.replace(/^[-*]\s+/, '')
        return {
          type: 'list' as const,
          text,
          key: `l-${index}`,
        }
      }
      
      // 空行
      if (line.trim() === '') {
        return {
          type: 'empty' as const,
          text: '',
          key: `e-${index}`,
        }
      }
      
      // 普通文本
      return {
        type: 'text' as const,
        text: line,
        key: `t-${index}`,
      }
    })
  }, [children])

  return (
    <View>
      {lines.map((line) => {
        switch (line.type) {
          case 'heading':
            return (
              <Text
                key={line.key}
                selectable={selectable}
                style={[
                  styles.heading,
                  { fontSize: 15 - line.level * 0.5 },
                  style,
                ]}
              >
                {line.text}
              </Text>
            )
          
          case 'list':
            return (
              <View key={line.key} style={styles.listItem}>
                <Text style={[styles.listBullet, { color: theme['c-primary'] }]}>• </Text>
                <Text
                  selectable={selectable}
                  style={[styles.listText, style]}
                >
                  {line.text}
                </Text>
              </View>
            )
          
          case 'empty':
            return <View key={line.key} style={styles.emptyLine} />
          
          default:
            return (
              <Text
                key={line.key}
                selectable={selectable}
                style={[styles.text, style]}
              >
                {line.text}
              </Text>
            )
        }
      })}
    </View>
  )
})

const styles = createStyle({
  heading: {
    fontWeight: 'bold',
    marginBottom: 4,
    marginTop: 2,
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 3,
    paddingLeft: 8,
  },
  listBullet: {
    fontSize: 13,
    marginRight: 6,
    lineHeight: 18,
  },
  listText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  text: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 2,
  },
  emptyLine: {
    height: 6,
  },
})

export default MarkdownText

