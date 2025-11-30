import { Box, Flex, Heading, Text, Avatar, ScrollArea, Separator } from '@radix-ui/themes';
import { useOnlineUsers } from '../hooks/useOnlineUsers';
import { BOTS } from '../config/bots';

export default function UserList() {
  const { users, isLoading } = useOnlineUsers();

  // Helper function to determine if user is online (last seen within 5 minutes)
  const isUserOnline = (lastSeen: number) => {
    const now = Date.now();
    const fiveMinutesInMs = 5 * 60 * 1000;
    return (now - lastSeen) < fiveMinutesInMs;
  };

  // Helper function to format timestamp
  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '剛剛';
    if (minutes < 60) return `${minutes}分鐘前`;
    if (hours < 24) return `${hours}小時前`;
    return `${days}天前`;
  };

  return (
    <Flex
      direction="column"
      style={{
        height: '100%',
        borderLeft: '1px solid var(--gray-6)',
        background: 'var(--gray-1)',
        width: '280px',
        minWidth: '280px',
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
        <Heading size="4">聊天室成員</Heading>
        <Text size="2" color="gray">
          {isLoading ? '載入中...' : `${BOTS.length} 個機器人 • ${users.length} 位用戶`}
        </Text>
      </Box>

      {/* User List */}
      <ScrollArea style={{ flex: 1 }}>
        <Flex direction="column" gap="3" p="3">
          {/* Bot List Section */}
          <Box>
            <Text size="2" weight="bold" color="blue" mb="2">
              🤖 可用機器人
            </Text>
            <Flex direction="column" gap="2">
              {BOTS.map((bot) => (
                <Flex
                  key={bot.name}
                  align="center"
                  gap="3"
                  p="2"
                  style={{
                    borderRadius: 'var(--radius-3)',
                    background: 'var(--blue-3)',
                    border: '1px solid var(--blue-6)',
                  }}
                >
                  {/* Bot Avatar */}
                  <Box style={{ position: 'relative' }}>
                    <Avatar
                      src={bot.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${bot.name}`}
                      fallback="🤖"
                      size="3"
                      radius="full"
                    />
                    {/* Bot indicator */}
                    <Box
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        right: 0,
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        background: 'var(--blue-9)',
                        border: '2px solid var(--gray-1)',
                      }}
                    />
                  </Box>

                  {/* Bot info */}
                  <Flex direction="column" style={{ flex: 1, minWidth: 0 }}>
                    <Text size="2" weight="medium" truncate>
                      {bot.displayName}
                    </Text>
                    <Text size="1" color="gray" truncate>
                      @{bot.name}
                    </Text>
                    <Text size="1" color="blue" truncate>
                      {bot.description}
                    </Text>
                  </Flex>
                </Flex>
              ))}
            </Flex>
          </Box>

          <Separator size="4" />

          {/* Online Users Section */}
          <Box>
            <Text size="2" weight="bold" color="green" mb="2">
              👥 線上用戶
            </Text>
            <Flex direction="column" gap="2">
              {isLoading ? (
                <Text size="2" color="gray" align="center">
                  載入中...
                </Text>
              ) : users.length === 0 ? (
                <Text size="2" color="gray" align="center">
                  暫無用戶
                </Text>
              ) : (
                users.map((user) => {
              const online = isUserOnline(user.last_seen);
              const avatarSrc = user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.wallet_address}`;

              return (
                <Flex
                  key={user.id}
                  align="center"
                  gap="3"
                  p="2"
                  style={{
                    borderRadius: 'var(--radius-3)',
                    transition: 'background 0.2s',
                    cursor: 'pointer',
                  }}
                  className="user-item"
                >
                  {/* Avatar with online indicator */}
                  <Box style={{ position: 'relative' }}>
                    <Avatar
                      src={avatarSrc}
                      fallback={user.username.charAt(0).toUpperCase()}
                      size="3"
                      radius="full"
                    />
                    {/* Online indicator */}
                    <Box
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        right: 0,
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        background: online ? 'var(--green-9)' : 'var(--gray-6)',
                        border: '2px solid var(--gray-1)',
                      }}
                    />
                  </Box>

                  {/* User info */}
                  <Flex direction="column" style={{ flex: 1, minWidth: 0 }}>
                    <Text size="2" weight="medium" truncate>
                      {user.username}
                    </Text>
                    <Flex direction="column" gap="0">
                      <Text size="1" color={online ? 'green' : 'gray'} truncate>
                        {online ? '🟢 線上' : '⚫ 離線'}
                      </Text>
                      {user.lastMessageTime ? (
                        <Text size="1" color="gray" truncate>
                          發文: {formatTime(user.lastMessageTime)}
                        </Text>
                      ) : (
                        <Text size="1" color="gray" truncate>
                          尚未發文
                        </Text>
                      )}
                    </Flex>
                  </Flex>
                </Flex>
              );
            })
          )}
            </Flex>
          </Box>
        </Flex>
      </ScrollArea>

      <style>{`
        .user-item:hover {
          background: var(--gray-3);
        }
      `}</style>
    </Flex>
  );
}
