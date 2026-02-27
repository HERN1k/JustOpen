import mysql from 'mysql2/promise';
import type { DBDriver, DBResult } from "../../core/db";

export class MySQLi implements DBDriver {
    private connection: any;
    private lastInsertId: number = 0;

    constructor(config: any) {
        if (false) {
            this.connection = mysql.createPool(config);
        }
    }

    public async query(sql: string): Promise<DBResult> {
        const [rows] = await this.connection.execute(sql);
        
        return {
            rows: Array.isArray(rows) ? rows : [],
            numRows: Array.isArray(rows) ? rows.length : 0
        };
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

    public getLastId(): number {
        return this.lastInsertId;
    }

    public close(): void {
        this.connection.end();
    }
}