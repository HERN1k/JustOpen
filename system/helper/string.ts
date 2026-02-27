// Developed by Hirnyk Vlad (HERN1k)

/**
 * Utility class for string manipulation and formatting.
 */
export class StringHelper {
    /**
     * Converts snake_case or dash-case to PascalCase.
     * Example: 'product_id' -> 'ProductId'
     */
    static toPascalCase(str: string): string {
        return str
            .split(/[-_]/)
            .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
            .join('');
    }

    /**
     * Converts string to camelCase.
     * Example: 'first_name' -> 'firstName'
     */
    static toCamelCase(str: string): string {
        const pascal = this.toPascalCase(str);
        return pascal.charAt(0).toLowerCase() + pascal.slice(1);
    }

    /**
     * Truncates a string to a specified length and adds a suffix.
     * Useful for product short descriptions.
     */
    static truncate(str: string, length: number, suffix: string = '...'): string {
        if (str.length <= length) return str;
        return str.substring(0, length).trim() + suffix;
    }

    /**
     * Generates a random alphanumeric string.
     * Useful for salt, tokens, or temporary passwords.
     */
    static random(length: number = 16): string {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    /**
     * Cleans string from any HTML tags and trims whitespace.
     */
    static stripHtml(str: string): string {
        return str.replace(/<[^>]*>?/gm, '').trim();
    }

    /**
     * Checks if a string is a valid JSON.
     */
    static isJson(str: string): boolean {
        try {
            JSON.parse(str);
            return true;
        } catch {
            return false;
        }
    }
}