// Developed by Hirnyk Vlad (HERN1k)

/**
 * The Response class handles the output buffer of the application.
 * It manages content types, headers, and the final body string
 * before it is sent to the client.
 */
export class Response {
    /** * The Content-Type header of the response.
     * @default "text/html;"
     */
    public contentType: string = "text/html;";

    /**
     * Internal storage for the response body content.
     * @private
     */
    private content: string = "";

    /**
     * Gets the current output buffer.
     * @returns The stored string content.
     */
    public getOutput(): string {
        return this.content;
    }

    /**
     * Sets the output buffer content. 
     * Usually called at the end of a controller action or by the template engine.
     * @param content The string content (HTML, JSON, etc.) to be sent to the client.
     */
    public setOutput(content: string): void {
        this.content = content;
    }
}