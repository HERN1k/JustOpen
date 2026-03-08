// Developed by Hirnyk Vlad (HERN1k)

import { join, dirname, extname } from "node:path";
import { existsSync, mkdirSync, statSync, copyFileSync } from "node:fs";
import { IMAGE_DIR, CACHE_IMAGE_DIR, BASE_URL } from "../../config";
import sharp from "sharp";
import { logger } from "../core/logger";
import type { ImageFormat } from "../core/types";

/**
 * Image processing utility for dynamic resizing, format conversion, and caching.
 * Inspired by OpenCart architecture but optimized for modern web standards (WebP/AVIF).
 */
export class Image {
    private static placeholder = 'https://placehold.co/1024';
    
    /**
     * Resizes and converts images with smart caching based on modification time.
     * * @param filename - Relative path from IMAGE_DIR or absolute URL.
     * @param width - Target width in pixels (default: 500).
     * @param height - Target height. If null, maintains original aspect ratio.
     * @param format - Output format: 'webp', 'jpeg', 'png', or 'avif' (default: 'webp').
     * @param includeDomain - If true, prepends BASE_URL to the result.
     * @returns Promise<string> - The public URL to the processed image.
     */
    public static async resize(filename: string, width: number = 500, height: number | null = null, format: ImageFormat = 'webp', includeDomain: boolean = false): Promise<string> {
        if (!filename) return '';

        // Bypass processing for external links
        if (filename.startsWith('http://') || filename.startsWith('https://')) {
            return filename;
        }

        const originalFile = join(IMAGE_DIR, filename);
        
        // Return placeholder if the source file is missing
        if (!existsSync(originalFile)) {
            return this.placeholder;
        }

        const extension = extname(filename).toLowerCase();
        const isSvg = extension === '.svg';

        try {
            // Step 1: Define Cache Paths
            const pureName = filename.substring(0, filename.lastIndexOf('.'));
            const targetFormat = isSvg ? 'svg' : format;
            const cacheFilename = `${pureName}-${width}x${height || 'auto'}.${targetFormat}`;
            const cacheFile = join(CACHE_IMAGE_DIR, cacheFilename);

            /* Step 2: Cache Validation
               We compare the 'Last Modified' timestamp (mtime). If the original file 
               is newer than our cached version, we trigger a re-render.
            */
            let needToResize = true;
            if (existsSync(cacheFile)) {
                if (statSync(cacheFile).mtimeMs > statSync(originalFile).mtimeMs) {
                    needToResize = false;
                }
            }

            // Step 3: Image Transformation
            if (needToResize) {
                const dir = dirname(cacheFile);
                if (!existsSync(dir)) {
                    mkdirSync(dir, { recursive: true });
                }

                if (isSvg) {
                    copyFileSync(originalFile, cacheFile);
                } else {
                    const imageInstance = sharp(originalFile);
                    const metadata = await imageInstance.metadata();
                    
                    let finalWidth = width;
                    let finalHeight: number;

                    /* Step 4: Calculate Dimensions
                    If height is null, we calculate it based on the source aspect ratio to avoid distortion.
                    If height is provided, we use it (later applying 'contain' to fit the box).
                    */
                    if (height === null && metadata.width && metadata.height) {
                        finalHeight = Math.round(finalWidth / (metadata.width / metadata.height));
                    } else {
                        finalHeight = height || width;
                    }

                    const transformer = imageInstance.resize(finalWidth, finalHeight, {
                        // 'cover' for automatic height, 'contain' for fixed boxes (with background)
                        fit: height === null ? 'cover' : 'contain',
                        background: { r: 255, g: 255, b: 255, alpha: 1 }
                    });

                    // Apply format-specific optimizations
                    if (format === 'webp') transformer.webp({ quality: 80 });
                    else if (format === 'avif') transformer.avif({ quality: 50 });
                    else if (format === 'jpeg') transformer.jpeg({ quality: 85 });
                    else if (format === 'png') transformer.png({ compressionLevel: 9 });

                    await transformer.toFile(cacheFile);
                }
            }

            // Step 5: URL Construction
            // Ensure Windows backslashes are converted to URL-friendly forward slashes
            const relativePath = `/storage/cache/image/${cacheFilename.replace(/\\/g, '/')}`;
            return includeDomain ? `${BASE_URL}${relativePath}` : relativePath;

        } catch (error) {
            logger.error(`Critical Error: ${error}`, 'Image', 'image');
            return '';
        }
    }

    /** * Generates a square product thumbnail (256x256 WebP).
     * @param path - Relative image path.
     * @param size - Size for both width and height.
     * @param includeDomain - If true, prepends BASE_URL to the result.
     */
    public static async thumb(path: string, size: number = 256, includeDomain: boolean = false): Promise<string> {
        return this.resize(path, size, size, 'webp', includeDomain);
    }

    /** * Generates a responsive banner maintaining original aspect ratio.
     * @param path - Relative image path.
     * @param width - Target width (default: 1920px).
     * @param includeDomain - If true, prepends BASE_URL to the result.
     */
    public static async banner(path: string, width: number = 1920, includeDomain: boolean = false): Promise<string> {
        return this.resize(path, width, null, 'webp', includeDomain);
    }

    /** * Generates a JPEG image optimized for social media OpenGraph tags.
     * @param path - Relative image path.
     * @param includeDomain - If true, prepends BASE_URL to the result.
     */
    public static async social(path: string, includeDomain: boolean = false): Promise<string> {
        return this.resize(path, 1200, 630, 'jpeg', includeDomain);
    }

    /** * Generates a small WEBP icon (useful for maintaining transparency).
     * @param path - Relative image path.
     * @param size - Icon dimension (default: 32px).
     * @param includeDomain - If true, prepends BASE_URL to the result.
     */
    public static async icon(path: string, size: number = 32, includeDomain: boolean = false): Promise<string> {
        return this.resize(path, size, size, 'webp', includeDomain);
    }
}