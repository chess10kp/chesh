import { useState, useEffect, useRef, useMemo } from 'react';

interface TerminalSize {
  width: number;
  height: number;
}

export function useTerminalSize(debounceMs: number = 100): TerminalSize {
  const [size, setSize] = useState<TerminalSize>(() => ({
    width: process.stdout.columns || 80,
    height: process.stdout.rows || 24,
  }));

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleResize = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        const newWidth = process.stdout.columns || 80;
        const newHeight = process.stdout.rows || 24;
        
        setSize(prev => {
          if (prev.width === newWidth && prev.height === newHeight) {
            return prev;
          }
          return { width: newWidth, height: newHeight };
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

  // Return stable reference when values haven't changed
  const stableSize = useMemo(() => size, [size.width, size.height]);
  return stableSize;
}
