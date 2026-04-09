// Developed by Hirnyk Vlad (HERN1k)

import { Eta } from "eta";
import { minify } from "html-minifier-terser";
import { StringHelper } from "../helper/string";
import { ADMIN_DIR, CACHE_DIR, CUSTOMERS_DIR, HTTPS_BASE_URL, ROOT_DIR, ADMIN_DIR_VIEW, DIR_VIEW } from "../../config";
import { join, parse, sep } from 'path';
import { transformSync } from "@babel/core";
import postcss from "postcss";
import autoprefixer from "autoprefixer";
import { transform } from "lightningcss";
import type { Registry } from "./registry";
import type { IHeadContent } from "./types";

/**
 * Core Rendering Engine using Eta templates.
 * Handles template execution, asset minification, and caching.
 */
export class Render {
    /** @private System registry instance */
    private registry: Registry;
    /** @private Eta instance for template rendering */
    private eta: Eta;
    /** @private List of filenames that should skip the minification process */
    private notMinifyFileNames: Array<string> = ['lucide'];
    /** @private Container for assets to be injected into the layout */
    private pageData: Record<string, any> = {
        'css': [],
        'js': []
    };

    /**
     * @param registry - System registry instance for shared services.
     */
    constructor(registry: Registry) {
        this.registry = registry;
        this.eta = new Eta({
            autoEscape: true,
            cache: true,
            views: ROOT_DIR
        });
    }

    /**
     * Shortcut to access the system logger.
     */
    private get logger() {
        return this.registry.get('logger');
    }

    /**
     * Set data for the specific request context.
     * @param data - Key-value pairs of data to be available in templates.
     */
    public setPageData(data: Record<string, any>): void {
        this.pageData = { ...this.pageData, ...data };
    }

    /**
     * Renders the main layout template with provided content.
     * Integrates processed assets and wraps the content into the final HTML structure.
     * @param content - The pre-rendered HTML content of the page body.
     * @returns Minified full HTML string with DOCTYPE.
     */
    public async getPage(content: string): Promise<string> {
        const layoutName: string = this.registry.get('config').get('theme') || 'theme';

        const request = this.registry.get('request');
        const parser = request.getParserResult();
        
        const layoutPath: string = `${parser.path}/view/${layoutName}/layout.eta`;

        try {
            const layoutFile = Bun.file(layoutPath);

            if (!(await layoutFile.exists())) {
                this.logger.error(`Layout file not found: ${layoutPath}`, "VIEW_LOADER", "render_error");
                return content; 
            }

            await this.processFonts();

            const headContent = await this.headContent();

            request.layout = layoutName;
            
            const [processedCss, processedJs] = await Promise.all([
                Promise.all((this.pageData.css as string[]).map(css => this.processAsset(css, 'css'))),
                Promise.all((this.pageData.js as string[]).map(js => this.processAsset(js, 'js'))),
            ]);

            const renderData = this.configureData({
                ...this.pageData,
                css: processedCss,
                js: processedJs,
                lang: 'uk',
                head: headContent,
                content: content
            });

            let rawHTML = await this.eta.renderAsync(layoutPath, renderData);

            const trimmedHTML = rawHTML.trim();
            if (!trimmedHTML.toLowerCase().startsWith('<!doctype')) {
                rawHTML = '<!DOCTYPE html>\n' + rawHTML;
            }

            return await this.minifyHTML(rawHTML);

        } catch (error: any) {
            this.logger.error(`Critical rendering error at ${layoutPath}: ${error.message}`, "RENDER_ENGINE", "render_error");
            return content;
        }
    }

    /**
     * Renders a specific template using a plain object for data.
     * @param templatePath - Absolute path to the .eta file.
     * @param data - Plain object containing template variables.
     * @returns Minified HTML string or empty string if template not found.
     */
    public async build(templatePath: string, data: Record<string, any>): Promise<string> {
        templatePath = this.cleanPath(templatePath);

        const file = Bun.file(templatePath);
        
        if (!(await file.exists())) {
            this.logger.error(`Template file not found at: ${templatePath}`, "RENDER_BUILD");
            return '';
        }

        try {
            const templateSource = await file.text();
            const rawHTML = await this.eta.renderStringAsync(templateSource, this.configureData(data));
            return await this.minifyHTML(rawHTML);
        } catch (error: any) {
            this.logger.error(`Error building template ${templatePath}: ${error.message}`, "RENDER_BUILD", "render_error");
            return '';
        }
    }

    /**
     * Injects global helper methods and constants into the template data.
     * @param data - Original data object.
     * @returns Merged data object with helpers.
     */
    private configureData(data: Record<string, any>): Record<string, any> {
        return {
            ...data,
            HTTPS_BASE_URL,
            stringHelper: StringHelper
        };
    }

    /**
     * Scans the theme's font directory and copies new or updated fonts to the cache.
     * Uses Bun.Glob for efficient file discovery.
     * @returns Promise<void>
     */
    private async processFonts(): Promise<void> {
        const layoutName: string = this.registry.get('config').get('theme') || 'theme';
        const parser = this.registry.get('request').getParserResult();
        const baseDir = parser.isAdmin ? ADMIN_DIR : CUSTOMERS_DIR;
        const fullPath = parser.isAdmin 
            ? join(ADMIN_DIR_VIEW, layoutName, 'src', 'fonts')
            : join(DIR_VIEW, layoutName, 'src', 'fonts');

        const glob = new Bun.Glob("**/*");

        for await (const sourcePath of glob.scan({ cwd: fullPath, absolute: true })) {
            const sourceFile = Bun.file(sourcePath);
            const { name, ext, dir } = parse(sourcePath);

            const srcIndex = dir.indexOf(`${sep}src`);

            if (srcIndex === -1) {
                continue;
            }

            const relativeFolder = dir.substring(srcIndex + 1).replaceAll(sep, '/');
            
            const cachePath = join(CACHE_DIR, baseDir, relativeFolder, `${name}${ext}`);
            const cacheFile = Bun.file(cachePath);

            const needsUpdate = !(await cacheFile.exists()) || (sourceFile.lastModified > cacheFile.lastModified);

            if (needsUpdate) {
                try {
                    await Bun.write(cachePath, sourceFile);
                    this.logger.info(`Font copied to cache: ${name}${ext}`, "CACHE");
                } catch (error: any) {
                    this.logger.error(`Failed to copy font ${name}${ext}: ${error.message}`, "FONTS");
                }
            }
        }
    }

    /**
     * Scans the 'head' directory, copies icons/manifest to cache, 
     * and returns web-accessible paths for the layout.
     * @returns Promise<IHeadContent>
     */
    private async headContent(): Promise<IHeadContent> {
        const layoutName: string = this.registry.get('config').get('theme') || 'theme';
        const parser = this.registry.get('request').getParserResult();
        const baseDir = parser.isAdmin ? ADMIN_DIR : CUSTOMERS_DIR;
        const fullPath = parser.isAdmin 
            ? join(ADMIN_DIR_VIEW, layoutName, 'src', 'head')
            : join(DIR_VIEW, layoutName, 'src', 'head');

        const glob = new Bun.Glob("**/*");

        const result: IHeadContent = {
            androidSmall: '',
            androidBig: '',
            apple: '',
            faviconSmall: '',
            faviconBig: '',
            faviconIco: '',
            webManifest: '',
        };

        for await (const sourcePath of glob.scan({ cwd: fullPath, absolute: true })) {
            const sourceFile = Bun.file(sourcePath);
            const { name, ext, dir } = parse(sourcePath);
            const fileName = `${name}${ext}`;

            const srcIndex = dir.indexOf(`${sep}src`);

            if (srcIndex === -1) {
                continue;
            }

            const relativeFolder = dir.substring(srcIndex + 1).replaceAll(sep, '/');
            
            const webPath = `/storage/cache/${baseDir}/${relativeFolder}/${fileName}?v=${sourceFile.lastModified}`;
            const cachePath = join(CACHE_DIR, baseDir, relativeFolder, `${fileName}`);
            const cacheFile = Bun.file(cachePath);

            if (fileName === 'android-chrome-192x192.png') result.androidSmall = webPath;
            else if (fileName === 'android-chrome-512x512.png') result.androidBig = webPath;
            else if (fileName === 'apple-touch-icon.png') result.apple = webPath;
            else if (fileName === 'favicon-16x16.png') result.faviconSmall = webPath;
            else if (fileName === 'favicon-32x32.png') result.faviconBig = webPath;
            else if (fileName === 'favicon.ico') result.faviconIco = webPath;
            else if (fileName === 'site.webmanifest') result.webManifest = webPath;

            const needsUpdate = !(await cacheFile.exists()) || (sourceFile.lastModified > cacheFile.lastModified);
            if (needsUpdate) {
                try {
                    await Bun.write(cachePath, sourceFile);
                    this.logger.info(`Head asset cached: ${fileName}`, "CACHE");
                } catch (error: any) {
                    this.logger.error(`Failed to copy head asset ${fileName}: ${error.message}`, "CACHE");
                }
            }
        }

        return result;
    }

    /**
     * Processes and minifies an asset if it's outdated or missing.
     * @param sourcePath - Path to the original file.
     * @param type - Asset type ('css' | 'js').
     * @returns Web-accessible path to the cached/minified file.
     */
    private async processAsset(sourcePath: string, type: 'css' | 'js'): Promise<string> {
        const layoutName: string = this.registry.get('config').get('theme') || 'theme';

        if (!sourcePath.includes(layoutName)) {
            this.logger.warn(`Source file not found in theme: ${sourcePath}`, "ASSET_LOADER");
            return sourcePath;
        }

        const sourceFile = Bun.file(sourcePath);
        if (!(await sourceFile.exists())) {
            this.logger.error(`Asset source file missing: ${sourcePath}`, "ASSET_LOADER");
            return sourcePath;
        }

        const { name, ext, dir } = parse(sourcePath);
        const isAdmin = this.registry.get('request').getParserResult().isAdmin;
        const baseDir = isAdmin ? ADMIN_DIR : CUSTOMERS_DIR;

        const srcIndex = dir.indexOf(`${sep}src`);
        if (srcIndex === -1) {
            this.logger.error(`Invalid asset path structure: ${sourcePath}`, "ASSET_LOADER");
            return sourcePath;
        }

        const relativeFolder = dir.substring(srcIndex + 1).replaceAll(sep, '/');
        const minFileName = `${name}.min${ext}`;

        const webPath = `/storage/cache/${baseDir}/${relativeFolder}/${minFileName}?v=${sourceFile.lastModified}`;
        const cachePath = join(CACHE_DIR, baseDir, relativeFolder, minFileName);
        const cacheFile = Bun.file(cachePath);

        const needsUpdate = !(await cacheFile.exists()) || (sourceFile.lastModified > cacheFile.lastModified);

        if (needsUpdate) {
            try {
                let content = await sourceFile.text();

                if (!this.notMinifyFileNames.includes(name)) {
                    content = type === 'css' 
                        ? await this.minifyCSS(content) 
                        : await this.minifyJS(content);
                }

                await Bun.write(cachePath, content);
                this.logger.info(`Asset minified and cached: ${minFileName}`, "CACHE");
            } catch (error: any) {
                this.logger.error(`Minification failed for ${sourcePath}: ${error.message}`, "MINIFY", "error");
                return sourcePath;
            }
        }

        return webPath;
    }

    /**
     * Helper to minify HTML content.
     */
    private async minifyHTML(html: string): Promise<string> {
        try {
            return await minify(html, {
                collapseWhitespace: true,
                removeComments: true,
                minifyJS: true,
                minifyCSS: true,
                processConditionalComments: true,
                removeAttributeQuotes: false,
                removeEmptyAttributes: true
            });
        } catch (e: any) {
            this.logger.warn(`HTML Minification skipped: ${e.message}`, "RENDER");
            return html;
        }
    }
    
    /**
     * Minifies CSS using PostCSS and LightningCSS.
     */
    private async minifyCSS(content: string = ''): Promise<string> {
        const postcssResult = await postcss([autoprefixer()]).process(content, { from: undefined });

        const { code } = transform({
            filename: 'style.css',
            code: Buffer.from(postcssResult.css),
            minify: true,
            targets: { safari: (13 << 16), ie: (11 << 16) }
        });

        return code.toString();
    }

    /**
     * Minifies JS using Babel and Bun.build.
     */
    private async minifyJS(content: string = ''): Promise<string> {
        const babelResult = transformSync(content, {
            presets: [["@babel/preset-env", { targets: "defaults", modules: false }]],
            compact: true,
            minified: true,
            comments: false
        });

        const codeToMinify = babelResult?.code || content;

        const build = await Bun.build({
            entrypoints: ["./index.ts"],
            minify: true,
            plugins: [{
                name: "virtual-entry",
                setup(build) {
                    build.onLoad({ filter: /.*/ }, () => ({
                        contents: codeToMinify,
                        loader: "js",
                    }));
                },
            }],
        });

        if (!build.success) {
            return codeToMinify;
        }

        return await build.outputs[0]?.text() ?? codeToMinify;
    }

    /**
     * Sanitizes paths for different operating systems.
     */
    private cleanPath(path: string): string {
        let result = path.replace(/^file:\/\/\/?/, '');
        
        if (process.platform === 'win32') {
            result = result.replace(/^\/([A-Z]:)/i, '$1');
            result = result.replace(/\\/g, '/');
        }
        
        return result;
    }
}