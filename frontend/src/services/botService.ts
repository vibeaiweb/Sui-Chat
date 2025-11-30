/**
 * Bot service for calling bot APIs and handling responses
 */

import { BotConfig } from '../config/bots';

export interface BotResponse {
  success: boolean;
  response: string;
  error?: string;
}

/**
 * Call bot API to get response
 * @param bot - Bot configuration
 * @param question - User's question
 * @param username - User's username
 * @returns Bot's response
 */
export async function callBot(
  bot: BotConfig,
  question: string,
  username: string
): Promise<BotResponse> {
  try {
    console.log(`Calling bot ${bot.name} with question:`, question);

    // Construct API URL with query parameters
    const url = new URL(bot.apiEndpoint);
    url.searchParams.set('text', question);
    url.searchParams.set('userid', username);

    console.log('Bot API URL:', url.toString());

    // Call bot API
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    console.log('Bot API response status:', response.status);

    if (!response.ok) {
      throw new Error(`Bot API returned ${response.status}: ${response.statusText}`);
    }

    // Parse response
    const contentType = response.headers.get('content-type');
    let botReply: string;

    if (contentType?.includes('application/json')) {
      const data = await response.json();
      console.log('Bot API JSON response:', data);

      // Try to extract text from common response formats
      botReply = data.response || data.reply || data.text || data.message || JSON.stringify(data);
    } else {
      // Plain text response
      botReply = await response.text();
      console.log('Bot API text response:', botReply);
    }

    return {
      success: true,
      response: botReply,
    };
  } catch (error) {
    console.error('Failed to call bot:', error);
    return {
      success: false,
      response: '',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Format bot response message for display
 * @param botName - Bot's display name
 * @param originalQuestion - User's original question
 * @param askerUsername - Username of the person who asked
 * @param botResponse - Bot's response text
 * @returns Formatted message
 */
export function formatBotResponse(
  botName: string,
  originalQuestion: string,
  askerUsername: string,
  botResponse: string
): string {
  return `🤖 ${botName}

回覆 @${askerUsername}: ${originalQuestion}

${botResponse}`;
}
