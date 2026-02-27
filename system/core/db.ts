// Developed by Hirnyk Vlad (HERN1k)

import { MySQLi } from "../lib/db/mysqli";

/**
 * Interface for all database drivers.
 */
export interface DBDriver {
    query(sql: string): Promise<DBResult>;
    escape(value: string): string;
    getLastId(): number;
    close(): void;
}

/**
 * Standard database result format.
 */
export interface DBResult {
    rows: any[];
    numRows: number;
}

/**
 * Available database drivers supported by the engine.
 */
export enum DBDriverName {
    MySQL = 'mysqli'
}

/**
 * Database class providing a unified interface for different storage engines.
 */
export class DB {
    private driver: DBDriver;

    /**
     * @param driverName One of the supported DBDriverName values
     * @param config Connection configuration object
     */
    constructor(driverName: string, config: any) {
        switch (driverName) {
            case DBDriverName.MySQL:
                this.driver = new MySQLi(config);
                break;
            default:
                throw new Error(`Error: Could not load database driver: ${driverName}!`);
        }
    }

    /**
     * Executes a SQL query.
     */
    public async query(sql: string): Promise<DBResult> {
        return await this.driver.query(sql);
    }

    /**
     * Escapes a string to prevent SQL injection.
     */
    public escape(value: string): string {
        return this.driver.escape(value);
    }

    /**
     * Gets the ID of the last inserted row.
     */
    public getLastId(): number {
        return this.driver.getLastId();
    }
}