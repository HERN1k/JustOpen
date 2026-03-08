// Developed by Hirnyk Vlad (HERN1k)

import { StringHelper } from "./string";
import { join } from "node:path";
import { existsSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { Registry } from "../core/registry";
import { ROOT_DIR } from "../../config";

/**
 * Utility class for dynamically loading Views (Eta templates) 
 * and Controllers at runtime.
 */
export class Load {
    /**
     * Loads and renders an Eta view template.
     * @param registry - Application DI container.
     * @param path - The logical path to the view (e.g., 'common/header').
     * @param data - Data object to pass into the template.
     * @returns Promise resolving to the rendered HTML string.
     */
    public static async loadView(registry: Registry, path: string, data: Record<string, any>): Promise<string> {
        const logger = registry.get('logger');
        
        if (StringHelper.isNullOrWhiteSpace(path)) {
            return '';
        }

        const request = registry.get('request');
        const render = registry.get('render');
        const parser = request.getParserResult();

        const paths = this.parsePath(path, parser.path, request.layout);

        try {
            return await render.build(pathToFileURL(paths.fullFilePath).href, data);
        } catch (error: any) {
            logger.error(`Critical error loading view ${paths.fullFilePath}: ${error.message}`, "VIEW_LOADER", "render_error");
        }

        return '';
    }

    /**
     * Dynamically imports a controller and executes a specific action.
     * Used for sub-requests (e.g., loading a header component that has its own logic).
     * @param registry - Application DI container.
     * @param path - Logical path to the controller.
     * @param data - Arguments to pass to the controller method.
     * @returns Promise resolving to the controller's output string.
     */
    public static async loadController(registry: Registry, path: string, data: Record<string, any>): Promise<string> {
        const logger = registry.get('logger');

        if (StringHelper.isNullOrWhiteSpace(path)) {
            return '';
        }

        const request = registry.get('request');
        const parser = request.getParserResult();

        const paths = await this.parseControllerPath(path, parser.path);

        try {
            const fileUrl = pathToFileURL(paths.fullFilePath).href;
            
            if (!existsSync(paths.fullFilePath)) {
                logger.warn(`Sub-controller file not found: ${paths.fullFilePath}`, "LOAD_CONTROLLER");
                return '';
            }

            const module = await import(fileUrl);

            if (module[paths.className]) {
                const controller = new module[paths.className](registry);

                if (typeof controller[paths.action] === 'function' && 
                    typeof controller['onEnter'] === 'function' &&
                    typeof controller['onLeave'] === 'function'
                ) {
                    await controller['onEnter']();
                    const result = await controller[paths.action](data);
                    await controller['onLeave']();
                    
                    return result;
                } else {
                    logger.error(`Method "${paths.action}" or lifecycle hooks missing in ${paths.className}`, "LOAD_CONTROLLER", "error");
                }
            } else {
                logger.error(`Export "${paths.className}" not found in ${paths.fullFilePath}`, "LOAD_CONTROLLER", "error");
            }
        } catch (error: any) {
            logger.error(`Critical failure loading sub-controller ${paths.fullFilePath}: ${error.message}`, "VIEW_LOADER", "error");
        }

        return '';
    }

    /**
     * Resolves the physical path for a view file.
     * @private
     */
    private static parsePath(fullPath: string, catalogPath: string, layout: string): { fullFilePath: string, filePath: string, action: string } {
        const parts = fullPath.split('/');
        
        let action = 'index';
        let filePath = fullPath;

        let fullFilePath = join(ROOT_DIR, catalogPath, 'view', layout, filePath + '.eta');

        if (!existsSync(fullFilePath)) {
            if (parts.length > 1) {
                action = parts.pop() || 'index';
                filePath = parts.join('/');
                fullFilePath = join(ROOT_DIR, catalogPath, 'view', layout, filePath + '.eta');
            }
        }

        return { fullFilePath, filePath, action };
    }

    /**
     * Resolves the physical path and class name for a controller.
     * @private
     */
    private static async parseControllerPath(fullPath: string, catalogPath: string): Promise<{ fullFilePath: string, filePath: string, className: string, action: string }> {
        const parts = fullPath.split('/');

        let action = 'index';
        let filePath = fullPath;
        let fileName = parts[parts.length - 1]!;

        let fullFilePath = join(ROOT_DIR, catalogPath, 'controller', filePath + '.ts');

        if (!existsSync(fullFilePath)) {
            if (parts.length > 1) {
                action = parts.pop() || 'index';
                filePath = parts.join('/');
                fileName = parts[parts.length - 1]!;
                fullFilePath = join(ROOT_DIR, catalogPath, 'controller', filePath + '.ts');
            }
        }

        const className = StringHelper.toPascalCase(fileName) + 'Controller';

        return { fullFilePath, filePath, className, action };
    }
}