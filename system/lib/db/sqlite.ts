import { DB_MIGRATIONS_DIR, IS_DEV } from '../../../config';
import { Database } from "bun:sqlite";
import type { IDBConfig, IDBDriver, IDBResult, MigrationEntity } from "../../core/types";
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { logger } from '../../core/logger';

export class SQLitei implements IDBDriver {
    private connection: Database | null = null;
    private lastInsertId: number | null = null;

    constructor(config: IDBConfig) {
        const dbPath = config.data.dbFilePath as string;
        if (!dbPath) {
            throw new Error("SQLite path is not defined in config");
        }

        this.connection = new Database(dbPath);

        this.connection.exec('PRAGMA journal_mode = WAL;');
        this.connection.exec('PRAGMA synchronous = NORMAL;');
    }

    public async query<T>(sql: string, params: any[] = []): Promise<IDBResult<T>> {
        if (this.connection === null) {
            throw new Error("Database connection error");
        }

        try {
            const stmt = this.connection.prepare<T, any>(sql);
            const isReader = stmt.columnNames.length > 0;

            if (isReader) {
                const rows = stmt.all(...params);

                return {
                    rows: rows,
                    numRows: rows.length
                } as IDBResult<T>;
            } else {
                const info = stmt.run(...params);
                
                this.lastInsertId = Number(info.lastInsertRowid);

                return {
                    rows: [],
                    numRows: info.changes
                } as IDBResult<T>;
            }
        } catch (error) {
            if (IS_DEV) {
                logger.error(`SQL Error: ${sql}.\n\nMessage: ${error}`);
            }

            throw error;
        }
    }

    public escape(value: string): string {
        if (typeof value !== 'string') {
            return value;
        }

        return value.replace(/'/g, "''");
    }

    public getLastId(): number | null {
        return this.lastInsertId;
    }

    public close(): void {
        if (this.connection !== null) {
            this.connection.close();
            this.connection = null;
        }
    }

    public async applyMigration(): Promise<void> {
        if (this.connection === null) {
            throw new Error("Database connection error");
        }

        try {
            this.connection.exec(`
                CREATE TABLE IF NOT EXISTS _migrations (
                    id INTEGER PRIMARY KEY,
                    name TEXT NOT NULL,
                    applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);

            const applied = this.connection.prepare<MigrationEntity, any>('SELECT * FROM _migrations').all();
            const appliedNames = new Set(applied.map(m => m.name));

            const filesToProcess = readdirSync(DB_MIGRATIONS_DIR)
                .map(name => ({ name, path: join(DB_MIGRATIONS_DIR, name) }))
                .filter(f => statSync(f.path).isFile() && !appliedNames.has(f.name))
                .sort((a, b) => statSync(a.path).birthtimeMs - statSync(b.path).birthtimeMs);

            if (filesToProcess.length === 0) {
                return;
            }

            const runTransaction = this.connection.transaction((todo) => {
                for (const m of todo) {
                    this.connection!.exec(m.sql);
                    this.connection!.prepare('INSERT INTO _migrations (name) VALUES (?)').run(m.name);
                }
                return todo.length;
            });

            const migrationsToRun = [];
            for (const f of filesToProcess) {
                const content = await Bun.file(f.path).text();
                migrationsToRun.push({ name: f.name, sql: content });
            }

            const count = runTransaction(migrationsToRun);
            logger.info(`Successfully applied ${count} migrations`);
        } catch (error) {
            logger.error(`Migration error: ${error}`);
            throw error;
        }
    }
}