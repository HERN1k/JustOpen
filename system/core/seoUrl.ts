// Developed by Hirnyk Vlad (HERN1k)

import { ADMIN_DIR, BASE_URL, DB_PREFIX } from "../../config";
import { Registry } from "./registry";
import type { DB } from "./db";
import type { IRewriter, IDBResult } from "./types";
import { StringHelper } from "../helper/string";

/**
 * SEO URL Rewriter Service
 * Implements IRewriter to transform system routes into SEO-friendly aliases.
 */
export class SeoUrl implements IRewriter {
    /** * @private 
     * Database connection instance for querying SEO keywords. 
     */
    private db: DB;

    /** * @private 
     * In-memory cache to store processed URL mappings.
     * Prevents redundant database lookups for the same routes during a single request cycle.
     */
    private cache: Map<string, string> = new Map();

    /**
     * @param registry - System registry instance to resolve dependencies.
     */
    constructor(registry: Registry) {
        this.db = registry.get('db');
    }

    /**
     * Removes a specific entry from the SEO cache.
     * Useful when a single URL alias is updated in the database.
     * * @param key - The original system URL or href used as a cache key.
     * @returns `true` if the entry was found and deleted, `false` otherwise.
     */
    public removeCacheEntry(key: string): boolean {
        if (!StringHelper.isNullOrEmpty(key) && this.cache.has(key)) {
            this.cache.delete(key);
            return true;
        }

        return false;
    }

    /**
     * Completely clears the SEO URL cache.
     * Should be called after bulk updates of SEO keywords or configuration changes.
     * * @returns `true` after the cache is successfully emptied.
     */
    public clearCache(): boolean {
        this.cache.clear();
        return true;
    }

    /**
     * The main rewrite logic
     * Handles both catalog and admin paths.
     */
    public rewrite(url: string): string {
        if (StringHelper.isNullOrEmpty(url)) {
            return BASE_URL;
        }

        const urlObj = new URL(url, BASE_URL);

        if (this.cache.has(urlObj.href)) {
            return this.cache.get(urlObj.href)!;
        }

        const route = urlObj.searchParams.get('route');
        if (!route) return url;

        if (route.startsWith('admin/') || urlObj.pathname.includes(`/${ADMIN_DIR}/`)) {
            return url; 
        }

        if (route === 'common/home') {
            return '/';
        }

        let rewritten = url;
        if (route === 'product/product') {
            const productId = urlObj.searchParams.get('product_id');
            if (productId) {
                const alias = this.getAliasByQuery(`product_id=${productId}`); 
                if (alias) {
                    rewritten = `/${alias}`;
                }
            }
        }

        this.cache.set(urlObj.href, rewritten);
        return rewritten;
    }

    /**
     * Decodes an SEO alias or Admin path back into a system route.
     */
    public async decode(pathname: string): Promise<{ route: string; params: Record<string, string> } | null> {
        const cleanPath = pathname.replace(/^\//, '');
        if (!cleanPath || cleanPath === 'index.php') {
            return null;
        }

        if (cleanPath.startsWith(`${ADMIN_DIR}/`) || cleanPath === ADMIN_DIR) {
            const adminRoute = cleanPath.replace(`${ADMIN_DIR}/`, '');
            return {
                route: adminRoute || 'common/dashboard',
                params: { is_admin: 'true' }
            };
        }

        // Example: 'iphone-15' -> product/product & product_id=42
        const systemQuery = this.getQueryByAlias(cleanPath); 

        if (systemQuery) {
            return this.parseQuery(systemQuery);
        }

        return null;
    }

    /**
     * Mock helper to simulate DB lookup for Alias -> Query
     */
    private getQueryByAlias(alias: string): string | null {
        // This should be a DB call
        if (alias === 'iphone-17-pro-2tb-orange') {
            return 'route=product/product&product_id=42';
        }

        return null;
    }

    /**
     * Mock helper to simulate DB lookup for Query -> Alias
     */
    private getAliasByQuery(query: string): string | null {
        // This should be a DB call
        if (query === 'product_id=42') {
            return 'iphone-17-pro-2tb-orange';
        }

        return null;
    }

    /**
     * Parses a query string like 'route=product/product&id=1' into an object
     */
    private parseQuery(query: string): { route: string; params: Record<string, string> } {
        const params: Record<string, string> = {};
        const parts = query.replace('?', '').split('&');
        let route = '';

        parts.forEach(part => {
            const [key, value] = part.split('=');
            if (key === 'route') {
                route = value ?? '';
            } else if (key) {
                params[key] = value ?? '';
            }
        });

        return { route, params };
    }
}