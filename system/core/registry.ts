// Developed by Hirnyk Vlad (HERN1k)

import type { IRegistryData } from "./types";

/**
 * Request registry with strict typing
 */
export class Registry {
    private data: Partial<IRegistryData> & Record<string, any> = {};

    /**
     * Get a service from registry
     * @param key
     */
    public get<K extends keyof IRegistryData>(key: K): IRegistryData[K];
    public get<T = any>(key: string): T;
    public get(key: string): any {
        return this.data[key];
    }

    /**
     * Set a service into registry
     */
    public set<K extends keyof IRegistryData>(key: K, value: IRegistryData[K]): void;
    public set(key: string, value: any): void;
    public set(key: string, value: any): void {
        this.data[key] = value;
    }

    /**
     * Check if service exists
     */
    public has(key: keyof IRegistryData | string): boolean {
        return key in this.data;
    }
}