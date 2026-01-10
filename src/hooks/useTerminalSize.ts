import { useState, useEffect, useRef } from 'react';

interface TerminalSize {
  width: number;
  height: number;
}

export function useTerminalSize(debounceMs: number = 100): TerminalSize {
  const [size, setSize] = useState<TerminalSize>({
    width: process.stdout.columns || 80,
    height: process.stdout.rows || 24,
  });

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleResize = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        setSize({
          width: process.stdout.columns || 80,
          height: process.stdout.rows || 24,
        });
      }, debounceMs);
    };

    process.stdout.on('resize', handleResize);

    return () => {
      process.stdout.off('resize', handleResize);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [debounceMs]);

  return size;
}
