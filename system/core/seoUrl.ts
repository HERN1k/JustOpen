// Developed by Hirnyk Vlad (HERN1k)

import { BASE_URL, DB_PREFIX } from "../../config";
import { Registry } from "./registry";
import type { DB } from "./db";
import type { IRewriter, IDBResult } from "./types";
import { StringHelper } from "../helper/string";

/**
 * SEO URL Rewriter Service
 * Implements IRewriter to transform system routes into SEO-friendly aliases.
 */
export class SeoUrl implements IRewriter {
    private db: DB;
    private cache: Map<string, string> = new Map();

    constructor(registry: Registry) {
        this.db = registry.get('db');
    }

    public removeCacheEntry(key: string): boolean {
        if (!StringHelper.isNullOrEmpty(key) && this.cache.has(key)) {
            this.cache.delete(key);
            return true;
        }

        return false;
    }

    public clearCache(): boolean {
        this.cache.clear();
        return true;
    }

    /**
     * The main rewrite logic
     * Transforms index.php?route=product/product&product_id=42 -> /iphone-15
     */
    public rewrite(url: string): string {
        if (StringHelper.isNullOrEmpty(url)) {
            return BASE_URL;
        }

        const urlObj = new URL(url, BASE_URL);

        if (this.cache.has(urlObj.href)) {
            return this.cache.get(urlObj.href) ?? urlObj.href;
        }

        const route = urlObj.searchParams.get('route');

        if (!route) {
            return url;
        }

        if (route === 'common/home') {
            if (route.length === 'common/home'.length) {
                return `/`;
            }
        }

        if (route === 'product/product') {
            const productId = urlObj.searchParams.get('product_id');
            if (productId) {
                const alias = 'iphone-17-pro-2tb-orange'// Get alias from db
                if (alias) {
                    return `/${alias}`;
                }
            }
        }

        this.cache.set(urlObj.href, url);

        return url;
    }

    /**
     * Decodes an SEO alias back into a system route.
     * @param pathname - The URL path (e.g., '/iphone-15')
     * @returns Object with route and params if found, otherwise null.
     */
    public async decode(pathname: string): Promise<{ route: string; params: Record<string, string> } | null> {
        const alias = pathname.replace(/^\//, '');
        if (!alias || alias === 'index.ts') return null;

        const query = '/index.php?route=product/product&product_id=42'; 

        if (query) {
            const params: Record<string, string> = {};
            const parts = query.split('&');
            let route = '';

            parts.forEach(part => {
                const [key, value] = part.split('=');

                if (key === 'route' && !StringHelper.isNullOrEmpty(value)) {
                    route = value;
                } else if (!StringHelper.isNullOrEmpty(key) && !StringHelper.isNullOrEmpty(value)) {
                    params[key] = value;
                }
            });

            if (!route) {
                if (query.includes('product_id')) route = 'product/product';
                if (query.includes('category_id')) route = 'product/category';
            }

            return { route, params };
        }

        return null;
    }
}