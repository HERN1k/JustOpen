// Developed by Hirnyk Vlad (HERN1k)

export class Formater {
    /**
     * Converts seconds into readable time.
     */
    public static formatUptime(seconds: number): string {
        const days = Math.floor(seconds / (24 * 3600));
        const hours = Math.floor((seconds % (24 * 3600)) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);

        return [
            days > 0 && `${days}d`,
            hours > 0 && `${hours}h`,
            minutes > 0 && `${minutes}m`,
            (secs > 0 || seconds === 0) && `${secs}s`
        ].filter(Boolean).join(' ');
    }

    /**
     * Helper for secure IP parsing
     */
    public static getClientIp(headers: Headers): string {
        return headers.get("x-real-ip") || 
               headers.get("x-forwarded-for")?.split(',')[0] || 
               "127.0.0.1";
    }
}