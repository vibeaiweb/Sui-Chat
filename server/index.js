const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5180",
    methods: ["GET", "POST"]
  }
});

// 房间管理
const rooms = new Map();

// 用户打字状态管理
const typingUsers = new Map(); // roomId -> Map(userId -> {userName, timeout})

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  let currentRoom = null;
  let currentUser = null;
  let currentUserName = null;

  // 加入房间
  socket.on('join-room', (data) => {
    const { roomId, userId, userName } = data;

    // 离开之前的房间
    if (currentRoom) {
      socket.leave(currentRoom);
      if (rooms.has(currentRoom)) {
        rooms.get(currentRoom).delete(socket.id);
        if (rooms.get(currentRoom).size === 0) {
          rooms.delete(currentRoom);
          typingUsers.delete(currentRoom);
        }
      }
    }

    // 加入新房间
    currentRoom = roomId;
    currentUser = userId;
    currentUserName = userName || 'Anonymous';

    socket.join(roomId);

    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Set());
      typingUsers.set(roomId, new Map());
    }
    rooms.get(roomId).add(socket.id);

    console.log(`User ${userId} (${currentUserName}) joined room ${roomId}`);
    console.log(`Room ${roomId} now has ${rooms.get(roomId).size} users`);

    // 发送当前房间的打字用户列表
    const roomTypingUsers = typingUsers.get(roomId);
    if (roomTypingUsers && roomTypingUsers.size > 0) {
      const typingList = Array.from(roomTypingUsers.entries())
        .filter(([id]) => id !== userId)
        .map(([id, info]) => ({ userId: id, userName: info.userName }));

      socket.emit('typing-users-update', typingList);
    }
  });

  // 打字指示器
  socket.on('typing', (data) => {
    if (!currentRoom || !currentUser) {
      console.error('User not in a room');
      return;
    }

    const { isTyping } = data;
    const roomTypingUsers = typingUsers.get(currentRoom);

    if (isTyping) {
      // 用户开始打字
      if (roomTypingUsers.has(currentUser)) {
        // 清除旧的超时
        clearTimeout(roomTypingUsers.get(currentUser).timeout);
      }

      // 设置新的超时（3秒后自动清除）
      const timeout = setTimeout(() => {
        if (roomTypingUsers.has(currentUser)) {
          roomTypingUsers.delete(currentUser);
          // 广播更新
          socket.to(currentRoom).emit('user-stopped-typing', {
            userId: currentUser,
            userName: currentUserName
          });
        }
      }, 3000);

      roomTypingUsers.set(currentUser, {
        userName: currentUserName,
        timeout
      });

      // 广播给房间内其他用户
      socket.to(currentRoom).emit('user-typing', {
        userId: currentUser,
        userName: currentUserName,
        timestamp: Date.now()
      });

      console.log(`${currentUserName} is typing in room ${currentRoom}`);
    } else {
      // 用户停止打字
      if (roomTypingUsers.has(currentUser)) {
        clearTimeout(roomTypingUsers.get(currentUser).timeout);
        roomTypingUsers.delete(currentUser);
      }

      socket.to(currentRoom).emit('user-stopped-typing', {
        userId: currentUser,
        userName: currentUserName
      });

      console.log(`${currentUserName} stopped typing in room ${currentRoom}`);
    }
  });

  // 断开连接
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);

    if (currentRoom && rooms.has(currentRoom)) {
      rooms.get(currentRoom).delete(socket.id);

      // 清除打字状态
      const roomTypingUsers = typingUsers.get(currentRoom);
      if (roomTypingUsers && roomTypingUsers.has(currentUser)) {
        clearTimeout(roomTypingUsers.get(currentUser).timeout);
        roomTypingUsers.delete(currentUser);

        // 通知其他用户
        socket.to(currentRoom).emit('user-stopped-typing', {
          userId: currentUser,
          userName: currentUserName
        });
      }

      // 清理空房间
      if (rooms.get(currentRoom).size === 0) {
        rooms.delete(currentRoom);
        typingUsers.delete(currentRoom);
        console.log(`Room ${currentRoom} is now empty and removed`);
      }
    }
  });
});

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    rooms: rooms.size,
    connections: io.engine.clientsCount
  });
});

// 获取房间信息
app.get('/rooms/:roomId', (req, res) => {
  const { roomId } = req.params;
  const room = rooms.get(roomId);

  if (!room) {
    return res.json({
      exists: false,
      users: 0
    });
  }

  const typingList = typingUsers.get(roomId);
  const typing = typingList ? Array.from(typingList.keys()) : [];

  res.json({
    exists: true,
    users: room.size,
    typingUsers: typing
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`WebSocket server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
