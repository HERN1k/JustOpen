// Developed by Hirnyk Vlad (HERN1k)

import { APP_PORT, BASE_URL, DB_CONFIG, DB_DRIVER } from './config';
import { Action } from './system/core/action';
import { Registry } from './system/core/registry';
import { Request as CustomRequest } from './system/core/request';
import { Response as CustomResponse } from './system/core/response';
import { DB } from './system/core/db';

/**
 * Main Application Class to handle Bun server lifecycle and request processing.
 */
class App {
    constructor() {
        this.startServer();
    }

    /**
     * Starts the Bun server.
     */
    private startServer(): void {
        Bun.serve({
            port: APP_PORT,
            fetch: (req) => this.handleRequest(req),
        });

        console.log(`\n🚀 JustOpen server running at ${BASE_URL}:${APP_PORT}\n`);
    }

    /**
     * Core request handler.
     * @param request - Incoming Bun request.
     */
    private async handleRequest(request: Request): Promise<Response> {
        const { body, files } = await this.parseRequestBody(request);

        const headers: Record<string, string> = {};
        request.headers.forEach((value, key) => {
            headers[key] = value;
        });

        const registry = new Registry();
        
        registry.set('request', new CustomRequest(
            request.url,
            request.method,
            headers,
            body,
            files,
            request.headers.get('cookie') || ''
        ));

        registry.set('response', new CustomResponse());

        registry.set('db', new DB(DB_DRIVER, DB_CONFIG)); 

        const response = await new Action(registry).execute();

        return new Response(response.getOutput(), {
            headers: { "Content-Type": response.contentType }
        });
    }

    /**
     * Extracts and parses the request body and files based on Content-Type.
     * @param request - Bun request object.
     * @private
     */
    private async parseRequestBody(request: Request): Promise<{ body: any; files: any }> {
        if (request.method !== "POST") {
            return { body: null, files: null };
        }

        const contentType = request.headers.get("content-type") || "";
        let body: any = null;
        let files: any = null;

        try {
            if (contentType.includes("application/json")) {
                body = await request.json();
            } 
            else if (contentType.includes("multipart/form-data")) {
                const formData = await request.formData();
                body = {};
                files = {};

                formData.forEach((value, key) => {
                    if (value instanceof File) {
                        files[key] = value;
                    } else {
                        body[key] = value;
                    }
                });
            } 
            else if (contentType.includes("application/x-www-form-urlencoded")) {
                const text = await request.text();
                body = Object.fromEntries(new URLSearchParams(text));
            }
        } catch (error) {
            console.error("[Body Parse Error]:", error);
        }

        return { body, files };
    }
}

new App();