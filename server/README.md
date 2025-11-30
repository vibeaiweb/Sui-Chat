# WebSocket 打字指示器服务器

这是一个用于 Sui Chat 的 WebSocket 服务器，提供实时打字指示器功能。

## 功能特性

✅ **实时打字指示器** - 用户打字时，其他用户可以实时看到
✅ **房间管理** - 支持多个聊天室
✅ **自动清理** - 3秒无活动自动清除打字状态
✅ **连接状态管理** - 自动处理断线重连
✅ **健康检查** - HTTP 端点用于监控

## 为什么需要这个服务器？

在优化前，打字指示器是通过链上交易实现的，导致：
- ❌ 每次打字都弹钱包
- ❌ 需要支付 Gas 费用
- ❌ 延迟高（~2秒）
- ❌ 用户体验差

使用 WebSocket 后：
- ✅ 完全不弹钱包
- ✅ 0 Gas 费用
- ✅ 延迟低（<100ms）
- ✅ 用户体验优秀

## 快速开始

### 1. 安装依赖

```bash
cd server
npm install
```

### 2. 启动服务器

```bash
npm start
```

服务器将在 `http://localhost:3001` 启动

### 3. 环境变量（可选）

创建 `.env` 文件：

```env
PORT=3001
FRONTEND_URL=http://localhost:5180
```

## API 端点

### WebSocket 连接

```
ws://localhost:3001
```

### HTTP 端点

#### 健康检查

```
GET /health
```

响应：
```json
{
  "status": "ok",
  "rooms": 2,
  "connections": 5
}
```

#### 获取房间信息

```
GET /rooms/:roomId
```

响应：
```json
{
  "exists": true,
  "users": 3,
  "typingUsers": ["0x123...", "0x456..."]
}
```

## WebSocket 事件

### 客户端 → 服务器

#### join-room
加入聊天室

```javascript
socket.emit('join-room', {
  roomId: '0x...',
  userId: '0x...',
  userName: 'Alice'
});
```

#### typing
发送打字状态

```javascript
socket.emit('typing', {
  isTyping: true  // true = 开始打字, false = 停止打字
});
```

### 服务器 → 客户端

#### user-typing
有用户开始打字

```javascript
socket.on('user-typing', (data) => {
  // data = { userId: '0x...', userName: 'Alice', timestamp: 1234567890 }
});
```

#### user-stopped-typing
有用户停止打字

```javascript
socket.on('user-stopped-typing', (data) => {
  // data = { userId: '0x...', userName: 'Alice' }
});
```

#### typing-users-update
当前房间的打字用户列表（加入房间时发送）

```javascript
socket.on('typing-users-update', (users) => {
  // users = [{ userId: '0x...', userName: 'Alice' }, ...]
});
```

## 部署

### 本地开发

```bash
npm run dev
```

### 生产部署

#### 选项 1: Zeabur

1. 在 Zeabur 项目中添加服务
2. 选择此仓库的 `server` 目录
3. 设置环境变量：
   - `PORT`: 3001（Zeabur 会自动分配）
   - `FRONTEND_URL`: 你的前端 URL
4. 部署

#### 选项 2: Railway

1. 创建新服务
2. 连接 GitHub 仓库
3. 设置根目录为 `server`
4. 部署

#### 选项 3: 任何 VPS

```bash
# 使用 PM2
npm install -g pm2
pm2 start index.js --name "sui-chat-ws"
pm2 save
pm2 startup
```

## 监控

### 查看连接数

```bash
curl http://localhost:3001/health
```

### 查看日志

服务器会输出详细日志：
- 用户连接/断开
- 加入/离开房间
- 打字状态变化

## 故障排除

### 前端无法连接

1. 确认服务器正在运行：
   ```bash
   curl http://localhost:3001/health
   ```

2. 检查前端环境变量：
   ```env
   VITE_WS_SERVER_URL=http://localhost:3001
   ```

3. 检查 CORS 设置（服务器已配置）

### 打字指示器不显示

1. 检查浏览器控制台是否有 WebSocket 错误
2. 确认已成功连接（查看 "WebSocket connected" 日志）
3. 确认加入了房间（查看 "User joined room" 日志）

### 连接频繁断开

1. 检查网络稳定性
2. WebSocket 会自动重连（最多 5 次）
3. 查看服务器日志是否有错误

## 性能

### 资源使用

- **内存**: ~50MB
- **CPU**: < 5%
- **带宽**: ~1KB/用户/分钟

### 扩展性

单个服务器可以轻松支持：
- 1000+ 并发连接
- 100+ 活跃房间

需要更多可以使用 Redis + Socket.io adapter 实现横向扩展。

## 成本

### VPS 部署（推荐）

| 服务商 | 配置 | 价格 |
|--------|------|------|
| DigitalOcean | 1GB RAM | $6/月 |
| Vultr | 1GB RAM | $6/月 |
| Linode | 1GB RAM | $5/月 |

### 云平台

| 服务商 | 价格 |
|--------|------|
| Zeabur | ~$5-10/月 |
| Railway | ~$5/月 |
| Render | 免费层或 $7/月 |

## 安全

- ✅ CORS 已配置
- ✅ 自动清理断开的连接
- ✅ 超时机制防止资源泄漏
- ⚠️ 生产环境建议添加：
  - 身份验证（JWT）
  - 速率限制
  - HTTPS（wss://）

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License
