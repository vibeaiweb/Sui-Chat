import { useState, useRef } from 'react';
import { Flex, TextArea, Button, Text } from '@radix-ui/themes';
import { PaperPlaneIcon } from '@radix-ui/react-icons';

interface MessageInputProps {
  onSend: (content: string) => Promise<void>;
  onTyping?: (isTyping: boolean) => void;
  disabled?: boolean;
}

export default function MessageInput({ onSend, onTyping, disabled = false }: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  const maxLength = 1000;
  const remainingChars = maxLength - message.length;

  const handleSend = async () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || isSending) return;

    try {
      setIsSending(true);

      // 停止打字指示器
      if (onTyping) {
        onTyping(false);
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
      }

      await onSend(trimmedMessage);
      setMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setMessage(newValue);

    // 发送打字指示器
    if (onTyping && newValue.trim()) {
      onTyping(true);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Flex direction="column" gap="2">
      <TextArea
        value={message}
        onChange={handleChange}
        onKeyDown={handleKeyPress}
        placeholder="輸入訊息... (Enter 發送, Shift+Enter 換行)"
        disabled={disabled || isSending}
        size="3"
        style={{
          minHeight: '80px',
          resize: 'vertical',
        }}
        maxLength={maxLength}
      />
      <Flex justify="between" align="center">
        <Text size="1" color={remainingChars < 100 ? 'red' : 'gray'}>
          {remainingChars} 字符剩餘
        </Text>
        <Button
          onClick={handleSend}
          disabled={!message.trim() || disabled || isSending}
          size="2"
        >
          <PaperPlaneIcon />
          {isSending ? '發送中...' : '發送'}
        </Button>
      </Flex>
    </Flex>
  );
}
