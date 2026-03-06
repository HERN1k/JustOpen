// Developed by Hirnyk Vlad (HERN1k)

import { Registry } from "./registry";
import { Request } from "./request";
import { Response } from "./response";
import { Render } from "../../system/core/render";
import { Load } from "../helper/load";
import { DIR_VIEW, ADMIN_DIR_VIEW } from "../../config";
import { join } from 'path';

/**
 * Base Controller class that all application controllers must extend.
 * Provides a unified interface for handling requests, managing state,
 * and preparing responses using the system registry.
 * * @abstract
 */
export abstract class Controller {
    /**
     * The system registry container for dependency injection.
     * @protected
     */
    protected registry: Registry;

    /**
     * Storage for data that will be passed to the view/template.
     * @protected
     */
    protected pageData: Record<string, any> = {
        'css': [],
        'js': []
    };

    /**
     * Map of child components to be injected into the main view.
     * @protected
     */
    protected components: Map<string, string> = new Map();

    /**
     * The raw output buffer content.
     * @protected
     */
    protected content: string;

    /**
     * The MIME type of the response.
     * @protected
     */
    protected contentType: string;

    /**
     * The HTTP status code (e.g., 200, 404).
     * @protected
     */
    protected statusCode: number;

    /**
     * Initializes the controller and synchronizes its initial state with the Response object.
     * @param registry The shared application registry.
     */
    constructor(registry: Registry) {
        const response = registry.get('response');

        this.registry = registry;
        this.content = response.content;
        this.contentType = response.contentType;
        this.statusCode = response.statusCode;
    }

    /**
     * Provides access to the Request object (GET, POST, Cookies, etc.).
     * @protected
     */
    protected get request(): Request {
        return this.registry.get('request');
    }

    /**
     * Provides access to the Database connection.
     * @protected
     */
    protected get db() {
        return this.registry.get('db');
    }

    /**
     * Provides access to the Render engine for React/Template processing.
     * @protected
     */
    protected get render(): Render {
        return this.registry.get('render');
    }

    /**
     * Provides access to the Response object to manage headers and buffer.
     * @protected
     */
    protected get response(): Response {
        return this.registry.get('response');
    }

    /**
     * Merges new data into the existing page data record.
     * @param data Object containing key-value pairs for the view.
     * @protected
     */
    protected setPageData(data: Record<string, any>): void {
        this.pageData = { ...this.pageData, ...data };
    }

    protected async setStyles(path: string): Promise<void> {
        // get layout name from db
        const layoutName: string = 'theme';

        const parser = this.request.getParserResult();

        const index = path.indexOf('src');
        if (index !== -1) {
            path = path.substring(index);
        } else {
            path = 'src/' + path;
        }

        path = parser.isAdmin 
            ? join(ADMIN_DIR_VIEW , layoutName, path)
            : join(DIR_VIEW, layoutName, path);

        if (!this.pageData.css.includes(path)) {
            this.pageData.css.push(path);
        }
    }

    protected async setScript(path: string): Promise<void> {
        // get layout name from db
        const layoutName: string = 'theme';

        const parser = this.request.getParserResult();

        const index = path.indexOf('src');
        if (index !== -1) {
            path = path.substring(index);
        } else {
            path = 'src/' + path;
        }

        path = parser.isAdmin 
            ? join(ADMIN_DIR_VIEW, layoutName, path)
            : join(DIR_VIEW, layoutName, path);

        if (!this.pageData.js.includes(path)) {
            this.pageData.js.push(path);
        }
    }

    /**
     * Loads a view template string.
     * @param path Path to the view file.
     * @param data Optional map of components or data.
     * @returns Promise resolving to the view content string.
     * @protected
     */
    protected async loadView(path: string, data: Map<string, any> = new Map()): Promise<string> {
        return await Load.loadView(this.registry, path, data);
    }

    /**
     * Loads and executes another controller internally.
     * @param path Controller path.
     * @param data Optional initialization data.
     * @returns Promise resolving to the controller output string.
     * @protected
     */
    protected async loadController(path: string, data: Map<string, string> = new Map()): Promise<string> {
        return await Load.loadController(this.registry, path, data);
    }

    /**
     * Prepares content by loading a view with the registered components.
     * @param path Path to the content template.
     * @protected
     */
    protected async configureContent(path: string): Promise<string> {
        return await Load.loadView(this.registry, path, this.components);
    }

    /**
     * Configures the final page response using the render engine.
     * @param path View path.
     * @param statusCode HTTP status code. Defaults to 200.
     * @protected
     */
    protected async configurePage(path: string, statusCode: number = 200): Promise<void> {
        this.render.setPageData(this.pageData);

        const viewContent = await this.loadView(path, this.components);
        const renderedPage = await this.render.getPage(viewContent);
        
        this.rowResponse(renderedPage, "text/html; charset=utf-8", statusCode);
    }

    /**
     * Helper to prepare a JSON response.
     * @param data Data to be stringified.
     * @param statusCode HTTP status code. Defaults to 200.
     * @protected
     */
    protected JSON(data: any = {}, statusCode: number = 200): void {
        this.rowResponse(
            JSON.stringify(data), 
            "application/json; charset=utf-8",
            statusCode
        );
    }

    /**
     * Directly sets the raw response properties.
     * @param response The body content.
     * @param contentType MIME type.
     * @param statusCode HTTP status code.
     * @param statusText Custom status text.
     * @protected
     */
    protected rowResponse(
        response: string = "", 
        contentType = "text/html; charset=utf-8", 
        statusCode: number = 200
    ): void {
        this.statusCode = statusCode;
        this.contentType = contentType;
        this.content = response;
    }

    /**
     * Lifecycle method called before the main action execution.
     * Can be overridden to perform initialization logic.
     */
    public async onEnter(): Promise<void> { }

    /**
     * Lifecycle method called after the action execution.
     * Synchronizes local controller state with the global Response object.
     */
    public async onLeave(): Promise<void> {
        this.response.setOutput(this.content, this.contentType, this.statusCode);
    }
}