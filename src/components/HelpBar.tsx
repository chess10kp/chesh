import { memo } from 'react';
import { Box, Text, Spacer } from 'ink';

interface HelpBarProps {
  shortcuts: string;
}

function HelpBar({ shortcuts }: HelpBarProps) {
  return (
    <>
      <Spacer />
      <Box justifyContent="space-between">
        <Box borderStyle="single" borderColor="gray" paddingX={2}>
          <Text color="gray">{shortcuts}</Text>
        </Box>
      </Box>
    </>
  );
}

export default memo(HelpBar);
