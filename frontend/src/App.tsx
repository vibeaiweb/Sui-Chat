import { ConnectButton, useCurrentAccount } from '@mysten/dapp-kit';
import { Container, Flex, Heading, Text, Box, Button, Dialog, TextField } from '@radix-ui/themes';
import { useState, useEffect } from 'react';
import { ChatRoom } from './components';
import { useChat, useProfile } from './hooks';
import { CHAT_ROOM_ID } from './config/constants';
import { detectBotMentions, extractQuestion } from './config/bots';
import { callBot, formatBotResponse } from './services/botService';

function App() {
  const currentAccount = useCurrentAccount();
  const { profile, hasProfile, createProfile, updateProfile, updateLastSeen } = useProfile();
  const { messages, isLoading, sendMessage } = useChat(CHAT_ROOM_ID);

  // Create profile states
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [username, setUsername] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);

  // Edit profile states
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editUsername, setEditUsername] = useState('');
  const [editAvatarFile, setEditAvatarFile] = useState<File | null>(null);
  const [editAvatarPreview, setEditAvatarPreview] = useState<string>('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Auto-open dialog when user doesn't have profile
  useEffect(() => {
    if (currentAccount && !hasProfile) {
      setShowProfileDialog(true);
    }
  }, [currentAccount, hasProfile]);

  // Update last_seen periodically while user is active
  // ⚠️ DISABLED: Automatic updates cause frequent wallet popups
  // Last seen is now only updated when user sends a message (see handleSendMessage)
  // useEffect(() => {
  //   if (currentAccount && hasProfile && profile) {
  //     // Update immediately when profile loads
  //     updateLastSeen();
  //
  //     // Then update every 2 minutes
  //     const interval = setInterval(() => {
  //       updateLastSeen();
  //     }, 2 * 60 * 1000); // 2 minutes
  //
  //     return () => clearInterval(interval);
  //   }
  // }, [currentAccount, hasProfile, profile]);

  // Handle avatar file selection for create
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('請選擇圖片文件');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('圖片大小不能超過 5MB');
        return;
      }
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle avatar file selection for edit
  const handleEditAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('請選擇圖片文件');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('圖片大小不能超過 5MB');
        return;
      }
      setEditAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Open edit dialog with current profile data
  const handleOpenEditDialog = () => {
    if (profile) {
      setEditUsername(profile.username);
      setEditAvatarPreview(''); // Will show current avatar if no new one selected
      setEditAvatarFile(null);
      setShowEditDialog(true);
    }
  };

  const handleCreateProfile = async () => {
    if (!username.trim()) return;

    try {
      setIsCreatingProfile(true);
      await createProfile(username.trim(), avatarFile || undefined);
      setShowProfileDialog(false);
      setUsername('');
      setAvatarFile(null);
      setAvatarPreview('');
    } catch (error) {
      console.error('Failed to create profile:', error);
      alert('創建個人資料失敗，請重試');
    } finally {
      setIsCreatingProfile(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!editUsername.trim()) return;

    try {
      setIsUpdatingProfile(true);

      // Only update if something changed
      const usernameChanged = editUsername.trim() !== profile?.username;
      const hasNewAvatar = editAvatarFile !== null;

      if (!usernameChanged && !hasNewAvatar) {
        alert('沒有任何更改');
        return;
      }

      await updateProfile(
        usernameChanged ? editUsername.trim() : undefined,
        editAvatarFile || undefined
      );

      setShowEditDialog(false);
      setEditUsername('');
      setEditAvatarFile(null);
      setEditAvatarPreview('');
      alert('個人資料更新成功！');
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('更新個人資料失敗，請重試');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!profile) {
      alert('請先創建個人資料');
      return;
    }

    try {
      // Step 1: Send user's message
      await sendMessage(content, 0); // 0 = CHAT message type
      // Update last_seen timestamp after sending message
      await updateLastSeen();

      // Step 2: Check if message mentions any bot
      const mentionedBots = detectBotMentions(content);

      if (mentionedBots.length > 0) {
        // Process each mentioned bot
        for (const bot of mentionedBots) {
          try {
            console.log(`Bot ${bot.name} mentioned, calling API...`);

            // Extract the question (remove bot mention)
            const question = extractQuestion(content, bot.name);

            // Call bot API
            const botResponse = await callBot(bot, question, profile.username);

            if (botResponse.success) {
              // Format bot response message
              const formattedResponse = formatBotResponse(
                bot.displayName,
                question,
                profile.username,
                botResponse.response
              );

              // Step 3: Send bot's response (user needs to sign again)
              console.log('Sending bot response to chain...');
              await sendMessage(formattedResponse, 0);

              console.log('Bot response sent successfully');
            } else {
              console.error('Bot API failed:', botResponse.error);
              // Optionally notify user that bot failed
              const errorMessage = `🤖 ${bot.displayName}\n\n抱歉，我現在無法回應。請稍後再試。\n\n錯誤: ${botResponse.error}`;
              await sendMessage(errorMessage, 0);
            }
          } catch (botError) {
            console.error(`Failed to process bot ${bot.name}:`, botError);
            // Continue with next bot if there are multiple
          }
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('發送訊息失敗，請重試');
    }
  };

  return (
    <Container size="4">
      <Flex direction="column" gap="4" py="6">
        {/* Header */}
        <Flex justify="between" align="center" px="4">
          <Heading size="8">💬 Sui Chat</Heading>
          <Flex gap="3" align="center">
            {currentAccount && profile && (
              <>
                <Flex align="center" gap="2">
                  <Text size="2" color="gray">
                    {profile.username}
                  </Text>
                  <Button
                    variant="ghost"
                    size="1"
                    onClick={handleOpenEditDialog}
                  >
                    編輯
                  </Button>
                </Flex>
              </>
            )}
            <ConnectButton />
          </Flex>
        </Flex>

        {/* Main Content */}
        <Box px="4">
          {currentAccount ? (
            hasProfile ? (
              // Show chat room if user has profile
              <ChatRoom
                roomId={CHAT_ROOM_ID}
                roomName="Sui Chat Room"
                messages={messages}
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
              />
            ) : (
              // Show profile creation dialog
              <Flex direction="column" gap="4" align="center" justify="center" style={{ minHeight: '50vh' }}>
                <Heading size="6">歡迎使用 Sui Chat</Heading>
                <Text size="3" color="gray">
                  請先創建您的個人資料
                </Text>
                <Dialog.Root open={showProfileDialog} onOpenChange={setShowProfileDialog}>
                  <Dialog.Trigger>
                    <Button size="3">創建個人資料</Button>
                  </Dialog.Trigger>

                  <Dialog.Content maxWidth="500px">
                    <Dialog.Title>創建個人資料</Dialog.Title>
                    <Dialog.Description size="2" mb="4">
                      設定您的用戶名和頭像以開始聊天
                    </Dialog.Description>

                    <Flex direction="column" gap="4">
                      {/* Avatar Upload */}
                      <Flex direction="column" gap="2" align="center">
                        <Text size="2" weight="bold">
                          頭像 (選填)
                        </Text>
                        <Flex direction="column" align="center" gap="3">
                          {/* Avatar Preview */}
                          <Box
                            style={{
                              width: '120px',
                              height: '120px',
                              borderRadius: '60px',
                              overflow: 'hidden',
                              border: '2px solid var(--gray-6)',
                              background: 'var(--gray-3)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {avatarPreview ? (
                              <img
                                src={avatarPreview}
                                alt="Avatar preview"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            ) : (
                              <Text size="1" color="gray">
                                無頭像
                              </Text>
                            )}
                          </Box>
                          {/* File Input */}
                          <label>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleAvatarChange}
                              style={{ display: 'none' }}
                              id="avatar-upload"
                            />
                            <Button
                              variant="soft"
                              size="2"
                              onClick={() => document.getElementById('avatar-upload')?.click()}
                              type="button"
                            >
                              {avatarFile ? '更換頭像' : '選擇頭像'}
                            </Button>
                          </label>
                          {avatarFile && (
                            <Text size="1" color="gray">
                              {avatarFile.name} ({(avatarFile.size / 1024).toFixed(1)} KB)
                            </Text>
                          )}
                        </Flex>
                      </Flex>

                      {/* Username */}
                      <label>
                        <Text as="div" size="2" mb="1" weight="bold">
                          用戶名 *
                        </Text>
                        <TextField.Root
                          placeholder="輸入您的用戶名"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                        />
                      </label>
                    </Flex>

                    <Flex gap="3" mt="4" justify="end">
                      <Dialog.Close>
                        <Button variant="soft" color="gray" disabled={isCreatingProfile}>
                          取消
                        </Button>
                      </Dialog.Close>
                      <Button onClick={handleCreateProfile} disabled={!username.trim() || isCreatingProfile}>
                        {isCreatingProfile ? '創建中...' : '創建'}
                      </Button>
                    </Flex>
                  </Dialog.Content>
                </Dialog.Root>
              </Flex>
            )
          ) : (
            // Show welcome message for non-connected users
            <Flex direction="column" gap="4" align="center" justify="center" style={{ minHeight: '50vh' }}>
              <Heading size="6">Welcome to Sui Chat</Heading>
              <Text size="3" color="gray">
                Connect your Sui wallet to start chatting
              </Text>
            </Flex>
          )}
        </Box>

        {/* Edit Profile Dialog */}
        <Dialog.Root open={showEditDialog} onOpenChange={setShowEditDialog}>
          <Dialog.Content maxWidth="500px">
            <Dialog.Title>編輯個人資料</Dialog.Title>
            <Dialog.Description size="2" mb="4">
              更新您的用戶名和頭像
            </Dialog.Description>

            <Flex direction="column" gap="4">
              {/* Avatar Upload */}
              <Flex direction="column" gap="2" align="center">
                <Text size="2" weight="bold">
                  頭像
                </Text>
                <Flex direction="column" align="center" gap="3">
                  {/* Avatar Preview */}
                  <Box
                    style={{
                      width: '120px',
                      height: '120px',
                      borderRadius: '60px',
                      overflow: 'hidden',
                      border: '2px solid var(--gray-6)',
                      background: 'var(--gray-3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {editAvatarPreview ? (
                      <img
                        src={editAvatarPreview}
                        alt="Avatar preview"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : profile?.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt="Current avatar"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <img
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.wallet_address}`}
                        alt="Default avatar"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    )}
                  </Box>
                  {/* File Input */}
                  <label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleEditAvatarChange}
                      style={{ display: 'none' }}
                      id="edit-avatar-upload"
                    />
                    <Button
                      variant="soft"
                      size="2"
                      onClick={() => document.getElementById('edit-avatar-upload')?.click()}
                      type="button"
                    >
                      {editAvatarFile ? '已選擇新頭像' : '更換頭像'}
                    </Button>
                  </label>
                  {editAvatarFile && (
                    <Text size="1" color="gray">
                      {editAvatarFile.name} ({(editAvatarFile.size / 1024).toFixed(1)} KB)
                    </Text>
                  )}
                </Flex>
              </Flex>

              {/* Username */}
              <label>
                <Text as="div" size="2" mb="1" weight="bold">
                  用戶名
                </Text>
                <TextField.Root
                  placeholder="輸入您的用戶名"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                />
              </label>
            </Flex>

            <Flex gap="3" mt="4" justify="end">
              <Dialog.Close>
                <Button variant="soft" color="gray" disabled={isUpdatingProfile}>
                  取消
                </Button>
              </Dialog.Close>
              <Button onClick={handleUpdateProfile} disabled={!editUsername.trim() || isUpdatingProfile}>
                {isUpdatingProfile ? '更新中...' : '保存'}
              </Button>
            </Flex>
          </Dialog.Content>
        </Dialog.Root>
      </Flex>
    </Container>
  );
}

export default App;
