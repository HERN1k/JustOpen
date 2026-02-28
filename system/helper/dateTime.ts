// Developed by Hirnyk Vlad (HERN1k)

import dayjs from "dayjs";

export class DateTimeHelper {
    /**
     * Get current database-ready timestamp (UTC).
     * Format: 2026-02-28 10:15:00
     */
    static now(): string {
        return dayjs().format('YYYY-MM-DD HH:mm:ss');
    }

    /**
     * Returns the current Unix timestamp in seconds.
     * Equivalent to C# DateTimeOffset.UtcNow.ToUnixTimeSeconds().
     * Faster than calling toUnix(now()).
     * @returns Current timestamp as a number.
     */
    static getUnixNow(): number {
        return Math.floor(Date.now() / 1000);
    }

    /**
     * Format any date string for the frontend.
     * Example: '2026-02-28' -> 'Feb 28, 2026'
     */
    static format(date: string | Date, mask: string = 'MMM D, YYYY'): string {
        return dayjs(date).format(mask);
    }

    /**
     * Add or subtract time (Like C# .AddDays)
     */
    static modify(date: string, amount: number, unit: 'day' | 'month' | 'year'): string {
        return dayjs(date).add(amount, unit).format('YYYY-MM-DD HH:mm:ss');
    }

    /**
     * Converts a date string or Date object to a Unix timestamp (seconds).
     * Useful for JWT tokens, Redis TTL, or API integrations.
     * @param date - Date to convert (defaults to current time if not provided).
     * @returns Unix timestamp as a number.
     */
    static toUnix(date?: string | Date): number {
        return dayjs(date).unix();
    }

    /**
     * Converts a Unix timestamp (seconds) to a formatted date string.
     * @param timestamp - The Unix timestamp in seconds.
     * @param mask - The output format (defaults to DB format).
     * @returns Formatted date string.
     */
    static fromUnix(timestamp: number, mask: string = 'YYYY-MM-DD HH:mm:ss'): string {
        return dayjs.unix(timestamp).format(mask);
    }

    /**
     * Checks if the first date is earlier than the second date.
     * Like: date1 < date2
     */
    static isBefore(date1: string | Date, date2: string | Date): boolean {
        return dayjs(date1).isBefore(dayjs(date2));
    }

    /**
     * Checks if the first date is later than the second date.
     * Like: date1 > date2
     */
    static isAfter(date1: string | Date, date2: string | Date): boolean {
        return dayjs(date1).isAfter(dayjs(date2));
    }

    /**
     * Checks if two dates are exactly the same (to the second).
     */
    static isSame(date1: string | Date, date2: string | Date): boolean {
        return dayjs(date1).isSame(dayjs(date2));
    }

    /**
     * Checks if a date is between two other dates.
     * Useful for checking promo actions or discount validity.
     * @param targetDate - Date to check
     * @param startDate - Start boundary
     * @param endDate - End boundary
     */
    static isBetween(targetDate: string | Date, startDate: string | Date, endDate: string | Date): boolean {
        const target = dayjs(targetDate);
        return (target.isAfter(dayjs(startDate)) || target.isSame(dayjs(startDate))) && 
               (target.isBefore(dayjs(endDate)) || target.isSame(dayjs(endDate)));
    }

    /**
     * Returns the difference between two dates in specified units.
     * Example: Get days between order and today.
     */
    static diff(date1: string | Date, date2: string | Date, unit: 'day' | 'hour' | 'minute' | 'month' = 'day'): number {
        return dayjs(date1).diff(dayjs(date2), unit);
    }
}