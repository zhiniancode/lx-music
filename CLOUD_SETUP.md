# 云端同步功能配置说明

## 首次使用配置

1. 复制配置文件模板：
```bash
cp src/config/cloudConfig.example.ts src/config/cloudConfig.ts
```

2. 编辑 `src/config/cloudConfig.ts`，修改服务器地址：
```typescript
export const API_BASE_URL = 'http://你的服务器IP:3000/api'
```

例如：
- 本地测试: `http://localhost:3000/api`
- 局域网: `http://192.168.1.100:3000/api`
- 公网: `http://47.115.63.247:3000/api`

3. 保存后运行项目即可

## 注意事项

- `cloudConfig.ts` 文件已在 `.gitignore` 中，不会被提交到 git
- `cloudConfig.example.ts` 是模板文件，会被提交到 git
- 每个开发者可以配置自己的服务器地址

## 服务器部署

详细的服务器部署步骤请参考项目 README。

