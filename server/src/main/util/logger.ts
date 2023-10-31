import winston from 'winston';
const {
    combine, timestamp, colorize, align, printf,
} = winston.format;
const LOG_LEVEL = process.env.NODE_ENV === 'production' ? 'info' : 'debug'

const basicFormat = printf(info => `${info.timestamp} ${info.level}: ${info.message}`);
const transports = [];
transports.push(new (winston.transports.Console)({level: LOG_LEVEL}));

export const logger = winston.createLogger({
    transports,
    format: combine(
        colorize(),
        align(),
        timestamp(),
        basicFormat,
    ),
});