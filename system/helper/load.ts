import type { ComponentType } from "react";
import { StringHelper } from "./string";
import { join } from "node:path";
import { existsSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { Registry } from "../core/registry";
import { ROOT_DIR } from "../../config";

export class Load {
    /**
     * Dynamically imports a React component type from a file without rendering it.
     * * @description
     * Returns the component definition (function or class) instead of the rendered element.
     * Useful for passing to rendering engines or storing in component registries.
     * * @param {Registry} registry - Application DI.
     * @param {string} path - Path to the .tsx/.jsx file.
     * @returns {Promise<ComponentType<any> | null>} The component type or null if not found.
     * * @protected
     */
    public static async loadView(registry: Registry, path: string, data: Map<string, any>): Promise<string> {
        if (StringHelper.isNullOrWhiteSpace(path)) {
            return '';
        }

        const request = registry.get('request');
        const render = registry.get('render');
        const parser = request.getParserResult();

        const paths = this.parsePath(path, parser.path, request.layout);

        try {
            const fileUrl = pathToFileURL(paths.fullFilePath).href;
            
            const module = await import(fileUrl);
            if (typeof module[paths.action] === 'function') {
                return await render.build(module[paths.action] as ComponentType<any>, data);
            } else if (typeof module['default'] === 'function') {
                return await render.build(module['default'] as ComponentType<any>, data);
            }
            
            console.error(`[ViewLoader] Export "${paths.action}" is not a function in ${paths.fullFilePath}`);
        } catch (error) {
            console.error(`[ViewLoader] Critical error loading ${paths.fullFilePath}:`, error);
        }

        return '';
    }

    public static async loadController(registry: Registry, path: string, data: Map<string, string>): Promise<string> {
        if (StringHelper.isNullOrWhiteSpace(path)) {
            return '';
        }

        const request = registry.get('request');
        const parser = request.getParserResult();

        const paths = await this.parseControllerPath(path, parser.path);

        try {
            const fileUrl = pathToFileURL(paths.fullFilePath).href;
            
            const module = await import(fileUrl);

            if (module[paths.className]) {
                const controller = new module[paths.className](registry);

                if (typeof controller[paths.action] === 'function' && 
                    typeof controller['onEnter'] === 'function' &&
                    typeof controller['onLeave'] === 'function'
                ) {
                    await controller['onEnter']();
                    return await controller[paths.action](data);
                }
            }
            
            console.error(`[ViewLoader] Export "${paths.action}" is not a function in ${paths.fullFilePath}`);
        } catch (error) {
            console.error(`[ViewLoader] Critical error loading ${paths.fullFilePath}:`, error);
        }

        return '';
    }

    /**
     * Extracts file path and action name from a single string.
     * Example: 'common/header' -> { filePath: 'common', action: 'header' }
     */
    private static parsePath(fullPath: string, catalogPath: string, layout: string): { fullFilePath: string, filePath: string, action: string } {
        const parts = fullPath.split('/');
        
        let action = 'index';
        let filePath = fullPath;

        const fullFilePath = join(ROOT_DIR, catalogPath, 'view', layout, filePath + '.tsx');

        if (!existsSync(fullFilePath)) {
            if (parts.length > 1) {
                action = parts.pop() || 'index';
                filePath = parts.join('/');
            }
        }

        return { fullFilePath, filePath, action };
    }

    private static async parseControllerPath(fullPath: string, catalogPath: string): Promise<{ fullFilePath: string, filePath: string, className: string, action: string }> {
        const parts = fullPath.split('/');

        let action = 'index';
        let filePath = fullPath;
        let fileName = parts[parts.length - 1]!;

        const fullFilePath = join(ROOT_DIR, catalogPath, 'controller', filePath + '.ts');

        if (!existsSync(fullFilePath)) {
            if (parts.length > 1) {
                action = parts.pop() || 'index';
                filePath = parts.join('/');
                fileName = parts[parts.length - 1]!;
            }
        }

        const className = StringHelper.toPascalCase(fileName) + 'Controller';

        return { fullFilePath, filePath, className, action };
    }
}