/** Structured CloudWatch-friendly logger. Each call emits one JSON line. */

type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

function emit(level: LogLevel, message: string, data?: unknown): void {
  const entry = {
    level,
    timestamp: new Date().toISOString(),
    message,
    ...(data !== undefined ? { data } : {}),
  };
  if (level === 'ERROR') {
    console.error(JSON.stringify(entry));
  } else {
    console.log(JSON.stringify(entry));
  }
}

export const logger = {
  info:  (message: string, data?: unknown) => emit('INFO',  message, data),
  warn:  (message: string, data?: unknown) => emit('WARN',  message, data),
  error: (message: string, data?: unknown) => emit('ERROR', message, data),
  debug: (message: string, data?: unknown) => emit('DEBUG', message, data),
};
