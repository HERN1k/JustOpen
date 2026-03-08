// Developed by Hirnyk Vlad (HERN1k)

import { Eta } from "eta";
import { minify } from "html-minifier-terser";
import { StringHelper } from "../helper/string";
import { CACHE_DIR, HTTPS_BASE_URL, ROOT_DIR } from "../../config";
import { join, parse } from 'path';
import { transformSync } from "@babel/core";
import postcss from "postcss";
import autoprefixer from "autoprefixer";
import { transform } from "lightningcss";
import type { Registry } from "./registry";

/**
 * Core Rendering Engine using Eta templates.
 * Handles template execution, asset minification, and caching.
 */
export class Render {
    private registry: Registry;
    private eta: Eta;
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
     * Set data for the specific request context.
     * @param data - Key-value pairs of data to be available in templates.
     */
    public setPageData(data: Record<string, any>): void {
        this.pageData = { ...this.pageData, ...data };
    }

    /**
     * Renders the main layout template with provided content.
     * Integrates processed assets and wraps the content into the final HTML structure.
     * * @param content - The pre-rendered HTML content of the page body (from build() method).
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
                console.error(`[ViewLoader] Layout file not found: ${layoutPath}`);
                return content; // Return raw content if layout is missing
            }

            request.layout = layoutName;
            
            const [processedCss, processedJs] = await Promise.all([
                Promise.all((this.pageData.css as string[]).map(css => this.processedAsset(css, 'css'))),
                Promise.all((this.pageData.js as string[]).map(js => this.processedAsset(js, 'js')))
            ]);

            const renderData = this.configureData({
                ...this.pageData,
                css: processedCss,
                js: processedJs,
                lang: 'uk',
                content: content
            });

            let rawHTML = await this.eta.renderAsync(layoutPath, renderData);

            const trimmedHTML = rawHTML.trim();
            if (!trimmedHTML.toLowerCase().startsWith('<!doctype')) {
                rawHTML = '<!DOCTYPE html>\n' + rawHTML;
            }

            return await this.minifyHTML(rawHTML);

        } catch (error) {
            console.error(`[ViewLoader] Critical error rendering layout at ${layoutPath}:`, error);
            return content;
        }
    }

    /**
     * Renders a specific template using a plain object for data.
     * * @param templatePath - Absolute path to the .eta file.
     * @param data - Plain object containing template variables.
     * @returns Minified HTML string or empty string if template not found.
     */
    public async build(templatePath: string, data: Record<string, any>): Promise<string> {
        templatePath = this.cleanPath(templatePath);

        const file = Bun.file(templatePath);
        
        if (!(await file.exists())) {
            console.error(`[Render] Template file not found at: ${templatePath}`);
            return '';
        }

        try {
            const templateSource = await file.text();

            const rawHTML = this.eta.renderString(templateSource, this.configureData(data));

            return await this.minifyHTML(rawHTML);
        } catch (error) {
            console.error(`[Render] Error building template ${templatePath}:`, error);
            return '';
        }
    }

    private configureData(data: Record<string, any>): Record<string, any> {
        return {
            ...data,
            HTTPS_BASE_URL,
            stringHelper: StringHelper
        };
    }

    /**
     * Processes and minifies an asset if it's outdated or missing.
     * @param sourcePath - Path to the original file.
     * @param type - Asset type ('css' | 'js').
     * @returns Web-accessible path to the cached/minified file.
     */
    private async processedAsset(sourcePath: string, type: 'css' | 'js'): Promise<string> {
        const sourceFile = Bun.file(sourcePath);
        
        if (!(await sourceFile.exists())) {
            console.error(`Source file not found: ${sourcePath}`);
            return sourcePath;
        }

        const { name, ext } = parse(sourcePath); 
        const fileName = `${name}.min${ext}`;
        const webPath = `/storage/cache/${type}/${fileName}`;
        const cachePath = join(CACHE_DIR, type, fileName);
        const cacheFile = Bun.file(cachePath);

        const needsUpdate = !(await cacheFile.exists()) || (sourceFile.lastModified > cacheFile.lastModified);

        if (needsUpdate) {
            const content = await sourceFile.text();
            const minified = type === 'css' 
                ? await this.minifyCSS(content) 
                : await this.minifyJS(content);

            await Bun.write(cachePath, minified);
            console.log(`[Cache] Minified and saved: ${cachePath}`);
        }

        return webPath;
    }

    /**
     * Helper to minify HTML content.
     */
    private async minifyHTML(html: string): Promise<string> {
        return await minify(html, {
            collapseWhitespace: true,
            removeComments: true,
            minifyJS: true,
            minifyCSS: true,
            processConditionalComments: true,
            removeAttributeQuotes: false,
            removeEmptyAttributes: true
        });
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

    private cleanPath(path: string): string {
        let result = path.replace(/^file:\/\/\/?/, '');
        
        if (process.platform === 'win32') {
            result = result.replace(/^\/([A-Z]:)/i, '$1');
            result = result.replace(/\\/g, '/');
        }
        
        return result;
    }
}