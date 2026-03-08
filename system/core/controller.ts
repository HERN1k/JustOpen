// Developed by Hirnyk Vlad (HERN1k)

import { Registry } from "./registry";
import { Request } from "./request";
import { Response } from "./response";
import { Render } from "../../system/core/render";
import { Logger } from "../../system/core/logger"; 
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
     * Map of child components (other controllers or views) to be injected.
     * @protected
     */
    protected components: Record<string, any> = {};

    /** @protected */
    protected content: string;

    /** @protected */
    protected contentType: string;

    /** @protected */
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

    /** @protected */
    protected get request(): Request {
        return this.registry.get('request');
    }

    /** @protected */
    protected get db() {
        return this.registry.get('db');
    }

    /** @protected */
    protected get render(): Render {
        return this.registry.get('render');
    }

    /** @protected */
    protected get response(): Response {
        return this.registry.get('response');
    }

    /**
     * Access the system logger.
     * @protected
     */
    protected get logger(): Logger {
        return this.registry.get('logger');
    }

    /**
     * Merges new data into the existing page data record.
     * @param data Object containing key-value pairs for the view.
     * @protected
     */
    protected setPageData(data: Record<string, any>): void {
        this.pageData = { ...this.pageData, ...data };
    }

    /**
     * Resolves and adds a CSS path to the page headers.
     * @param path Relative path to the CSS file.
     * @protected
     */
    protected async setStyles(path: string): Promise<void> {
        const layoutName: string = this.registry.get('config').get('theme') || 'theme';
        const parser = this.request.getParserResult();

        // Normalize path to include 'src/'
        if (!path.includes('src')) {
            path = join('src', path);
        }

        const fullPath = parser.isAdmin 
            ? join(ADMIN_DIR_VIEW, layoutName, path)
            : join(DIR_VIEW, layoutName, path);

        if (!this.pageData.css.includes(fullPath)) {
            this.pageData.css.push(fullPath);
        }
    }

    /**
     * Resolves and adds a JS path to the page footer.
     * @param path Relative path to the JS file.
     * @protected
     */
    protected async setScript(path: string): Promise<void> {
        const layoutName: string = this.registry.get('config').get('theme') || 'theme';
        const parser = this.request.getParserResult();

        if (!path.includes('src')) {
            path = join('src', path);
        }

        const fullPath = parser.isAdmin 
            ? join(ADMIN_DIR_VIEW, layoutName, path)
            : join(DIR_VIEW, layoutName, path);

        if (!this.pageData.js.includes(fullPath)) {
            this.pageData.js.push(fullPath);
        }
    }

    /**
     * Loads a view template string.
     * @protected
     */
    protected async loadView(path: string, data: Record<string, any> = {}): Promise<string> {
        return await Load.loadView(this.registry, path, data);
    }

    /**
     * Loads and executes another controller internally (Sub-controller pattern).
     * @protected
     */
    protected async loadController(path: string, data: Record<string, any> = {}): Promise<string> {
        return await Load.loadController(this.registry, path, data);
    }

    /**
     * Configures the final page response using the render engine.
     * @param path View path.
     * @param statusCode HTTP status code. Defaults to 200.
     * @protected
     */
    protected async configurePage(path: string, statusCode: number = 200): Promise<void> {
        try {
            this.render.setPageData(this.pageData);

            const viewContent = await this.loadView(path, this.components);
            const renderedPage = await this.render.getPage(viewContent);
            
            this.rowResponse(renderedPage, "text/html; charset=utf-8", statusCode);
        } catch (error: any) {
            this.logger.error(`Failed to configure page [${path}]: ${error.message}`, "CONTROLLER");
            throw error;
        }
    }

    /**
     * Helper to prepare a JSON response.
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
     */
    public async onEnter(): Promise<void> { }

    /**
     * Lifecycle method called after the action execution.
     * Finalizes and pushes data to the main Response service.
     */
    public async onLeave(): Promise<void> {
        this.response.setOutput(this.content, this.contentType, this.statusCode);
    }
}