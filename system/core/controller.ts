// Developed by Hirnyk Vlad (HERN1k)

import { Registry } from "./registry";
import { Request } from "./request";
import { Response } from "./response";

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
     * Gets the Response object to manage output buffer and headers.
     * @protected
     */
    protected get response(): Response {
        return this.registry.get('response');
    }
}