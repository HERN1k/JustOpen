// Developed by Hirnyk Vlad (HERN1k)

import type { ICacheDriver, CacheItem } from "../../core/types";
import { StringHelper } from "../../helper/string";
import { DateTimeHelper } from "../../helper/dateTime";
import { join } from "node:path";
import { mkdir, writeFile, readFile, unlink, readdir, rm } from "node:fs/promises";

/**
 * FileCache Driver Implementation.
 * Uses the filesystem to persist data, optimized for long-term storage and SuperCache (HTML fragments).
 */
export class FileCache implements ICacheDriver {
    /** Default expiration time in seconds */
    private expire: number;
    /** Absolute or relative path to the cache directory */
    private cacheDir: string;
    /** Promise-based locks to prevent race conditions during file I/O */
    private static locks: Map<string, Promise<void>> = new Map();

    /**
     * @param expire - Default expiration time in seconds.
     * @param cacheDir - Directory path where cache files will be stored.
     */
    constructor(expire: number, cacheDir: string = "./storage/cache") {
        this.expire = expire > 0 ? expire : 3600;
        this.cacheDir = cacheDir;
        
        // Ensure the cache storage directory exists on initialization
        mkdir(this.cacheDir, { recursive: true }).catch(() => {});
    }

    /**
     * Generates a safe file path for a given cache key.
     * Sanitizes the key to prevent directory traversal and illegal filename characters.
     * @param key - The original cache key.
     * @returns A sanitized absolute or relative file path.
     * @private
     */
    private getFilePath(key: string): string {
        const safeKey = key.replace(/[^a-z0-9]/gi, '_').toLowerCase();

        return join(this.cacheDir, `cache.${safeKey}.json`);
    }

    /**
     * Persists data to a file.
     * @param key - Unique cache identifier.
     * @param value - Data to be stored (must be JSON serializable).
     * @returns Promise resolving to true on success, false otherwise.
     */
    public async set<T>(key: string, value: T): Promise<boolean> {
        if (StringHelper.isNullOrWhiteSpace(key)) {
            return false;
        }

        const filePath = this.getFilePath(key);
        const content: CacheItem<T> = {
            value: value,
            tte: DateTimeHelper.getUnixNow() + this.expire
        };

        return await FileCache.executeWithLock(key, async () => {
            try {
                await writeFile(filePath, JSON.stringify(content), 'utf-8');

                return true;
            } catch {
                return false;
            }
        });
    }

    /**
     * Retrieves data from a cache file.
     * Checks for expiration before returning. If expired, the file is deleted.
     * @param key - Unique cache identifier.
     * @returns Promise resolving to the stored value, or null if expired, missing, or corrupted.
     */
    public async get<T>(key: string): Promise<T | null | undefined> {
        if (StringHelper.isNullOrWhiteSpace(key)) {
            return null;
        }

        const filePath = this.getFilePath(key);

        try {
            const data = await readFile(filePath, 'utf-8');
            const item: CacheItem<T> = JSON.parse(data);

            if (item.tte < DateTimeHelper.getUnixNow()) {
                await this.remove(key);

                return null;
            }

            return item.value;
        } catch {
            return null;
        }
    }

    /**
     * Iterates through the cache directory and retrieves all valid (non-expired) entries.
     * @returns Promise resolving to an array of objects containing keys and values.
     */
    public async getAll(): Promise<Record<string, any>[]> {
        const result: Record<string, any>[] = [];

        try {
            const files = await readdir(this.cacheDir);

            for (const file of files) {
                if (file.startsWith('cache.') && file.endsWith('.json')) {
                    const key = file.replace('cache.', '').replace('.json', '');

                    const value = await this.get(key);

                    if (value !== null) {
                        result.push({ key, value });
                    }
                }
            }
        } catch {}

        return result;
    }

    /**
     * Deletes a specific cache file by its key.
     * @param key - Unique cache identifier.
     * @returns Promise resolving to true if deleted or not found, false on filesystem error.
     */
    public async remove(key: string): Promise<boolean> {
        const filePath = this.getFilePath(key);

        return await FileCache.executeWithLock(key, async () => {
            try {
                await unlink(filePath);

                return true;
            } catch {
                return false;
            }
        });
    }

    /**
     * Completely wipes the cache directory and recreates it.
     * Use with caution as this deletes all stored files in the cacheDir.
     * @returns Promise resolving to true on success.
     */
    public async clear(): Promise<boolean> {
        try {
            await rm(this.cacheDir, { recursive: true, force: true });

            await mkdir(this.cacheDir, { recursive: true });

            return true;
        } catch {
            return false;
        }
    }

    /**
     * Handles atomic execution for file operations on a per-key basis.
     * Prevents multiple asynchronous calls from reading/writing the same file simultaneously.
     * @param key - The key identifying the resource to lock.
     * @param fn - The asynchronous function to execute within the lock.
     * @private
     */
    private static async executeWithLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
        const lockPromise = (FileCache.locks.get(key) || Promise.resolve()).then(async () => {
            try {
                return await fn();
            } finally {
                if (FileCache.locks.get(key) === lockPromise) {
                    FileCache.locks.delete(key);
                }
            }
        });

        FileCache.locks.set(key, lockPromise.then(() => {}));

        return lockPromise;
    }

    /**
     * Removes multiple cache entries that match a specific prefix pattern.
     * Highly effective for invalidating groups of data (e.g., "product_101_*").
     * @param pattern - The prefix or pattern used to identify a group of keys.
     * @returns Promise resolving to true if the operation finished without critical errors.
     */
    public async removeByPattern(pattern: string): Promise<boolean> {
        if (StringHelper.isNullOrWhiteSpace(pattern)) {
            return false;
        }

        try {
            const files = await readdir(this.cacheDir);
            const safePattern = pattern.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            
            const targets = files.filter(file => 
                file.startsWith(`cache.${safePattern}`) && file.endsWith('.json')
            );

            const deletions = targets.map(async (file) => {
                const key = file.replace('cache.', '').replace('.json', '');
                return await this.remove(key);
            });

            await Promise.all(deletions);

            return true;
        } catch (error) {
            return false;
        }
    }
}