// Load from environment variables
export const PACKAGE_ID = import.meta.env.VITE_PACKAGE_ID;
export const CHAT_ROOM_ID = import.meta.env.VITE_CHAT_ROOM_ID;
export const WALRUS_PUBLISHER = import.meta.env.VITE_WALRUS_PUBLISHER || 'https://publisher.walrus-testnet.walrus.space';
export const WALRUS_AGGREGATOR = import.meta.env.VITE_WALRUS_AGGREGATOR || 'https://aggregator.walrus-testnet.walrus.space';

// Debug logging for environment variables (only in development)
if (import.meta.env.DEV) {
  console.log('Environment variables loaded:', {
    PACKAGE_ID,
    CHAT_ROOM_ID,
    WALRUS_PUBLISHER,
    WALRUS_AGGREGATOR,
    ENABLE_WALRUS: import.meta.env.VITE_ENABLE_WALRUS
  });
}

// Walrus configuration - default is disabled (false)
export const ENABLE_WALRUS = import.meta.env.VITE_ENABLE_WALRUS === 'true' || false;

// Message types
export const MESSAGE_TYPE = {
  CHAT: 0,
  HELLO: 1,
  SYSTEM: 2,
} as const;

// Sui Clock object ID (shared object on testnet)
export const CLOCK_OBJECT_ID = '0x6';

// Module names
export const MODULES = {
  CHAT_ROOM: 'chat_room',
  USER_PROFILE: 'user_profile',
} as const;

// Event types (for filtering)
export const EVENT_TYPES = {
  ROOM_CREATED: `${PACKAGE_ID}::chat_room::RoomCreatedEvent`,
  MESSAGE_SENT: `${PACKAGE_ID}::chat_room::MessageSentEvent`,
  MESSAGE_READ: `${PACKAGE_ID}::chat_room::MessageReadEvent`,
  TYPING: `${PACKAGE_ID}::chat_room::TypingEvent`,
  PROFILE_CREATED: `${PACKAGE_ID}::user_profile::ProfileCreatedEvent`,
  PROFILE_UPDATED: `${PACKAGE_ID}::user_profile::ProfileUpdatedEvent`,
} as const;

// UI Configuration
export const UI_CONFIG = {
  MESSAGE_LOAD_LIMIT: 20,
  TYPING_DEBOUNCE_MS: 500,
  TYPING_TIMEOUT_MS: 3000,
  MAX_MESSAGE_LENGTH: 1000,
  MAX_USERNAME_LENGTH: 50,
} as const;
