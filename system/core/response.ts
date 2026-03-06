// Developed by Hirnyk Vlad (HERN1k)

/**
 * The Response class handles the output buffer of the application.
 * It manages content types, HTTP headers, status codes, and the final body string
 * before it is transmitted to the client.
 */
export class Response {
    /**
     * The HTTP status code of the response.
     * @default 200
     */
    public statusCode: number = 200;

    /**
     * The HTTP status text corresponding to the status code.
     * @default "OK"
     */
    public statusText: string = 'OK';

    /**
     * A map of HTTP headers to be sent with the response.
     * @default "{ 'Content-Type': 'text/html; charset=utf-8' }"
     */
    public headers: Record<string, string> = {
        "Content-Type": "text/html; charset=utf-8"
    };

    /**
     * Storage for the response body content.
     * @default "Clear HTML template"
     */
    public content: string = `
        <!DOCTYPE html>
        <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>JustOpen 0.0.1</title>
            </head>
            <body>
                <h1>Clear HTML template</h1>
            </body>
        </html>
    `;

    /**
     * Standard HTTP response messages mapped by status code.
     * @private
     * @static
     * @readonly
     */
    private static readonly STATUS_MESSAGES: Record<number, string> = {
        200: 'OK',
        201: 'Created',
        204: 'No Content',
        301: 'Moved Permanently',
        302: 'Found',
        400: 'Bad Request',
        401: 'Unauthorized',
        403: 'Forbidden',
        404: 'Not Found',
        405: 'Method Not Allowed',
        422: 'Unprocessable Entity',
        500: 'Internal Server Error',
        502: 'Bad Gateway',
        503: 'Service Unavailable'
    };

    /**
     * Gets the current Content-Type from headers.
     */
    public get contentType(): string {
        return this.headers["Content-Type"] ?? "text/html; charset=utf-8";
    }

    /**
     * Sets the Content-Type header.
     */
    public set contentType(value: string) {
        this.headers["Content-Type"] = value;
    }

    /**
     * Sets a specific HTTP header.
     * @param name - The name of the header (e.g., 'Cache-Control').
     * @param value - The value of the header.
     * @returns this - Returns the instance for chaining.
     */
    public setHeader(name: string, value: string): this {
        this.headers[name] = value;
        return this;
    }

    /**
     * Sets the output buffer content and updates status metadata.
     * @param content - The raw string content to be sent.
     * @param contentType - The MIME type. Defaults to 'text/html; charset=utf-8'.
     * @param statusCode - The HTTP status code. Defaults to 200.
     * @returns void
     */
    public setOutput(
        content: string = "", 
        contentType: string = 'text/html; charset=utf-8', 
        statusCode: number = 200
    ): void {
        this.content = content;
        this.contentType = contentType;
        this.statusCode = statusCode;
        this.statusText = Response.STATUS_MESSAGES[statusCode] || 'Unknown Status';
    }

    /**
     * Configures the response for a redirect by setting the 'Location' header.
     * @param url - The destination URL.
     * @param statusCode - The redirect status code. Defaults to 302.
     */
    public redirect(url: string, statusCode: number = 302): void {
        this.statusCode = statusCode;
        this.statusText = Response.STATUS_MESSAGES[statusCode] || 'Found';
        this.setHeader('Location', url);
        this.content = ''; 
    }
}