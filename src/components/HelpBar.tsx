import { memo } from 'react';
import { Box, Text, Spacer } from 'ink';

interface HelpBarProps {
  shortcuts: string;
}

function HelpBar({ shortcuts }: HelpBarProps) {
  const parseShortcuts = (text: string) => {
    const parts: Array<{ text: string; isKeybind: boolean }> = [];
    let current = '';
    let inBrackets = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      
      if (char === '[') {
        if (current) {
          parts.push({ text: current, isKeybind: false });
          current = '';
        }
        inBrackets = true;
        current = char;
      } else if (char === ']' && inBrackets) {
        current += char;
        parts.push({ text: current, isKeybind: true });
        current = '';
        inBrackets = false;
      } else {
        current += char;
      }
    }
    
    if (current) {
      parts.push({ text: current, isKeybind: false });
    }

    return parts;
  };

  const parsedShortcuts = parseShortcuts(shortcuts);

  return (
    <>
      <Spacer />
      <Box justifyContent="space-between">
        <Box paddingX={2}>
          {parsedShortcuts.map((part, index) => (
            <Text key={index} color="gray" bold={part.isKeybind}>
              {part.text}
            </Text>
          ))}
        </Box>
      </Box>
    </>
  );
}

export default memo(HelpBar);
