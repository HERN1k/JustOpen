// Developed by Hirnyk Vlad (HERN1k)

import { MySQLi } from "../lib/db/mysqli";
import { logger } from "./logger"; 
import type { IDBDriver, IDBResult } from "./types";

/**
 * Available database drivers supported by the engine.
 */
export enum DBDriverName {
    MySQL = 'mysqli'
}

/**
 * Database class providing a unified interface for different storage engines.
 * Handles query execution, data escaping, and connection lifecycle.
 */
export class DB {
    /**
     * The active database driver instance.
     * @private
     */
    private driver: IDBDriver;

    /**
     * Initializes the database connection using the specified driver.
     * @param driver - One of the supported DBDriverName values.
     * @param config - Connection configuration object (host, user, pass, etc.).
     * @throws Error if the driver fails to initialize or is not supported.
     */
    constructor(driver: DBDriverName, config: any) {
        try {
            switch (driver) {
                case DBDriverName.MySQL:
                    this.driver = new MySQLi(config);
                    break;
                default:
                    const errorMsg = `Database driver '${driver}' is not supported.`;
                    logger.error(errorMsg, "DB_INIT", "error");
                    throw new Error(errorMsg);
            }
        } catch (err: any) {
            logger.error(`Database connection failed: ${err.message}`, "DB_CONNECTION", "error");
            throw err;
        }
    }

    /**
     * Executes a raw SQL query through the active driver.
     * Logs the query on failure to the sql_error log.
     * @param sql - The SQL statement to execute.
     * @returns Promise resolving to the driver-specific result object.
     */
    public async query(sql: string): Promise<IDBResult> {
        try {
            return await this.driver.query(sql);
        } catch (err: any) {
            // Log the specific SQL error and the query that caused it for debugging
            logger.error(`SQL Error: ${err.message} | Query: ${sql}`, "DB_QUERY", "sql_error");
            throw err;
        }
    }

    /**
     * Escapes a string value to prevent SQL injection attacks.
     * @param value - The raw string to escape.
     * @returns The sanitized string.
     */
    public escape(value: string): string {
        return this.driver.escape(value);
    }

    /**
     * Retrieves the auto-generated ID from the last INSERT operation.
     * @returns The last insertion ID as a number.
     */
    public getLastId(): number {
        return this.driver.getLastId();
    }
}