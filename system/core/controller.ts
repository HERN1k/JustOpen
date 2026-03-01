// Developed by Hirnyk Vlad (HERN1k)

import { Registry } from "./registry";
import { Request } from "./request";
import { Response } from "./response";
import { Render } from "../../system/core/render";
import { Load } from "../helper/load";

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
    protected pageData: Record<string, any>;
    protected components: Map<string, string>;
    protected content: string;
    protected contentType: string;

    /**
     * Initializes the controller with the system registry.
     * @param registry The shared application registry.
     */
    constructor(registry: Registry) {
        this.registry = registry;
        this.pageData= {};
        this.components = new Map();
        this.content = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Clear Template</title>
            </head>
            <body>
            </body>
            </html>
        `;
        this.contentType = 'text/html;';
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
     * Set data for this specific request.
     */
    protected setPageData(data: Record<string, any>): void {
        this.pageData = { ...this.pageData, ...data };
    }

    /**
     * Dynamically imports a React component type from a file without rendering it.
     * * @description
     * Returns the component definition (function or class) instead of the rendered element.
     * Useful for passing to rendering engines or storing in component registries.
     * * @param {string} path - Path to the .tsx/.jsx file.
     * @returns {Promise<ComponentType<any> | null>} The component type or null if not found.
     * * @protected
     */
    protected async loadView(path: string, data: Map<string, string> = new Map()): Promise<string> {
        return await Load.loadView(this.registry, path, data);
    }

    protected async loadController(path: string, data: Map<string, string> = new Map()): Promise<string> {
        return await Load.loadController(this.registry, path, data);
    }

    protected async configureContent(path: string): Promise<string>  {
        return await Load.loadView(this.registry, path, this.components);
    }

    protected async configurePage(path: string): Promise<void> {
        this.contentType = 'text/html;';
        this.content = await this.render.getPage(await this.loadView(path, this.components));
        console.log('configurePage: ', { content: this.content, contentType: this.contentType });
    }

    public async onEnter(): Promise<void> {
        
    }

    public async onLeave(): Promise<void> {
        this.response.setOutput(this.content); 
        this.response.contentType = this.contentType;
    }
}
