import { useState } from 'react';
import { Box, Flex, Text, Avatar, Spinner } from '@radix-ui/themes';
import { Message } from '../types';
import { formatTime, truncateAddress } from '../utils/format';
import { getDefaultAvatarUrl } from '../utils/walrus';

interface MessageListProps {
  messages: Message[];
  isLoading?: boolean;
}

export default function MessageList({ messages, isLoading = false }: MessageListProps) {
  if (isLoading && messages.length === 0) {
    return (
      <Flex align="center" justify="center" style={{ height: '100%' }}>
        <Spinner size="3" />
      </Flex>
    );
  }

  if (messages.length === 0) {
    return (
      <Flex align="center" justify="center" direction="column" gap="2" style={{ height: '100%' }}>
        <Text size="4" color="gray">
          沒有訊息
        </Text>
        <Text size="2" color="gray">
          成為第一個發送訊息的人！
        </Text>
      </Flex>
    );
  }

  return (
    <Box p="4" style={{ height: '100%', overflowY: 'auto' }}>
      <Flex direction="column" gap="4">
        {messages.map((message) => (
          <MessageItem key={message.id} message={message} />
        ))}
      </Flex>
    </Box>
  );
}

function MessageItem({ message }: { message: Message }) {
  const [avatarError, setAvatarError] = useState(false);

  // Use Walrus avatar if available and not errored, otherwise use DiceBear default
  const avatarUrl = (message.senderAvatar && !avatarError)
    ? message.senderAvatar
    : getDefaultAvatarUrl(message.sender);

  const displayName = message.senderName || truncateAddress(message.sender);

  return (
    <Flex gap="3" className="fade-in">
      <Avatar
        src={avatarUrl}
        fallback={displayName[0]}
        size="3"
        radius="full"
        onError={() => {
          // If Walrus image fails to load (404, CORS, etc.), fall back to DiceBear
          if (message.senderAvatar && !avatarError) {
            console.log('Walrus avatar failed to load, falling back to DiceBear:', message.senderAvatar);
            setAvatarError(true);
          }
        }}
      />
      <Flex direction="column" gap="1" style={{ flex: 1 }}>
        <Flex align="center" gap="2">
          <Text size="2" weight="bold">
            {displayName}
          </Text>
          <Text size="1" color="gray">
            {formatTime(message.timestamp)}
          </Text>
        </Flex>
        <Box
          p="3"
          style={{
            background: 'var(--gray-3)',
            borderRadius: 'var(--radius-3)',
            border: '1px solid var(--gray-6)',
          }}
        >
          <Text size="2">
            {message.content || '載入中...'}
          </Text>
        </Box>
        {message.read_count > 0 && (
          <Text size="1" color="gray">
            已讀 {message.read_count} 人
          </Text>
        )}
      </Flex>
    </Flex>
  );
}
