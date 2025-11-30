import { useState, useEffect } from 'react';
import { useCurrentAccount, useSuiClient, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { UserProfile } from '../types';
import { PACKAGE_ID, CLOCK_OBJECT_ID, WALRUS_AGGREGATOR } from '../config/constants';
import { uploadToWalrus } from '../utils/walrus';

export function useProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction();

  // Fetch user profile
  const fetchProfile = async (address?: string) => {
    const walletAddress = address || currentAccount?.address;
    if (!walletAddress) return null;

    try {
      setIsLoading(true);

      // Query for UserProfile objects owned by this address
      const objects = await suiClient.getOwnedObjects({
        owner: walletAddress,
        filter: {
          StructType: `${PACKAGE_ID}::user_profile::UserProfile`,
        },
        options: {
          showContent: true,
        },
      });

      if (objects.data.length > 0) {
        const profileObj = objects.data[0];

        if (profileObj.data?.content?.dataType === 'moveObject') {
          const fields = profileObj.data.content.fields as any;

          // Get avatar URL from Walrus if exists
          let avatarUrl = '';
          const avatarBlobId = fields.avatar_walrus_blob_id;

          // Only use if blob ID is valid (not empty, not a placeholder)
          const isValidBlobId = avatarBlobId &&
                                avatarBlobId.trim() !== '' &&
                                !avatarBlobId.startsWith('default_');

          if (isValidBlobId) {
            // For images, use the Walrus URL directly instead of downloading
            avatarUrl = `${WALRUS_AGGREGATOR}/v1/blobs/${avatarBlobId}`;
          }

          const userProfile: UserProfile = {
            id: profileObj.data.objectId,
            wallet_address: fields.wallet_address,
            username: fields.username,
            avatar_walrus_blob_id: fields.avatar_walrus_blob_id,
            created_at: parseInt(fields.created_at),
            last_seen: parseInt(fields.last_seen),
            avatar_url: avatarUrl,
          };

          setProfile(userProfile);
          setHasProfile(true);
          return userProfile;
        }
      }

      setHasProfile(false);
      return null;
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Create a new user profile
  const createProfile = async (username: string, avatarFile?: File) => {
    if (!currentAccount?.address) {
      throw new Error('Wallet not connected');
    }

    try {
      setIsLoading(true);

      // Upload avatar to Walrus if provided
      let avatarBlobId = '';
      if (avatarFile) {
        avatarBlobId = await uploadToWalrus(avatarFile);
      }

      // Create transaction to create profile
      const tx = new Transaction();

      tx.moveCall({
        target: `${PACKAGE_ID}::user_profile::create_profile`,
        arguments: [
          tx.pure.string(username),
          tx.pure.string(avatarBlobId),
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

      // Fetch the newly created profile
      await fetchProfile();

      return result.digest;
    } catch (error) {
      console.error('Failed to create profile:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Update user profile
  const updateProfile = async (username?: string, avatarFile?: File) => {
    if (!currentAccount?.address || !profile) {
      throw new Error('No profile to update');
    }

    try {
      setIsLoading(true);

      const tx = new Transaction();

      // Upload new avatar if provided
      if (avatarFile) {
        const avatarBlobId = await uploadToWalrus(avatarFile);

        tx.moveCall({
          target: `${PACKAGE_ID}::user_profile::update_avatar`,
          arguments: [
            tx.object(profile.id),
            tx.pure.string(avatarBlobId),
            tx.object(CLOCK_OBJECT_ID),
          ],
        });
      }

      // Update username if provided
      if (username && username !== profile.username) {
        tx.moveCall({
          target: `${PACKAGE_ID}::user_profile::update_username`,
          arguments: [
            tx.object(profile.id),
            tx.pure.string(username),
            tx.object(CLOCK_OBJECT_ID),
          ],
        });
      }

      // Execute transaction
      const result = await signAndExecuteTransaction({
        transaction: tx,
      });

      await suiClient.waitForTransaction({
        digest: result.digest,
      });

      // Refresh profile
      await fetchProfile();

      return result.digest;
    } catch (error) {
      console.error('Failed to update profile:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Update last seen timestamp
  const updateLastSeen = async () => {
    if (!currentAccount?.address || !profile) return;

    try {
      const tx = new Transaction();

      tx.moveCall({
        target: `${PACKAGE_ID}::user_profile::update_last_seen`,
        arguments: [
          tx.object(profile.id),
          tx.object(CLOCK_OBJECT_ID),
        ],
      });

      await signAndExecuteTransaction({
        transaction: tx,
      });
    } catch (error) {
      console.error('Failed to update last seen:', error);
    }
  };

  // Fetch profile when account changes
  useEffect(() => {
    if (currentAccount?.address) {
      fetchProfile();
    } else {
      setProfile(null);
      setHasProfile(false);
    }
  }, [currentAccount?.address]);

  return {
    profile,
    hasProfile,
    isLoading,
    createProfile,
    updateProfile,
    updateLastSeen,
    refreshProfile: fetchProfile,
  };
}
