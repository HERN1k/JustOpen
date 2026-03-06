// Developed by Hirnyk Vlad (HERN1k)

import { CUSTOMERS_DIR, BASE_URL, ADMIN_DIR } from "../../config";
import type { ParserResult, IUploadedFile } from "./types";

/**
 * The Request class handles the incoming HTTP request.
 * It parses the URL, POST data, Cookies, Files, and Headers.
 */
export class Request {
    /** GET parameters from the URL query string */
    public get: Record<string, string> = {};
    /** POST data from the request body (sanitized) */
    public post: Record<string, any> = {};
    /** Uploaded files indexed by the form field name */
    public files: Record<string, IUploadedFile> = {};
    /** Cookies sent by the client */
    public cookie: Record<string, string> = {};
    /** HTTP request headers */
    public headers: Record<string, string> = {};
    /** Server and execution environment info (Method, IP, User-Agent) */
    public server: Record<string, string> = {};
    /** UI theme */
    public layout: string = 'theme';
    /** Language */
    public language: string = 'en';
    
    private _parserResult!: ParserResult;
    private readonly _defaultRoute = 'common/home';
    private readonly _defaultAction = 'index';

    /**
     * Initializes a new request instance.
     * @param urlStr Full or relative request URL.
     * @param method HTTP method (GET, POST, etc.). Defaults to 'GET'.
     * @param headers Headers object.
     * @param body Request body (for POST).
     * @param files Files object from a multipart request.
     * @param cookiesStr Raw cookie string from the 'Cookie' header.
     */
    constructor(
        urlStr: string, 
        method: string = 'GET', 
        headers: Record<string, string> = {}, 
        body: any = null,
        files: any = null,
        cookiesStr: string = ''
    ) {
        this.headers = headers;
        this.server = {
            'REQUEST_METHOD': method.toUpperCase(),
            'REMOTE_ADDR': headers['x-forwarded-for'] || '127.0.0.1',
            'USER_AGENT': headers['user-agent'] || ''
        };

        this.parseCookies(cookiesStr);
        this.parsePost(body);
        this.parseFiles(files);
        this._parserResult = this.parseUrl(urlStr);
    }

    /**
     * Analyzes the URL to determine the route and GET parameters.
     * @protected
     */
    private parseUrl(urlStr: string): ParserResult {
        const url = new URL(urlStr, BASE_URL);

        url.searchParams.forEach((value, key) => {
            this.get[key] = this.clean(value);
        });

        const cleanPathname = url.pathname.replace(/^\/+|\/+$/g, '');
        const isAdmin = cleanPathname.startsWith(ADMIN_DIR) ? true : false;
        let currentAppPath = cleanPathname.startsWith(ADMIN_DIR) ? ADMIN_DIR : CUSTOMERS_DIR;

        let rawRoute = this.get['route'] || this._defaultRoute;
        rawRoute = rawRoute.replace(/[^a-zA-Z0-9_\/]/g, '');

        const parts = rawRoute.split('/');
        const folder = parts[0] || 'common';
        const file = parts[1] || 'home';
        const action = parts[2] || this._defaultAction;

        return {
            isAdmin: isAdmin,
            path: currentAppPath,
            folder: folder,
            file: file,
            action: action,
            route: `${folder}/${file}/${action}`
        };
    }

    /**
     * Processes raw files data into a standard UploadedFile interface.
     * @protected
     */
    private parseFiles(files: any): void {
        if (!files) {
            return;
        }

        for (const key in files) {
            const file = files[key];
            
            this.files[key] = {
                name: this.clean(file.originalFilename || file.name),
                type: file.mimetype || file.type,
                tmpName: file.filepath || file.tempFilePath,
                size: file.size,
                extension: (file.originalFilename || file.name).split('.').pop()?.toLowerCase() || '',
                error: file.error || 0
            };
        }
    }

    /**
     * Validates a file against allowed extensions and MIME types.
     * @param key File key in the files object.
     * @param allowedExtensions Array of allowed extensions, e.g., ['jpg', 'png'].
     * @param allowedMime Array of allowed MIME types, e.g., ['image/jpeg'].
     */
    public isValidFile(key: string, allowedExtensions: string[], allowedMime: string[]): boolean {
        const file = this.files[key];

        if (!file) {
            return false;
        }

        const isExtAllowed = allowedExtensions.includes(file.extension);
        const isMimeAllowed = allowedMime.includes(file.type);

        return isExtAllowed && isMimeAllowed && file.size > 0;
    }

    /**
     * Parses and sanitizes data from the request body.
     * @protected
     */
    private parsePost(body: any): void {
        if (body && typeof body === 'object') {
            for (const key in body) {
                this.post[key] = this.clean(body[key]);
            }
        }
    }

    /**
     * Parses the raw Cookies string into an object.
     * @protected
     */
    private parseCookies(cookiesStr: string): void {
        if (!cookiesStr) {
            return;
        }

        cookiesStr.split(';').forEach(cookie => {
            const [name, value] = cookie.split('=').map(c => c.trim());
            if (name && value) {
                this.cookie[name] = decodeURIComponent(value);
            }
        });
    }

    /**
     * Returns the current HTTP method.
     */
    public getMethod(): string | null {
        return this.server['REQUEST_METHOD'] || null;
    }

    /**
     * Checks if the request is a POST request.
     */
    public isPost(): boolean {
        return this.getMethod() === 'POST';
    }

    /**
     * Checks if the request is an AJAX (XMLHttpRequest) request.
     */
    public isAjax(): boolean {
        return this.headers['x-requested-with'] === 'XMLHttpRequest';
    }

    /**
     * Returns the parsed route result object.
     */
    public getParserResult(): ParserResult {
        return this._parserResult;
    }

    /**
     * Recursive data sanitization to remove HTML tags and trim whitespace.
     * @param value The value to be cleaned.
     * @protected
     */
    private clean(value: any): any {
        if (typeof value === 'string') {
            return value.replace(/<[^>]*>?/gm, '').trim();
        }

        if (typeof value === 'object' && value !== null) {
            for (const key in value) {
                value[key] = this.clean(value[key]);
            }
        }

        return value;
    }
}