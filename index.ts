// Developed by Hirnyk Vlad (HERN1k)

import { APP_PORT, BASE_URL, DB_CONFIG, DB_DRIVER, HTTPS_BASE_URL } from './config';
import { Action } from './system/core/action';
import { Registry } from './system/core/registry';
import { Request as CustomRequest } from './system/core/request';
import { Response as CustomResponse } from './system/core/response';
import { DB } from './system/core/db';
import { Render } from './system/core/render';
import { Config } from './system/core/config';
import { logger } from './system/core/logger';
import { Formater } from './system/helper/formater';
import { System } from './system/helper/system';
import type { IAppStats } from './system/core/types';

/**
 * Main Application class responsible for the server lifecycle,
 * request routing, and system monitoring.
 */
class App {
    /**
     * Internal application metrics and statistics.
     */
    private stats: IAppStats = {
        totalRequests: 0,
        methods: {},
        statusCodes: {},
        startTime: Date.now(),
        uniqueIps: new Set(),
        ipActivity: {}
    };

    /**
     * Initializes the application and starts the Bun server.
     */
    constructor() {
        this.startServer();
    }

    /**
     * Starts the Bun HTTP server on the configured port.
     * @private
     */
    private startServer(): void {
        Bun.serve({
            port: APP_PORT,
            idleTimeout: 60,
            fetch: (req) => this.handleRequest(req),
        });

        setInterval(() => this.logTopActivity(), 36000);

        logger.info(`JustOpen server running at ${BASE_URL}`, "SYS");
    }

    /**
     * Primary request coordinator. Processes static files, health checks, 
     * and dynamic routes while measuring performance.
     * @param request - Native Bun/Web Request object.
     * @returns Promise resolving to a Web Response object.
     * @private
     */
    private async handleRequest(request: Request): Promise<Response> {
        const start = performance.now();
        const url = new URL(request.url);
        const ip = Formater.getClientIp(request.headers);
        
        let response: Response;

        try {
            if (url.pathname === "/health") {
                response = await this.handleHealthCheck();
            } 
            else if (request.method === "GET" && (url.pathname.startsWith("/storage/cache") || url.pathname.startsWith("/image"))) {
                const staticRes = await this.handleStaticFile(request.url);
                response = staticRes || new Response("Not Found", { status: 404 });
            } 
            else {
                response = await this.processDynamicRequest(request);
            }
        } catch (error: any) {
            logger.error(`Fatal Runtime Error: ${error.message}`, "HTTP_HANDLER", "error");
            response = new Response("Internal Server Error", { status: 500 });
        }

        const duration = performance.now() - start;

        this.updateStats(request.method, response.status, ip, url.href.substring(HTTPS_BASE_URL.length));
        this.recordLog(request.method, url.pathname, response.status, duration, ip);

        return response;
    }

    /**
     * Returns the top 25 active IP addresses
     */
    private getTopIps(limit: number = 25) {
        return Object.entries(this.stats.ipActivity)
            .map(([ip, data]) => ({ ip, ...data }))
            .sort((a, b) => b.count - a.count)
            .slice(0, limit);
    }

    /**
     * Records the top activity in the log file
     */
    private logTopActivity(): void {
        const top = this.getTopIps(25);
        const report = top.map(item => 
            `IP: ${item.ip.padEnd(15)} | Req: ${item.count.toString().padEnd(6)} | Last: ${item.lastMethod} ${item.lastUrl}`
        ).join('\n');
        
        logger.info(`Top 25 IP Activity Report:\n${report}`, "SECURITY");
    }

    /**
     * Dispatches the request log to the Logger service with appropriate levels.
     * @param method - HTTP Method (GET, POST, etc.)
     * @param url - Requested URL path.
     * @param status - HTTP response status code.
     * @param duration - Request processing time in milliseconds.
     * @param ip - Client IP address.
     * @private
     */
    private recordLog(method: string, url: string, status: number, duration: number, ip: string): void {
        const msg = `${method.padEnd(6)} | ${status} | ${url.substring(0, 40).padEnd(40)} | ${duration.toFixed(2).padStart(7)}ms | IP: ${ip}`;
        
        if (status >= 500) {
            logger.error(msg, "HTTP", "http_error");
        } else if (status >= 400) {
            logger.warn(msg, "HTTP", "http_warn");
        } else {
            logger.info(msg, "HTTP");
        }
    }

    /**
     * Prepares the Registry with core dependencies and executes the Action.
     * @param request - Incoming Request.
     * @returns Promise resolving to the generated Response.
     * @private
     */
    private async processDynamicRequest(request: Request): Promise<Response> {
        const { body, files } = await this.parseRequestBody(request);
        
        const headers: Record<string, string> = {};
        request.headers.forEach((value, key) => { headers[key] = value; });

        const registry = new Registry();
        
        registry.set('logger', logger);
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
        registry.set('config', new Config());
        registry.set('render', new Render(registry));

        const result = await new Action(registry).execute();

        return new Response(result.content, {
            headers: { ...result.headers }, 
            status: result.statusCode,
            statusText: result.statusText
        });
    }

    /**
     * Parses the incoming request body based on the Content-Type header.
     * @param request - Incoming Request.
     * @returns Object containing parsed body and uploaded files.
     * @private
     */
    private async parseRequestBody(request: Request): Promise<{ body: any; files: any }> {
        if (request.method === "GET") return { body: null, files: null };

        const contentType = request.headers.get("content-type") || "";
        try {
            if (contentType.includes("application/json")) {
                return { body: await request.json(), files: null };
            } 
            if (contentType.includes("multipart/form-data")) {
                const formData = await request.formData();
                const body: any = {};
                const files: any = {};
                formData.forEach((value, key) => {
                    if (value instanceof File) files[key] = value;
                    else body[key] = value;
                });
                return { body, files };
            } 
            if (contentType.includes("application/x-www-form-urlencoded")) {
                const text = await request.text();
                return { body: Object.fromEntries(new URLSearchParams(text)), files: null };
            }
        } catch (e: any) {
            logger.error(`Body Parsing Failed: ${e.message}`, "PARSER", "error");
        }
        return { body: null, files: null };
    }

    /**
     * Checks for file existence and returns a response with optimized cache headers.
     * @param url - Request URL string.
     * @returns Promise of a Response containing the file or null if not found.
     * @private
     */
    private async handleStaticFile(url: string): Promise<Response | null> {
        const urlPath = new URL(url).pathname;
        const file = Bun.file(`.${urlPath}`);

        if (!(await file.exists())) return null;

        const isCache = urlPath.startsWith("/storage/cache");
        return new Response(file, {
            headers: {
                "Content-Type": file.type,
                "Cache-Control": isCache 
                    ? "public, max-age=31536000, immutable" 
                    : "public, max-age=86400",
                "X-Content-Type-Options": "nosniff",
                "Last-Modified": new Date(file.lastModified).toUTCString(),
            }
        });
    }

    /**
     * Generates a JSON response with system status and statistics.
     * @returns Promise of a JSON Response.
     * @private
     */
    private async handleHealthCheck(): Promise<Response> {
        const uptimeSeconds = Math.floor((Date.now() - this.stats.startTime) / 1000);

        return new Response(JSON.stringify({
            status: "UP",
            uptime: Formater.formatUptime(uptimeSeconds),
            start_time: new Date(this.stats.startTime).toISOString(),
            resources: {
                memory: `${(process.memoryUsage().rss / 1024 / 1024).toFixed(2)} MB`,
                disk: System.getDiskSpace()
            },
            stats: {
                total: this.stats.totalRequests,
                unique_ips: this.stats.uniqueIps.size,
                methods: this.stats.methods,
                codes: this.stats.statusCodes
            },
            top_activity: this.getTopIps(25)
        }, null, 2), { headers: { "Content-Type": "application/json" } });
    }

    /**
     * Updates internal counters for monitoring purposes.
     * @param method - HTTP method.
     * @param status - Response status code.
     * @param ip - Remote IP address.
     * @param path - Request url.
     * @private
     */
    private updateStats(method: string, status: number, ip: string, path: string): void {
        this.stats.totalRequests++;
        this.stats.uniqueIps.add(ip);
        this.stats.methods[method] = (this.stats.methods[method] || 0) + 1;
        this.stats.statusCodes[status] = (this.stats.statusCodes[status] || 0) + 1;

        if (!this.stats.ipActivity[ip]) {
            this.stats.ipActivity[ip] = {
                count: 0,
                lastUrl: '',
                lastMethod: '',
                lastSeen: ''
            };
        }

        const client = this.stats.ipActivity[ip];
        client.count++;
        client.lastUrl = path;
        client.lastMethod = method;
        client.lastSeen = new Date().toISOString();
    }
}

new App();