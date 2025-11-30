import { Box, Flex, Heading, Text } from '@radix-ui/themes';
import { Message } from '../types';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import UserList from './UserList';
import { useTypingIndicator } from '../hooks/useTypingIndicator';

interface ChatRoomProps {
  roomId: string;
  roomName: string;
  messages: Message[];
  onSendMessage: (content: string) => Promise<void>;
  isLoading?: boolean;
}

export default function ChatRoom({
  roomId,
  roomName,
  messages,
  onSendMessage,
  isLoading = false,
}: ChatRoomProps) {
  // WebSocket typing indicator
  const { typingUsers, sendTypingIndicator, isConnected } = useTypingIndicator(roomId);

  return (
    <Flex
      style={{
        height: '80vh',
        border: '1px solid var(--gray-6)',
        borderRadius: 'var(--radius-4)',
        overflow: 'hidden',
        background: 'var(--gray-1)',
      }}
    >
      {/* Chat Area */}
      <Flex
        direction="column"
        style={{
          flex: 1,
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <Box
          p="4"
          style={{
            borderBottom: '1px solid var(--gray-6)',
            background: 'var(--gray-2)',
          }}
        >
          <Heading size="5">{roomName}</Heading>
          <Text size="2" color="gray">
            Room ID: {roomId.slice(0, 8)}...{roomId.slice(-6)}
          </Text>
        </Box>

        {/* Messages */}
        <Box style={{ flex: 1, overflow: 'hidden' }}>
          <MessageList messages={messages} isLoading={isLoading} />
        </Box>

        {/* Typing Indicator */}
        {typingUsers.length > 0 && (
          <Box px="4" py="2" style={{ background: 'var(--gray-2)', borderTop: '1px solid var(--gray-5)' }}>
            <Text size="1" color="gray" style={{ fontStyle: 'italic' }}>
              {typingUsers.map(u => u.userName).join(', ')} 正在打字...
            </Text>
          </Box>
        )}

        {/* WebSocket Connection Status */}
        {!isConnected && (
          <Box px="4" py="1" style={{ background: 'var(--red-3)', borderTop: '1px solid var(--red-6)' }}>
            <Text size="1" color="red">
              ⚠️ WebSocket 未連接 - 打字指示器不可用
            </Text>
          </Box>
        )}

        {/* Input */}
        <Box
          p="4"
          style={{
            borderTop: '1px solid var(--gray-6)',
            background: 'var(--gray-2)',
          }}
        >
          <MessageInput
            onSend={onSendMessage}
            onTyping={sendTypingIndicator}
            disabled={isLoading}
          />
        </Box>
      </Flex>

      {/* User List Sidebar */}
      <UserList />
    </Flex>
  );
}
