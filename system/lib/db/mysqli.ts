import mysql from 'mysql2/promise';
import type { IDBConfig, IDBDriver, IDBResult } from "../../core/types";
import type { Logger } from '../../core/logger';

export class MySQLi implements IDBDriver {
    private connection: mysql.Pool | null = null;
    private lastInsertId: number | null = null;

    constructor(config: IDBConfig) {
        this.connection = mysql.createPool(config.data);
    }

    public async query<T>(sql: string, params: any[] = []): Promise<IDBResult<T>> {
        if (this.connection === null) {
            throw new Error("Database connection error");
        }

        const [rows] = await this.connection.execute(sql);
        
        return {
            rows: Array.isArray(rows) ? rows : [],
            numRows: Array.isArray(rows) ? rows.length : 0
        } as IDBResult<T>;
    }

    public escape(value: string): string {
        return value.replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, (char) => {
            switch (char) {
                case "\0": return "\\0";
                case "\x08": return "\\b";
                case "\x09": return "\\t";
                case "\x1a": return "\\z";
                case "\n": return "\\n";
                case "\r": return "\\r";
                case "\"":
                case "'":
                case "\\":
                case "%":
                    return "\\" + char;
                default:
                    return char;
            }
        });
    }

    public getLastId(): number | null {
        return this.lastInsertId;
    }

    public close(): void {
        if (this.connection !== null) {
            this.connection.end();
            this.connection = null;
        }
    }

    public async applyMigration(): Promise<void> {
        return;
    }
}