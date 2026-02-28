// Developed by Hirnyk Vlad (HERN1k)

import { ROOT_DIR } from "../../config";
import { Registry } from "./registry";
import { Request } from "./request";
import { Response } from "./response";
import { StringHelper } from "../helper/string";
import { join, isAbsolute, extname } from "node:path";
import { existsSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { Render } from "../../system/core/render";
import type { ComponentType } from "react";

/**
 * Base Controller class that all application controllers must extend.
 * Provides easy access to the Registry and core system components.
 */
export abstract class Controller {
    /**
     * The system registry container.
     * @protected
     */
    protected registry: Registry;

    /**
     * Initializes the controller with the system registry.
     * @param registry The shared application registry.
     */
    constructor(registry: Registry) {
        this.registry = registry;
    }

    /**
     * Gets the Request object containing GET, POST, Files, and Cookies.
     * @protected
     */
    protected get request(): Request {
        return this.registry.get('request');
    }

    /**
     * Gets the Database connection object.
     * @protected
     */
    protected get db() {
        return this.registry.get('db');
    }

    /**
     * Gets the render object to manage react rendering.
     * @protected
     */
    protected get render(): Render {
        return this.registry.get('render');
    }

    /**
     * Gets the Response object to manage output buffer and headers.
     * @protected
     */
    protected get response(): Response {
        return this.registry.get('response');
    }

    /**
     * Dynamically imports a React component type from a file without rendering it.
     * * @description
     * Returns the component definition (function or class) instead of the rendered element.
     * Useful for passing to rendering engines or storing in component registries.
     * * @param {string} path - Path to the .tsx/.jsx file.
     * @param {string} [action='index'] - Export name (e.g., 'index').
     * @returns {Promise<ComponentType<any> | null>} The component type or null if not found.
     * * @protected
     */
    protected async loadView(path: string, action: string = 'index'): Promise<ComponentType<any> | null> {
        if (StringHelper.isNullOrWhiteSpace(path)) {
            return null;
        }

        const request = this.registry.get('request');
        const parser = request.getParserResult();

        path = `${parser.path}/view/${request.layout}/${path}`;

        let fullPath = isAbsolute(path) ? path : join(ROOT_DIR, path);

        const extensions = ['.tsx', '.jsx', '.ts', '.js'];
        let finalPath = '';

        if (!extensions.includes(extname(fullPath))) {
            for (const ext of extensions) {
                if (existsSync(fullPath + ext)) {
                    finalPath = fullPath + ext;
                    break;
                }
            }
        } else if (existsSync(fullPath)) {
            finalPath = fullPath;
        }

        if (!finalPath) {
            console.error(`[ViewLoader] File not found: ${fullPath} (tried ${extensions.join(',')})`);
            return null;
        }

        try {
            const fileUrl = pathToFileURL(finalPath).href;
            
            const module = await import(fileUrl);
            const component = module[action];

            if (typeof component === 'function') {
                return component as ComponentType<any>;
            }
            
            console.error(`[ViewLoader] Export "${action}" is not a function in ${finalPath}`);
        } catch (error) {
            console.error(`[ViewLoader] Critical error loading ${finalPath}:`, error);
        }

        return null;
    }
}
