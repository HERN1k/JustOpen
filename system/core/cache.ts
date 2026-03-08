// Developed by Hirnyk Vlad (HERN1k)

import { FileCache } from "../lib/cache/file";
import { MemoryCache } from "../lib/cache/memory";
import { logger } from "./logger"; 
import type { ICacheDriver } from "./types";

/**
 * List of available cache storage strategies.
 */
export enum CacheDriverName {
    memory = 'memory',
    file = 'file'
}

/**
 * Core Cache Wrapper.
 * Acts as an abstraction layer to interact with different cache drivers
 * providing a unified asynchronous API for the application.
 */
export class Cache {
    /**
     * The active cache driver instance.
     * @private
     */
    private driver: ICacheDriver;

    /**
     * Initializes the cache system with a selected driver.
     * @param driverName - The name of the driver to use (from CacheDriverName enum).
     * @param expire - Default expiration time in seconds.
     * @throws Error if the driver name is not recognized.
     */
    constructor(driverName: string, expire: number = 3600) {
        switch (driverName) {
            case CacheDriverName.memory:
                this.driver = new MemoryCache(expire);
                break;
            case CacheDriverName.file:
                this.driver = new FileCache(expire);
                break;
            default:
                const errorMsg = `Could not load cache driver: ${driverName}`;
                logger.error(errorMsg, "CACHE_INIT", "error");
                throw new Error(errorMsg);
        }
    }

    /**
     * Saves data to the cache storage.
     * @param key - Unique identifier for the cache entry.
     * @param value - Data to be stored (objects, strings, numbers, etc.).
     * @returns Promise resolving to true on success, false otherwise.
     */
    public async set(key: string, value: any): Promise<boolean> {
        try {
            return await this.driver.set(key, value);
        } catch (err: any) {
            logger.error(`Failed to set cache [${key}]: ${err.message}`, "CACHE_WRITE", "cache_error");
            return false;
        }
    }

    /**
     * Fetches data from the cache.
     * @param key - Unique identifier for the cache entry.
     * @returns Promise resolving to the stored value, or null if not found.
     */
    public async get<T>(key: string): Promise<T | null> {
        try {
            const result = await this.driver.get<T>(key);
            if (!result) {
                // Optional: log cache misses if needed for debugging
                // logger.info(`Cache miss: ${key}`, "CACHE_READ");
            }
            return result ?? null;
        } catch (err: any) {
            logger.error(`Failed to read cache [${key}]: ${err.message}`, "CACHE_READ", "cache_error");
            return null;
        }
    }

    /**
     * Gets all cached data from the current driver.
     * Useful for debugging or cache management tools.
     * @returns Promise resolving to an array containing cached items.
     */
    public async getAll(): Promise<Record<string, any>[]> {
        try {
            const result = await this.driver.getAll();
            return result ?? [];
        } catch (err: any) {
            logger.error(`Failed to retrieve all cache data: ${err.message}`, "CACHE_READ", "cache_error");
            return [];
        }
    }

    /**
     * Deletes a specific item from the cache.
     * @param key - Unique identifier to be removed.
     * @returns Promise resolving to true if deleted, false if key didn't exist.
     */
    public async remove(key: string): Promise<boolean> {
        try {
            return await this.driver.remove(key);
        } catch (err: any) {
            logger.error(`Failed to remove cache [${key}]: ${err.message}`, "CACHE_DELETE", "cache_error");
            return false;
        }
    }

    /**
     * Completely wipes the cache storage.
     * Use with caution.
     * @returns Promise resolving to true on successful clearance.
     */
    public async clear(): Promise<boolean> {
        try {
            const result = await this.driver.clear();
            logger.warn(`Cache storage cleared successfully`, "CACHE_MGMT");
            return result;
        } catch (err: any) {
            logger.error(`Failed to clear cache: ${err.message}`, "CACHE_MGMT", "cache_error");
            return false;
        }
    }

    /**
     * DANGER: Calls a driver-specific method by its name.
     * This allows access to unique features like 'removeByPattern' in FileCache.
     * @param methodName - The name of the method to execute.
     * @param args - Arguments to pass to the method.
     * @returns The result of the method call.
     * @throws Error if the method does not exist on the current driver.
     */
    public async callCustomMethod(methodName: string, ...args: any[]): Promise<any> {
        if (typeof (this.driver as any)[methodName] === 'function') {
            try {
                return await (this.driver as any)[methodName](...args);
            } catch (err: any) {
                logger.error(`Custom method execution failed [${methodName}]: ${err.message}`, "CACHE_CUSTOM", "cache_error");
                throw err;
            }
        }

        const msg = `[Cache] Method '${methodName}' is not supported by the current driver.`;
        logger.error(msg, "CACHE_CUSTOM", "error");
        throw new Error(msg);
    }
}