import pino from 'pino';

const transport = pino.transport({
  target: 'pino-pretty',
  options: {
    colorize: true,
    ignore: 'pid,hostname',
  },
});

const logger = pino(
  {
    level: process.env.LOG_LEVEL || 'info',
    base: {
      env: process.env.NODE_ENV || 'development',
    },
  },
  process.env.NODE_ENV === 'production' ? undefined : transport
);

export default logger;