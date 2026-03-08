// Developed by Hirnyk Vlad (HERN1k)

import { join } from 'node:path';
import { appendFileSync, mkdirSync, existsSync } from 'node:fs';

enum LogLevel {
    INFO = "INFO",
    ERROR = "ERROR",
    WARN = "WARN"
}

export class Logger {
    private static instance: Logger;
    private logDir: string = join(process.cwd(), 'logs');

    private constructor() {
        if (!existsSync(this.logDir)) {
            mkdirSync(this.logDir, { recursive: true });
        }
    }

    public static getInstance(): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }

    public info(message: string, context: string = "APP", targetFile?: string): void {
        this.write(LogLevel.INFO, message, context, targetFile);
    }

    public error(message: string, context: string = "APP", targetFile?: string): void {
        this.write(LogLevel.ERROR, message, context, targetFile);
    }

    public warn(message: string, context: string = "APP", targetFile?: string): void {
        this.write(LogLevel.WARN, message, context, targetFile);
    }

    private write(level: LogLevel, message: string, context: string, targetFile?: string): void {
        const date = new Date().toISOString().split('T')[0];
        const time = new Date().toLocaleTimeString();
        
        const fileName = targetFile ? `${targetFile}.log` : `${date}.log`;
        const filePath = join(this.logDir, fileName);

        const logEntry = `[${time}] [${level}] [${context}]: ${message}\n`;

        try {
            appendFileSync(filePath, logEntry);
        } catch (err) {
            console.error(`Failed to write to log: ${err}`);
        }

        const color = level === LogLevel.ERROR ? "\x1b[31m" : level === LogLevel.WARN ? "\x1b[33m" : "\x1b[36m";
        console.log(`${color}${logEntry.trim()}\x1b[0m`);
    }
}

export const logger = Logger.getInstance();