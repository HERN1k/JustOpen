// Developed by Hirnyk Vlad (HERN1k)

import { MySQLi } from "../lib/db/mysqli";
import type { IDBDriver, IDBResult } from "./types";

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
    private driver: IDBDriver;

    /**
     * @param driver One of the supported DBDriverName values
     * @param config Connection configuration object
     */
    constructor(driver: DBDriverName, config: any) {
        switch (driver) {
            case DBDriverName.MySQL:
                this.driver = new MySQLi(config);
                break;
            default:
                throw new Error(`Error: Could not load database driver!`);
        }
    }

    /**
     * Executes a SQL query.
     */
    public async query(sql: string): Promise<IDBResult> {
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