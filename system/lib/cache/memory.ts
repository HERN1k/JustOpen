// Developed by Hirnyk Vlad (HERN1k)

import type { ICacheDriver, CacheItem } from "../../core/types";
import { StringHelper } from "../../helper/string";
import { DateTimeHelper } from "../../helper/dateTime";

/**
 * MemoryCache Driver Implementation.
 * Provides an in-memory storage using Map with asynchronous locking and background cleanup.
 */
export class MemoryCache implements ICacheDriver {
    private expire: number;
    private static locks: Map<string, Promise<void>> = new Map();
    private static data: Map<string, CacheItem<any>> = new Map();
    private static cleanupInterval: ReturnType<typeof setInterval> | null = null;

    /**
     * @param expire - Default expiration time in seconds.
     */
    constructor(expire: number) {
        this.expire = expire > 0 ? expire : 3600;
        
        MemoryCache.startCleanupInterval();
    }

    /**
     * Starts a global interval to remove expired keys every minute.
     * Ensures memory is freed even if keys are not accessed.
     * @private
     */
    private static startCleanupInterval(): void {
        if (this.cleanupInterval) {
            return;
        }

        this.cleanupInterval = setInterval(async () => {
            const now = DateTimeHelper.getUnixNow();
            
            for (const [key, item] of this.data) {
                if (item.tte < now) {
                    await this.executeWithLock(key, async () => {
                        this.data.delete(key);
                    });
                }
            }
        }, 60000);

        if (typeof this.cleanupInterval === 'object' && 'unref' in this.cleanupInterval) {
            this.cleanupInterval.unref();
        }
    }

    /**
     * Stores a value in the memory cache.
     * @param key - Unique cache identifier.
     * @param value - Data to store.
     * @returns Promise resolving to true if successful.
     */
    public async set<T>(key: string, value: T): Promise<boolean> {
        if (StringHelper.isNullOrWhiteSpace(key)) {
            return false;
        }

        MemoryCache.data.set(key, {
            value: value,
            tte: DateTimeHelper.getUnixNow() + this.expire
        });

        return true;
    }

    /**
     * Retrieves a value from cache by key.
     * Includes an immediate check for expiration (lazy deletion).
     * @param key - Unique cache identifier.
     * @returns Promise resolving to the value, or null if expired/not found.
     */
    public async get<T>(key: string): Promise<T | null | undefined> {
        if (StringHelper.isNullOrWhiteSpace(key)) {
            return null;
        }

        const item = MemoryCache.data.get(key);

        if (!item) {
            return null;
        }

        if (item.tte < DateTimeHelper.getUnixNow()) {
            await MemoryCache.executeWithLock(key, async () => {
                MemoryCache.data.delete(key);
            });

            return null;
        }

        return item.value;
    }

    /**
     * Returns all currently active cache entries.
     */
    public async getAll(): Promise<Record<string, any>[]> {
        const result: Record<string, any>[] = [];
        const now = DateTimeHelper.getUnixNow();

        for (const [key, item] of MemoryCache.data) {
            if (item.tte >= now) {
                result.push({ 
                    key: key,
                    value: structuredClone(item.value)
                });
            }
        }

        return result;
    }

    /**
     * Removes a specific item from cache.
     */
    public async remove(key: string): Promise<boolean> {
        if (StringHelper.isNullOrWhiteSpace(key)) {
            return false;
        }

        await MemoryCache.executeWithLock(key, async () => {
            MemoryCache.data.delete(key);
        });

        return true;
    }

    /**
     * Wipes all data from storage.
     */
    public async clear(): Promise<boolean> {
        MemoryCache.data.clear();

        return true;
    }

    /**
     * Executes an atomic operation on a cache key using a promise-based lock.
     * @private
     */
    private static async executeWithLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
        const lockPromise = (MemoryCache.locks.get(key) || Promise.resolve()).then(async () => {
            try {
                return await fn();
            } finally {
                if (MemoryCache.locks.get(key) === lockPromise) {
                    MemoryCache.locks.delete(key);
                }
            }
        });

        MemoryCache.locks.set(key, lockPromise.then(() => {}));

        return lockPromise;
    }
}