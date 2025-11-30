/// Chat Room Management Module
///
/// This module manages chat rooms and messages for the Sui-Chat application.
/// Features:
/// - Public chat rooms (shared objects)
/// - Message sending with Walrus storage
/// - Typing indicators
/// - Read receipts
module sui_chat::chat_room {
    use std::string::String;
    use sui::event;
    use sui::table::{Self, Table};

    // ======== Errors ========

    const ENotAuthorized: u64 = 0;
    const EInvalidMessageType: u64 = 1;
    const EAlreadyRead: u64 = 2;

    // ======== Constants ========

    const MESSAGE_TYPE_CHAT: u8 = 0;
    const MESSAGE_TYPE_HELLO: u8 = 1;
    const MESSAGE_TYPE_SYSTEM: u8 = 2;

    // ======== Structs ========

    /// Chat Room (Shared Object)
    /// Multiple users can access and send messages
    public struct ChatRoom has key {
        id: UID,
        /// Name of the chat room
        name: String,
        /// Creator of the room
        creator: address,
        /// Timestamp when room was created
        created_at: u64,
        /// Total number of messages
        message_count: u64,
    }

    /// Message (Shared Object)
    /// Contains metadata, actual content stored in Walrus
    public struct Message has key {
        id: UID,
        /// ID of the chat room this message belongs to
        room_id: ID,
        /// Sender's wallet address
        sender: address,
        /// Walrus blob ID containing the message content
        content_walrus_blob_id: String,
        /// Type: 0=chat, 1=hello, 2=system
        message_type: u8,
        /// When the message was sent
        timestamp: u64,
        /// Number of users who have read this message
        read_count: u64,
        /// Table tracking which users have read this message
        readers: Table<address, bool>,
    }

    // ======== Events ========

    /// Emitted when a chat room is created
    public struct RoomCreatedEvent has copy, drop {
        room_id: ID,
        name: String,
        creator: address,
        timestamp: u64,
    }

    /// Emitted when a message is sent
    public struct MessageSentEvent has copy, drop {
        message_id: ID,
        room_id: ID,
        sender: address,
        content_blob_id: String,
        message_type: u8,
        timestamp: u64,
    }

    /// Emitted when user starts/stops typing
    public struct TypingEvent has copy, drop {
        room_id: ID,
        user: address,
        is_typing: bool,
        timestamp: u64,
    }

    /// Emitted when a message is marked as read
    public struct MessageReadEvent has copy, drop {
        message_id: ID,
        reader: address,
        timestamp: u64,
    }

    // ======== Public Functions ========

    /// Create a new chat room
    ///
    /// # Arguments
    /// * `name` - Name of the chat room
    /// * `clock` - Sui clock for timestamp
    /// * `ctx` - Transaction context
    public entry fun create_room(
        name: String,
        clock: &sui::clock::Clock,
        ctx: &mut TxContext
    ) {
        let sender = ctx.sender();
        let timestamp = clock.timestamp_ms();

        let room = ChatRoom {
            id: object::new(ctx),
            name,
            creator: sender,
            created_at: timestamp,
            message_count: 0,
        };

        let room_id = object::id(&room);

        // Emit event
        event::emit(RoomCreatedEvent {
            room_id,
            name: room.name,
            creator: sender,
            timestamp,
        });

        // Share the room so everyone can access it
        transfer::share_object(room);
    }

    /// Send a message to the chat room
    ///
    /// # Arguments
    /// * `room` - Mutable reference to ChatRoom
    /// * `content_walrus_blob_id` - Walrus blob ID containing message content
    /// * `message_type` - Type of message (0=chat, 1=hello, 2=system)
    /// * `clock` - Sui clock for timestamp
    /// * `ctx` - Transaction context
    public entry fun send_message(
        room: &mut ChatRoom,
        content_walrus_blob_id: String,
        message_type: u8,
        clock: &sui::clock::Clock,
        ctx: &mut TxContext
    ) {
        // Validate message type
        assert!(
            message_type == MESSAGE_TYPE_CHAT ||
            message_type == MESSAGE_TYPE_HELLO ||
            message_type == MESSAGE_TYPE_SYSTEM,
            EInvalidMessageType
        );

        let sender = ctx.sender();
        let timestamp = clock.timestamp_ms();

        let message = Message {
            id: object::new(ctx),
            room_id: object::id(room),
            sender,
            content_walrus_blob_id,
            message_type,
            timestamp,
            read_count: 0,
            readers: table::new(ctx),
        };

        let message_id = object::id(&message);

        // Increment message count
        room.message_count = room.message_count + 1;

        // Emit event for real-time updates
        event::emit(MessageSentEvent {
            message_id,
            room_id: object::id(room),
            sender,
            content_blob_id: message.content_walrus_blob_id,
            message_type,
            timestamp,
        });

        // Share the message so everyone can read it
        transfer::share_object(message);
    }

    /// Mark a message as read
    ///
    /// # Arguments
    /// * `message` - Mutable reference to Message
    /// * `clock` - Sui clock for timestamp
    /// * `ctx` - Transaction context
    public entry fun mark_as_read(
        message: &mut Message,
        clock: &sui::clock::Clock,
        ctx: &mut TxContext
    ) {
        let reader = ctx.sender();

        // Check if already read by this user
        assert!(!message.readers.contains(reader), EAlreadyRead);

        // Mark as read
        message.readers.add(reader, true);
        message.read_count = message.read_count + 1;

        // Emit event
        event::emit(MessageReadEvent {
            message_id: object::id(message),
            reader,
            timestamp: clock.timestamp_ms(),
        });
    }

    /// Emit typing indicator event
    ///
    /// # Arguments
    /// * `room` - Reference to ChatRoom
    /// * `is_typing` - True if user is typing, false otherwise
    /// * `clock` - Sui clock for timestamp
    /// * `ctx` - Transaction context
    public entry fun emit_typing(
        room: &ChatRoom,
        is_typing: bool,
        clock: &sui::clock::Clock,
        ctx: &mut TxContext
    ) {
        event::emit(TypingEvent {
            room_id: object::id(room),
            user: ctx.sender(),
            is_typing,
            timestamp: clock.timestamp_ms(),
        });
    }

    // ======== Public Getter Functions ========

    /// Get room name
    public fun room_name(room: &ChatRoom): String {
        room.name
    }

    /// Get room creator
    public fun room_creator(room: &ChatRoom): address {
        room.creator
    }

    /// Get room creation timestamp
    public fun room_created_at(room: &ChatRoom): u64 {
        room.created_at
    }

    /// Get message count in room
    public fun message_count(room: &ChatRoom): u64 {
        room.message_count
    }

    /// Get message sender
    public fun message_sender(message: &Message): address {
        message.sender
    }

    /// Get message content blob ID
    public fun message_content_blob_id(message: &Message): String {
        message.content_walrus_blob_id
    }

    /// Get message type
    public fun message_type(message: &Message): u8 {
        message.message_type
    }

    /// Get message timestamp
    public fun message_timestamp(message: &Message): u64 {
        message.timestamp
    }

    /// Get message read count
    public fun message_read_count(message: &Message): u64 {
        message.read_count
    }

    /// Check if user has read the message
    public fun has_read(message: &Message, user: address): bool {
        message.readers.contains(user)
    }

    // ======== Test Functions ========

    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        // Test initialization if needed
    }

    #[test_only]
    /// Create a test chat room
    public fun create_test_room(ctx: &mut TxContext): ChatRoom {
        ChatRoom {
            id: object::new(ctx),
            name: b"Test Room".to_string(),
            creator: ctx.sender(),
            created_at: 0,
            message_count: 0,
        }
    }

    #[test]
    fun test_room_getter_functions() {
        let creator = @0xA;
        let mut ctx = tx_context::dummy();

        // Create a test room directly
        let room = ChatRoom {
            id: object::new(&mut ctx),
            name: b"Test Room".to_string(),
            creator,
            created_at: 1234567890,
            message_count: 5,
        };

        // Test getter functions
        assert!(room_name(&room) == b"Test Room".to_string());
        assert!(room_creator(&room) == creator);
        assert!(room_created_at(&room) == 1234567890);
        assert!(message_count(&room) == 5);

        // Clean up
        let ChatRoom { id, name: _, creator: _, created_at: _, message_count: _ } = room;
        object::delete(id);
    }

    #[test]
    fun test_message_getter_functions() {
        let sender = @0xA;
        let room_id_addr = @0xB;
        let mut ctx = tx_context::dummy();

        // Create a test message directly
        let message = Message {
            id: object::new(&mut ctx),
            room_id: object::id_from_address(room_id_addr),
            sender,
            content_walrus_blob_id: b"blob_123".to_string(),
            message_type: MESSAGE_TYPE_CHAT,
            timestamp: 1234567890,
            read_count: 2,
            readers: table::new(&mut ctx),
        };

        // Test getter functions
        assert!(message_sender(&message) == sender);
        assert!(message_content_blob_id(&message) == b"blob_123".to_string());
        assert!(message_type(&message) == MESSAGE_TYPE_CHAT);
        assert!(message_timestamp(&message) == 1234567890);
        assert!(message_read_count(&message) == 2);

        // Clean up
        let Message { id, room_id: _, sender: _, content_walrus_blob_id: _, message_type: _, timestamp: _, read_count: _, readers } = message;
        object::delete(id);
        table::destroy_empty(readers);
    }

    #[test]
    fun test_message_types() {
        // Test that message type constants are correctly defined
        assert!(MESSAGE_TYPE_CHAT == 0);
        assert!(MESSAGE_TYPE_HELLO == 1);
        assert!(MESSAGE_TYPE_SYSTEM == 2);
    }
}
