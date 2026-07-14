/**
 * Logger — Structured logging with Winston + Morgan integration
 * 
 * Winston handles application-level logs (info, warn, error, debug)
 * with file transport in production and colorized console in dev.
 * Morgan middleware logs every HTTP request for observability.
 */

const winston = require('winston');
const morgan = require('morgan');

// --- Log format ---
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
        let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
        if (stack) log += `\n${stack}`;
        if (Object.keys(meta).length > 0) log += ` ${JSON.stringify(meta)}`;
        return log;
    })
);

// --- Winston Logger Instance ---
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    defaultMeta: { service: 'medai-backend' },
    transports: [
        // Console transport — always active
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                logFormat
            )
        }),
    ],
});

// --- Add file transports in production ---
if (process.env.NODE_ENV === 'production') {
    logger.add(new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        maxsize: 5 * 1024 * 1024, // 5MB
        maxFiles: 5,
    }));
    logger.add(new winston.transports.File({
        filename: 'logs/combined.log',
        maxsize: 10 * 1024 * 1024, // 10MB
        maxFiles: 5,
    }));
}

// --- Morgan HTTP Request Logger Middleware ---
// Streams Morgan output through Winston so all logs go through one system
const morganMiddleware = morgan(
    ':method :url :status :res[content-length] - :response-time ms',
    {
        stream: {
            write: (message) => logger.info(message.trim(), { type: 'http' })
        }
    }
);

module.exports = { logger, morganMiddleware };
