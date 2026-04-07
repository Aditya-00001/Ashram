import winston from 'winston';
import AuditLog from '../models/AuditLog.js';
// Define the custom format for our logs
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message }) => {
    return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
  })
);

const logger = winston.createLogger({
  level: 'info',
  format: logFormat,
  transports: [
    // 1. Write all ERROR level logs to 'error-logs.txt'
    new winston.transports.File({ filename: 'error-logs.txt', level: 'error' }),
    
    // 2. Write ALL logs (Info, Warnings, Errors) to 'server-logs.txt'
    new winston.transports.File({ filename: 'server-logs.txt' }),
  ],
});

// If we are developing locally, also print to the terminal with colors!
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// Function to log admin actions into the AuditLog collection
export const logAdminAction = async (adminId, adminName, action, details) => {
  try {
    await AuditLog.create({ adminId, adminName, action, details });
    logger.info(`AUDIT: ${adminName} performed ${action}`);
  } catch (error) {
    logger.error(`Failed to save audit log: ${error.message}`);
  }
};

export default logger;