// Developed by Hirnyk Vlad (HERN1k)

import { BASE_URL } from "../../config";
import { StringHelper } from "../helper/string";
import type { IRewriter } from "./types";

/**
 * URL Management System.
 * Responsible for generating internal application links and applying SEO rewrites.
 */
export class InternalURL {
    private rewriters: Array<IRewriter> = [];

    /**
     * Registers a rewriter (e.g., SEO URL Manager) to the transformation pipeline.
     * @param rewriter - An object implementing the IRewriter interface.
     */
    public addRewrite(rewriter: IRewriter): void {
        this.rewriters.push(rewriter);
    }

    /**
     * Generates a link using a string of arguments.
     * @param route - The system route (e.g., 'product/product').
     * @param args - Query parameters as a string (e.g., 'product_id=42&category_id=10').
     * @param hash - URL fragment (e.g., '#tab-review').
     */
    public link(route: string, args?: string, hash?: string): string;

    /**
     * Generates a link using a Map of arguments.
     * @param route - The system route (e.g., 'product/product').
     * @param args - Query parameters as a Map key-value store.
     * @param hash - URL fragment (e.g., '#tab-review').
     */
    public link(route: string, args?: Map<string, string>, hash?: string): string;

    /**
     * Unified implementation of the link method.
     */
    public link(route: string, args: any = '', hash: string = ''): string {
        let argsMap: Map<string, string>;

        if (args instanceof Map) {
            argsMap = args;
        } else if (typeof args === 'string' && !StringHelper.isNullOrEmpty(args)) {
            argsMap = new Map();

            StringHelper.trimByChar(args, '&').split('&').forEach((argKvp) => {
                const parts = argKvp.split('=');
                if (parts.length === 2 && !StringHelper.isNullOrEmpty(parts[0]) && !StringHelper.isNullOrEmpty(parts[1])) {
                    const key = StringHelper.trimByChar(parts[0], '&');
                    const value = StringHelper.trimByChar(parts[1], '&');
                    
                    if (!StringHelper.isNullOrEmpty(key) && !StringHelper.isNullOrEmpty(value)) {
                        argsMap.set(key, value);
                    }
                }
            });
        } else {
            argsMap = new Map();
        }

        let url = BASE_URL + 'index.ts?route=' + route;

        for (const [key, value] of argsMap) {
            url += '&' + StringHelper.trimByChar(key, '&') + '=' + StringHelper.trimByChar(value, '&');
        }

        for (const rewriter of this.rewriters) {
            url = rewriter.rewrite(url);
        }

        if (!StringHelper.isNullOrEmpty(hash)) {
            url += (hash.startsWith('#') ? hash : '#' + hash);
        }

        return url;
    }
}