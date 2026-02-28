// Developed by Hirnyk Vlad (HERN1k)

import { CUSTOMERS_DIR, DIR_CONTROLLERS, ADMIN_DIR_CONTROLLERS } from "../../config";
import type { Registry } from "./registry";
import { Response } from "./response";
import { join } from "path";
import { existsSync } from "node:fs";
import { StringHelper } from "../helper/string";

/**
 * The Action class is responsible for locating, importing, and executing
 * the appropriate controller based on the parsed URL route.
 */
export class Action {
    /**
     * The shared application registry.
     * @private
     */
    private registry: Registry;

    /**
     * @param registry The registry instance containing system services.
     */
    constructor(registry: Registry) {
        this.registry = registry;
    }

    /**
     * Executes the controller logic based on the current route.
     * If the requested controller or action is not found, it triggers a fallback 'not_found' route.
     * @returns A Promise that resolves to the system Response object.
     */
    async execute(): Promise<Response> {
        const parser = this.registry.get('request').getParserResult();

        // Build the path to the expected controller file
        const baseDir = parser.path === CUSTOMERS_DIR ? DIR_CONTROLLERS : ADMIN_DIR_CONTROLLERS;
        const filePath = join(baseDir, parser.folder, `${parser.file}.ts`);
        
        // Generate class name: e.g., 'product_list' -> 'ProductListController'
        const className = StringHelper.toPascalCase(parser.file) + 'Controller';

        const action = parser.action;

        // Configuration for the Not Found (404) fallback
        const notFoundFilePath = join(baseDir, `error/not_found.ts`);
        const notFoundClassName = 'NotFoundController';
        const notFoundAction = 'index';

        try {
            // Attempt to load and run the requested module
            const isSuccess = await this.loadModule(filePath, className, action);

            if (!isSuccess) {
                await this.loadModule(notFoundFilePath, notFoundClassName, notFoundAction);
            }
        } catch (err: unknown) {
            console.error(`[Action Error]:`, err);
            await this.loadModule(notFoundFilePath, notFoundClassName, notFoundAction);
        }

        return this.registry.get('response');
    }

    /**
     * Dynamically imports the controller file and invokes the specified action.
     * @param filePath Full path to the controller file.
     * @param className Expected class name inside the file.
     * @param action Method name to be executed.
     * @returns True if execution was successful, false otherwise.
     * @private
     */
    private async loadModule(filePath: string, className: string, action: string): Promise<boolean> {
        if (existsSync(filePath)) {
            // Dynamic import (works natively in Bun)
            const module = await import(filePath);
            
            if (module[className]) {
                const controller = new module[className](this.registry);
                
                if (typeof controller[action] === 'function') {
                    await controller[action]();
                    return true;
                }
            }
        }

        return false;
    }
}