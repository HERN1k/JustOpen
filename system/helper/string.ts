// Developed by Hirnyk Vlad (HERN1k)

/**
 * Utility class for string manipulation and formatting.
 */
export class StringHelper {
    /**
     * Indicates whether the specified string is null or an empty string ("").
     * @param str - The string to evaluate.
     * @returns true if the str parameter is null, undefined, or an empty string; otherwise, false.
     */
    static isNullOrEmpty(str: string | null | undefined): str is null | undefined | "" {
        return str === null || str === undefined || str.length === 0;
    }

    /**
     * Indicates whether a specified string is null, empty, or consists only of white-space characters.
     * @param str - The string to evaluate.
     * @returns true if the str parameter is null, undefined, or empty, or if it consists only of white-space characters.
     */
    static isNullOrWhiteSpace(str: string | null | undefined): str is null | undefined | "" {
        return str === null || str === undefined || str.trim().length === 0;
    }

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
        if (str.length <= length) {
            return str;
        }

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

    /**
     * Validates if the string is a properly formatted email address.
     * @param email - The string to evaluate.
     */
    static isEmail(email: string | null | undefined): boolean {
        if (this.isNullOrWhiteSpace(email)) {
            return false;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        return emailRegex.test(email!);
    }

    /**
     * Validates if the string is a valid URL (supports http, https, ftp).
     * @param url - The string to evaluate.
     */
    static isUrl(url: string | null | undefined): boolean {
        if (this.isNullOrWhiteSpace(url)) {
            return false;
        }

        try {
            new URL(url!);

            return true;
        } catch {
            return false;
        }
    }

    /**
     * Validates if the string is a valid phone number.
     * Supports formats: +380..., 8800..., (044)..., etc.
     * @param phone - The string to evaluate.
     */
    static isPhone(phone: string | null | undefined): boolean {
        if (this.isNullOrWhiteSpace(phone)) {
            return false;
        }

        const cleaned = phone!.replace(/[^\d+]/g, '');
        const phoneRegex = /^\+?\d{7,15}$/;

        return phoneRegex.test(cleaned);
    }

    /**
     * Validates if a string is a valid date.
     */
    static isDate(str: string | null | undefined): boolean {
        if (this.isNullOrWhiteSpace(str)) {
            return false;
        }

        const d = new Date(str!);
        
        return d instanceof Date && !isNaN(d.getTime());
    }
}