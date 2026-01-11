import { render } from 'ink';
import App from './App.js';

process.stdout.write('\x1B[?1049h');
process.stdout.write('\x1B[H');

const restoreScreen = () => {
  process.stdout.write('\x1B[?1049l');
};

process.on('exit', restoreScreen);
process.on('SIGINT', () => {
  restoreScreen();
  process.exit(0);
});
process.on('SIGTERM', () => {
  restoreScreen();
  process.exit(0);
});

try {
  render(<App />, {
    maxFps: 20,
  });
} catch (error: any) {
  restoreScreen();
  if (error.message.includes('Raw mode')) {
    console.error('Error: This terminal does not support raw mode required by Ink.');
    console.error('Try running in a standard terminal (not in IDE or special console).');
  } else {
    console.error('Failed to start:', error.message);
  }
  process.exit(1);
}
