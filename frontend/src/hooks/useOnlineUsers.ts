import { useState, useEffect } from 'react';
import { useSuiClient } from '@mysten/dapp-kit';
import { UserProfile } from '../types';
import { PACKAGE_ID, WALRUS_AGGREGATOR } from '../config/constants';

export function useOnlineUsers() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const suiClient = useSuiClient();

  const fetchUsers = async () => {
    try {
      setIsLoading(true);

      // Query for ProfileCreatedEvent to get all users
      const events = await suiClient.queryEvents({
        query: {
          MoveEventType: `${PACKAGE_ID}::user_profile::ProfileCreatedEvent`
        },
        limit: 100,
        order: 'descending'
      });

      const userPromises = events.data.map(async (event: any) => {
        const walletAddress = event.parsedJson?.wallet_address;
        if (!walletAddress) return null;

        try {
          // Get user's profile
          const profiles = await suiClient.getOwnedObjects({
            owner: walletAddress,
            filter: {
              StructType: `${PACKAGE_ID}::user_profile::UserProfile`,
            },
            options: {
              showContent: true,
            },
          });

          if (profiles.data.length > 0) {
            const profileObj = profiles.data[0];
            if (profileObj.data?.content?.dataType === 'moveObject') {
              const fields = profileObj.data.content.fields as any;

              // Get avatar URL
              let avatarUrl = '';
              const avatarBlobId = fields.avatar_walrus_blob_id;
              if (avatarBlobId && avatarBlobId.trim() !== '' && !avatarBlobId.startsWith('default_')) {
                avatarUrl = `${WALRUS_AGGREGATOR}/v1/blobs/${avatarBlobId}`;
              }

              // Get user's last message timestamp
              let lastMessageTime: number | undefined = undefined;
              try {
                const messageEvents = await suiClient.queryEvents({
                  query: {
                    MoveEventType: `${PACKAGE_ID}::chat_room::MessageSentEvent`
                  },
                  limit: 50,
                  order: 'descending'
                });

                // Find the most recent message from this user
                const userMessage = messageEvents.data.find(
                  (event: any) => event.parsedJson?.sender === walletAddress
                );

                if (userMessage) {
                  lastMessageTime = parseInt((userMessage.parsedJson as any)?.timestamp || '0');
                }
              } catch (error) {
                console.error('Failed to fetch user messages:', error);
              }

              const userProfile: UserProfile = {
                id: profileObj.data.objectId,
                wallet_address: fields.wallet_address,
                username: fields.username,
                avatar_walrus_blob_id: fields.avatar_walrus_blob_id,
                created_at: parseInt(fields.created_at),
                last_seen: parseInt(fields.last_seen),
                avatar_url: avatarUrl,
                lastMessageTime,
              };

              return userProfile;
            }
          }
          return null;
        } catch (error) {
          console.error('Failed to fetch user profile:', error);
          return null;
        }
      });

      const fetchedUsers = (await Promise.all(userPromises)).filter(
        (user): user is UserProfile => user !== null
      );

      // Remove duplicates based on wallet_address
      const uniqueUsers = Array.from(
        new Map(fetchedUsers.map(user => [user.wallet_address, user])).values()
      );

      // Sort by last_seen (most recent first)
      uniqueUsers.sort((a, b) => b.last_seen - a.last_seen);

      setUsers(uniqueUsers);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();

    // Refresh every 30 seconds
    const interval = setInterval(fetchUsers, 30000);

    return () => clearInterval(interval);
  }, []);

  return {
    users,
    isLoading,
    refreshUsers: fetchUsers,
  };
}
