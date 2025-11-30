import { useEffect, useRef, useState, useCallback } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { io, Socket } from 'socket.io-client';

// WebSocket server URL
const WS_SERVER_URL = import.meta.env.VITE_WS_SERVER_URL || 'http://localhost:3001';

interface TypingUser {
  userId: string;
  userName: string;
}

export function useTypingIndicator(roomId: string) {
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const currentAccount = useCurrentAccount();
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const [isConnected, setIsConnected] = useState(false);

  // 连接 WebSocket
  useEffect(() => {
    if (!currentAccount?.address || !roomId) return;

    console.log('Connecting to WebSocket server:', WS_SERVER_URL);

    const socket = io(WS_SERVER_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    socketRef.current = socket;

    // 连接成功
    socket.on('connect', () => {
      console.log('WebSocket connected:', socket.id);
      setIsConnected(true);

      // 加入房间
      socket.emit('join-room', {
        roomId,
        userId: currentAccount.address,
        userName: currentAccount.address.slice(0, 6) + '...' + currentAccount.address.slice(-4)
      });
    });

    // 连接断开
    socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    });

    // 有用户开始打字
    socket.on('user-typing', (data: TypingUser) => {
      console.log('User typing:', data);
      setTypingUsers((prev) => {
        // 检查用户是否已经在列表中
        const exists = prev.some(u => u.userId === data.userId);
        if (exists) return prev;
        return [...prev, data];
      });
    });

    // 有用户停止打字
    socket.on('user-stopped-typing', (data: { userId: string }) => {
      console.log('User stopped typing:', data);
      setTypingUsers((prev) => prev.filter(u => u.userId !== data.userId));
    });

    // 打字用户列表更新（加入房间时）
    socket.on('typing-users-update', (users: TypingUser[]) => {
      console.log('Typing users update:', users);
      setTypingUsers(users);
    });

    // 清理
    return () => {
      console.log('Cleaning up WebSocket connection');
      socket.disconnect();
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [roomId, currentAccount?.address]);

  // 发送打字指示器
  const sendTypingIndicator = useCallback((isTyping: boolean) => {
    if (!socketRef.current?.connected) {
      console.warn('WebSocket not connected');
      return;
    }

    socketRef.current.emit('typing', { isTyping });

    // 如果开始打字，3秒后自动发送停止打字
    if (isTyping) {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        if (socketRef.current?.connected) {
          socketRef.current.emit('typing', { isTyping: false });
        }
      }, 3000);
    } else {
      // 立即停止打字
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
  }, []);

  return {
    typingUsers,
    sendTypingIndicator,
    isConnected
  };
}
