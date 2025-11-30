import { useState, useEffect } from 'react';
import { useCurrentAccount, useSuiClient, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { Message } from '../types';
import { PACKAGE_ID, CHAT_ROOM_ID, CLOCK_OBJECT_ID, WALRUS_AGGREGATOR } from '../config/constants';
import { uploadToWalrus, readFromWalrus } from '../utils/walrus';

export function useChat(roomId: string = CHAT_ROOM_ID) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction();

  // Fetch messages from the chat room
  const fetchMessages = async () => {
    if (!roomId) return;

    try {
      setIsLoading(true);

      // Query all Message objects owned by the room
      // Since messages are transferred to the sender, we need to query all Message objects
      // and filter by room_id
      const messageObjects = await suiClient.queryEvents({
        query: {
          MoveEventType: `${PACKAGE_ID}::chat_room::MessageSentEvent`
        },
        limit: 50,
        order: 'descending'
      });

      const roomMessages = messageObjects.data
        .filter((event: any) => event.parsedJson?.room_id === roomId)
        .reverse();

      const messagePromises = roomMessages.map(async (event: any) => {
        const msgId = event.parsedJson?.message_id;
        if (!msgId) return null;

        try {
          const msgObj = await suiClient.getObject({
            id: msgId,
            options: { showContent: true },
          });

          if (msgObj.data?.content?.dataType === 'moveObject') {
            const msgFields = msgObj.data.content.fields as any;

            // Fetch content from Walrus
            let content = '';
            const blobId = msgFields.content_walrus_blob_id;

            // Skip invalid/test blob IDs
            if (!blobId || blobId.startsWith('walrus_blob_') || blobId.length < 20) {
              console.warn('Skipping invalid blob ID:', blobId);
              return null;
            }

            try {
              content = await readFromWalrus(blobId);
            } catch (error) {
              console.error('Failed to fetch message content from Walrus:', error);
              // Skip messages that fail to load
              return null;
            }

            // Fetch sender profile
            let senderName = undefined;
            let senderAvatar = undefined;
            try {
              console.log('Fetching sender profile for:', msgFields.sender);
              const senderProfiles = await suiClient.getOwnedObjects({
                owner: msgFields.sender,
                filter: {
                  StructType: `${PACKAGE_ID}::user_profile::UserProfile`,
                },
                options: {
                  showContent: true,
                },
              });

              console.log('Sender profiles found:', senderProfiles.data.length);

              if (senderProfiles.data.length > 0) {
                const profileObj = senderProfiles.data[0];
                if (profileObj.data?.content?.dataType === 'moveObject') {
                  const profileFields = profileObj.data.content.fields as any;
                  senderName = profileFields.username;

                  const avatarBlobId = profileFields.avatar_walrus_blob_id;
                  console.log('Avatar blob ID:', avatarBlobId);

                  if (avatarBlobId && avatarBlobId.trim() !== '' && !avatarBlobId.startsWith('default_')) {
                    senderAvatar = `${WALRUS_AGGREGATOR}/v1/blobs/${avatarBlobId}`;
                    console.log('Sender avatar URL:', senderAvatar);
                  }

                  console.log('Sender profile:', { senderName, senderAvatar });
                }
              }
            } catch (error) {
              console.error('Failed to fetch sender profile:', error);
            }

            const message: Message = {
              id: msgId,
              room_id: msgFields.room_id,
              sender: msgFields.sender,
              content_walrus_blob_id: msgFields.content_walrus_blob_id,
              message_type: msgFields.message_type,
              timestamp: parseInt(msgFields.timestamp),
              read_count: msgFields.read_count,
              content,
              senderName,
              senderAvatar,
            };

            return message;
          }
          return null;
        } catch (error) {
          console.error('Failed to fetch individual message:', error);
          return null;
        }
      });

      const fetchedMessages = (await Promise.all(messagePromises)).filter(
        (msg): msg is Message => msg !== null
      );

      // Sort by timestamp
      fetchedMessages.sort((a, b) => a.timestamp - b.timestamp);
      setMessages(fetchedMessages);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Send a new message
  const sendMessage = async (content: string, messageType: number = 0) => {
    if (!currentAccount?.address) {
      throw new Error('Wallet not connected');
    }

    try {
      setIsLoading(true);

      // Upload content to Walrus
      const blobId = await uploadToWalrus(content);

      // Create transaction to send message
      const tx = new Transaction();

      tx.moveCall({
        target: `${PACKAGE_ID}::chat_room::send_message`,
        arguments: [
          tx.object(roomId),
          tx.pure.string(blobId),
          tx.pure.u8(messageType),
          tx.object(CLOCK_OBJECT_ID),
        ],
      });

      // Execute transaction
      const result = await signAndExecuteTransaction({
        transaction: tx,
      });

      // Wait for transaction to be confirmed
      await suiClient.waitForTransaction({
        digest: result.digest,
      });

      // Refresh messages
      await fetchMessages();

      return result.digest;
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Mark message as read
  const markAsRead = async (messageId: string) => {
    if (!currentAccount?.address) {
      throw new Error('Wallet not connected');
    }

    try {
      const tx = new Transaction();

      tx.moveCall({
        target: `${PACKAGE_ID}::chat_room::mark_as_read`,
        arguments: [tx.object(messageId)],
      });

      const result = await signAndExecuteTransaction({
        transaction: tx,
      });

      await suiClient.waitForTransaction({
        digest: result.digest,
      });

      // Update local state
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, read_count: msg.read_count + 1 } : msg
        )
      );

      return result.digest;
    } catch (error) {
      console.error('Failed to mark message as read:', error);
      throw error;
    }
  };

  // Send typing indicator
  // ⚠️ DISABLED: Typing indicators require on-chain transactions
  // This causes wallet popup every time user types, which is too intrusive
  // TODO: Consider implementing this as an off-chain feature or with sponsored transactions
  const sendTypingIndicator = async () => {
    if (!currentAccount?.address) return;

    // Disabled to prevent frequent wallet popups
    console.log('Typing indicator disabled to improve UX');
    return;

    // Original implementation (disabled):
    // try {
    //   const tx = new Transaction();
    //   tx.moveCall({
    //     target: `${PACKAGE_ID}::chat_room::emit_typing`,
    //     arguments: [
    //       tx.object(roomId),
    //       tx.object(CLOCK_OBJECT_ID),
    //     ],
    //   });
    //   await signAndExecuteTransaction({
    //     transaction: tx,
    //   });
    // } catch (error) {
    //   console.error('Failed to send typing indicator:', error);
    // }
  };

  // Subscribe to new messages via events
  useEffect(() => {
    if (!roomId) return;

    fetchMessages();

    // Poll for new messages every 5 seconds
    const interval = setInterval(fetchMessages, 5000);

    return () => clearInterval(interval);
  }, [roomId, currentAccount]);

  return {
    messages,
    isLoading,
    sendMessage,
    markAsRead,
    sendTypingIndicator,
    refreshMessages: fetchMessages,
  };
}
