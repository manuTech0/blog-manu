// lib/logger.ts — Edge-safe custom logger

type LogLevel = 'info' | 'debug' | 'warn' | 'error';

const isProduction = process.env.NODE_ENV === 'production';

function format(level: LogLevel, ...args: any[]) {
  const timestamp = new Date().toISOString();
  return [`[${timestamp}] [${level.toUpperCase()}]`, ...args];
}

export const logger = {
  info: (...args: any[]) => {
    console.info(...format('info', ...args));
  },
  debug: (...args: any[]) => {
    if (!isProduction) console.debug(...format('debug', ...args));
  },
  warn: (...args: any[]) => {
    console.warn(...format('warn', ...args));
  },
  error: (...args: any[]) => {
    console.error(...format('error', ...args));
  },
};
