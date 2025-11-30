import { Box, Flex, Heading, Text } from '@radix-ui/themes';
import { Message } from '../types';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import UserList from './UserList';

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

        {/* Input */}
        <Box
          p="4"
          style={{
            borderTop: '1px solid var(--gray-6)',
            background: 'var(--gray-2)',
          }}
        >
          <MessageInput onSend={onSendMessage} disabled={isLoading} />
        </Box>
      </Flex>

      {/* User List Sidebar */}
      <UserList />
    </Flex>
  );
}
