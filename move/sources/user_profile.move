/// User Profile Management Module
///
/// This module manages user profiles for the Sui-Chat application.
/// Each user gets a unique UserProfile NFT containing their information.
module sui_chat::user_profile {
    use std::string::String;
    use sui::event;

    // ======== Errors ========

    const ENotProfileOwner: u64 = 0;
    const EInvalidUsername: u64 = 1;

    // ======== Structs ========

    /// User Profile NFT
    /// Each connected wallet gets one UserProfile
    public struct UserProfile has key, store {
        id: UID,
        /// Wallet address of the owner
        wallet_address: address,
        /// Display name chosen by user
        username: String,
        /// Walrus blob ID for avatar image
        avatar_walrus_blob_id: String,
        /// Timestamp when profile was created
        created_at: u64,
        /// Last time user was active
        last_seen: u64,
    }

    // ======== Events ========

    /// Emitted when a new profile is created
    public struct ProfileCreatedEvent has copy, drop {
        profile_id: ID,
        wallet_address: address,
        username: String,
        timestamp: u64,
    }

    /// Emitted when profile is updated
    public struct ProfileUpdatedEvent has copy, drop {
        profile_id: ID,
        wallet_address: address,
        field: String,  // "username" or "avatar"
        timestamp: u64,
    }

    // ======== Public Functions ========

    /// Create a new user profile
    ///
    /// # Arguments
    /// * `username` - Display name for the user
    /// * `avatar_walrus_blob_id` - Walrus blob ID containing avatar image
    /// * `clock` - Sui clock for timestamp
    /// * `ctx` - Transaction context
    public entry fun create_profile(
        username: String,
        avatar_walrus_blob_id: String,
        clock: &sui::clock::Clock,
        ctx: &mut TxContext
    ) {
        // Validate username is not empty
        assert!(username.length() > 0, EInvalidUsername);

        let sender = ctx.sender();
        let timestamp = clock.timestamp_ms();

        let profile = UserProfile {
            id: object::new(ctx),
            wallet_address: sender,
            username,
            avatar_walrus_blob_id,
            created_at: timestamp,
            last_seen: timestamp,
        };

        let profile_id = object::id(&profile);

        // Emit event
        event::emit(ProfileCreatedEvent {
            profile_id,
            wallet_address: sender,
            username: profile.username,
            timestamp,
        });

        // Transfer to sender
        transfer::transfer(profile, sender);
    }

    /// Update username
    ///
    /// # Arguments
    /// * `profile` - Mutable reference to UserProfile
    /// * `new_username` - New display name
    /// * `clock` - Sui clock for timestamp
    /// * `ctx` - Transaction context
    public entry fun update_username(
        profile: &mut UserProfile,
        new_username: String,
        clock: &sui::clock::Clock,
        ctx: &mut TxContext
    ) {
        // Only owner can update
        assert!(profile.wallet_address == ctx.sender(), ENotProfileOwner);
        assert!(new_username.length() > 0, EInvalidUsername);

        profile.username = new_username;
        profile.last_seen = clock.timestamp_ms();

        // Emit event
        event::emit(ProfileUpdatedEvent {
            profile_id: object::id(profile),
            wallet_address: profile.wallet_address,
            field: b"username".to_string(),
            timestamp: profile.last_seen,
        });
    }

    /// Update avatar
    ///
    /// # Arguments
    /// * `profile` - Mutable reference to UserProfile
    /// * `new_avatar_blob_id` - New Walrus blob ID for avatar
    /// * `clock` - Sui clock for timestamp
    /// * `ctx` - Transaction context
    public entry fun update_avatar(
        profile: &mut UserProfile,
        new_avatar_blob_id: String,
        clock: &sui::clock::Clock,
        ctx: &mut TxContext
    ) {
        // Only owner can update
        assert!(profile.wallet_address == ctx.sender(), ENotProfileOwner);

        profile.avatar_walrus_blob_id = new_avatar_blob_id;
        profile.last_seen = clock.timestamp_ms();

        // Emit event
        event::emit(ProfileUpdatedEvent {
            profile_id: object::id(profile),
            wallet_address: profile.wallet_address,
            field: b"avatar".to_string(),
            timestamp: profile.last_seen,
        });
    }

    /// Update last seen timestamp
    /// Called when user performs any action
    public entry fun update_last_seen(
        profile: &mut UserProfile,
        clock: &sui::clock::Clock,
        ctx: &mut TxContext
    ) {
        assert!(profile.wallet_address == ctx.sender(), ENotProfileOwner);
        profile.last_seen = clock.timestamp_ms();
    }

    // ======== Public Getter Functions ========

    /// Get wallet address
    public fun wallet_address(profile: &UserProfile): address {
        profile.wallet_address
    }

    /// Get username
    public fun username(profile: &UserProfile): String {
        profile.username
    }

    /// Get avatar blob ID
    public fun avatar_blob_id(profile: &UserProfile): String {
        profile.avatar_walrus_blob_id
    }

    /// Get created timestamp
    public fun created_at(profile: &UserProfile): u64 {
        profile.created_at
    }

    /// Get last seen timestamp
    public fun last_seen(profile: &UserProfile): u64 {
        profile.last_seen
    }

    // ======== Test Functions ========

    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        // Test initialization if needed
    }

    #[test]
    fun test_getter_functions() {
        let user = @0xA;
        let mut ctx = tx_context::dummy();

        // Create a test profile directly
        let profile = UserProfile {
            id: object::new(&mut ctx),
            wallet_address: user,
            username: b"Alice".to_string(),
            avatar_walrus_blob_id: b"avatar_123".to_string(),
            created_at: 1234567890,
            last_seen: 1234567890,
        };

        // Test getter functions
        assert!(wallet_address(&profile) == user);
        assert!(username(&profile) == b"Alice".to_string());
        assert!(avatar_blob_id(&profile) == b"avatar_123".to_string());
        assert!(created_at(&profile) == 1234567890);
        assert!(last_seen(&profile) == 1234567890);

        // Clean up
        let UserProfile { id, wallet_address: _, username: _, avatar_walrus_blob_id: _, created_at: _, last_seen: _ } = profile;
        object::delete(id);
    }
}
