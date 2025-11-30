/**
 * Chat bot configuration
 * Define all available bots and their API endpoints
 */

export interface BotConfig {
  name: string;
  displayName: string;
  apiEndpoint: string;
  description: string;
  avatar?: string;
}

/**
 * List of available chat bots
 */
export const BOTS: BotConfig[] = [
  {
    name: 'Vicky',
    displayName: '【Lucky Vicky】張員瑛',
    apiEndpoint: 'https://vibeaiweb3.zeabur.app/webhook/agent-01',
    description: 'AI 助手 - 張員瑛',
    avatar: '', // 可以添加機器人頭像 URL
  },
  {
    name: 'Aoi',
    displayName: '【Smart Aoi】森川葵',
    apiEndpoint: 'https://vibeaiweb3.zeabur.app/webhook/agent-02',
    description: 'AI 助手 - 森川葵',
    avatar: '', // 可以添加機器人頭像 URL
  },
  {
    name: 'Himmel',
    displayName: '【Reliable Himmel】欣梅爾',
    apiEndpoint: 'https://vibeaiweb3.zeabur.app/webhook/agent-03',
    description: 'AI 助手 - 欣梅爾',
    avatar: '', // 可以添加機器人頭像 URL
  },
  {
    name: 'Naval',
    displayName: '【Mentor Naval】Naval',
    apiEndpoint: 'https://vibeaiweb3.zeabur.app/webhook/agent-04',
    description: 'AI 助手 - Naval',
    avatar: '', // 可以添加機器人頭像 URL
  },
  
  // 可以添加更多機器人
  // {
  //   name: 'Aoi',
  //   displayName: '另一個機器人',
  //   apiEndpoint: 'https://example.com/bot',
  //   description: '另一個 AI 助手',
  // },
];

/**
 * Get bot configuration by name
 * @param name - Bot name (supports @mention format)
 * @returns Bot configuration or null if not found
 */
export function getBotByName(name: string): BotConfig | null {
  // Remove @ symbol if present
  const cleanName = name.replace('@', '').trim();

  return BOTS.find(
    bot =>
      bot.name.toLowerCase() === cleanName.toLowerCase() ||
      bot.displayName.toLowerCase().includes(cleanName.toLowerCase())
  ) || null;
}

/**
 * Detect if a message mentions any bot
 * @param message - Message content
 * @returns Array of mentioned bots
 */
export function detectBotMentions(message: string): BotConfig[] {
  const mentions: BotConfig[] = [];

  for (const bot of BOTS) {
    // Check for @BotName or just BotName
    const patterns = [
      `@${bot.name}`,
      `@${bot.displayName}`,
      bot.name,
      bot.displayName,
    ];

    if (patterns.some(pattern => message.includes(pattern))) {
      mentions.push(bot);
    }
  }

  return mentions;
}

/**
 * Extract question text from message (remove bot mention)
 * @param message - Original message
 * @param botName - Bot name to remove
 * @returns Clean question text
 */
export function extractQuestion(message: string, botName: string): string {
  const patterns = [
    `@${botName}`,
    botName,
  ];

  let question = message;
  for (const pattern of patterns) {
    question = question.replace(pattern, '');
  }

  return question.trim();
}
