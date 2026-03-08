// Developed by Hirnyk Vlad (HERN1k)

import { CUSTOMERS_DIR, DIR_CONTROLLERS, ADMIN_DIR_CONTROLLERS } from "../../config";
import { Response } from "./response";
import { join } from "path";
import { existsSync } from "node:fs";
import { StringHelper } from "../helper/string";
import type { Registry } from "./registry";

/**
 * The Action class handles the dynamic discovery, instantiation, 
 * and execution of controllers based on the routing parameters.
 */
export class Action {
    /**
     * Shared application registry instance.
     * @private
     */
    private registry: Registry;

    /**
     * @param registry - The registry containing core services like Logger and Request.
     */
    constructor(registry: Registry) {
        this.registry = registry;
    }

    /**
     * Executes the controller logic based on the current route.
     * Falls back to a 404 controller if the target is missing or invalid.
     * @returns A Promise resolving to the final Response object.
     */
    async execute(): Promise<Response> {
        const logger = this.registry.get('logger');
        const parser = this.registry.get('request').getParserResult();

        // Determine the base directory (Admin vs Customer)
        const baseDir = parser.path === CUSTOMERS_DIR ? DIR_CONTROLLERS : ADMIN_DIR_CONTROLLERS;
        const filePath = join(baseDir, parser.folder, `${parser.file}.ts`);
        
        // Convert file name to class name: e.g., 'user_profile' -> 'UserProfileController'
        const className = StringHelper.toPascalCase(parser.file) + 'Controller';
        const action = parser.action;

        // Fallback configuration
        const notFoundFilePath = join(baseDir, `error/not_found.ts`);
        const notFoundClassName = 'NotFoundController';
        const notFoundAction = 'index';

        try {
            const isSuccess = await this.loadModule(filePath, className, action);

            if (!isSuccess) {
                logger.warn(`Route not found: ${parser.folder}/${parser.file} -> ${action}`, "ROUTER", "routing");
                await this.loadModule(notFoundFilePath, notFoundClassName, notFoundAction);
            }
        } catch (err: any) {
            logger.error(`Execution failed: ${err.message}`, "ACTION_EXEC", "error");
            await this.loadModule(notFoundFilePath, notFoundClassName, notFoundAction);
        }

        return this.registry.get('response');
    }

    /**
     * Dynamically imports a controller file and invokes its lifecycle methods.
     * Lifecycle: onEnter -> [Action] -> onLeave.
     * * @param filePath - Physical path to the .ts controller file.
     * @param className - The expected class name to instantiate.
     * @param action - The method name to execute within the controller.
     * @returns True if the module was loaded and executed, false otherwise.
     * @private
     */
    private async loadModule(filePath: string, className: string, action: string): Promise<boolean> {
        const logger = this.registry.get('logger');

        if (existsSync(filePath)) {
            try {
                const module = await import(filePath);
                
                if (module[className]) {
                    const controller = new module[className](this.registry);
                    
                    // Check if the method and mandatory lifecycle hooks exist
                    if (typeof controller[action] === 'function' && 
                        typeof controller['onEnter'] === 'function' &&
                        typeof controller['onLeave'] === 'function'
                    ) {
                        await controller['onEnter']();
                        await controller[action](new Map());
                        await controller['onLeave']();

                        return true;
                    } else {
                        logger.error(`Method ${action} or hooks missing in ${className}`, "MODULE_LOADER", "error");
                    }
                } else {
                    logger.error(`Class ${className} not found in ${filePath}`, "MODULE_LOADER", "error");
                }
            } catch (err: any) {
                logger.error(`Import failed for ${filePath}: ${err.message}`, "DYNAMIC_IMPORT", "error");
            }
        }

        return false;
    }
}