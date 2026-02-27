// Developed by Hirnyk Vlad (HERN1k)

import type { Request } from "./request";
import type { Response } from "./response";
import type { DB } from "./db";

export interface RegistryData {
    request: Request;
    response: Response;
    db: DB;
    [key: string]: any;
}

/**
 * Request registry with strict typing
 */
export class Registry {
    private data: Partial<RegistryData> & Record<string, any> = {};

    /**
     * Get a service from registry
     * @param key
     */
    public get<K extends keyof RegistryData>(key: K): RegistryData[K];
    public get<T = any>(key: string): T;
    public get(key: string): any {
        return this.data[key];
    }

    /**
     * Set a service into registry
     */
    public set<K extends keyof RegistryData>(key: K, value: RegistryData[K]): void;
    public set(key: string, value: any): void;
    public set(key: string, value: any): void {
        this.data[key] = value;
    }

    /**
     * Check if service exists
     */
    public has(key: keyof RegistryData | string): boolean {
        return key in this.data;
    }
}