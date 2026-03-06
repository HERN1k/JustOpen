// Developed by Hirnyk Vlad (HERN1k)

import { renderToString } from "react-dom/server";
import { minify } from "html-minifier-terser";
import { createElement } from "react";
import { StringHelper } from "../helper/string";
import { pathToFileURL } from "node:url";
import { CACHE_DIR } from "../../config";
import { join, parse } from 'path';
import { transformSync } from "@babel/core";
import postcss from "postcss";
import autoprefixer from "autoprefixer";
import { transform } from "lightningcss";
import type { ComponentType } from "react";
import type { Registry } from "./registry";

/**
 * Core Rendering Engine.
 * Now instance-based to support one-instance-per-request pattern.
 */
export class Render {
    private registry: Registry;
    private pageData: Record<string, any> = {
        'css': [],
        'js': []
    };

    constructor(registry: Registry) {
        this.registry = registry;
    }

    /**
     * Set data for this specific request.
     */
    public setPageData(data: Record<string, any>): void {
        this.pageData = { ...this.pageData, ...data };
    }

    public async getPage(content: string): Promise<string> {
        // get layout name from db
        const layoutName: string = 'theme';

        if (StringHelper.isNullOrWhiteSpace(layoutName)) {
            console.error(`[ViewLoader] Layout name is empty!`);
            return '';
        }

        const request = this.registry.get('request');
        const parser = request.getParserResult();

        const path: string = `${parser.path}/view/${layoutName}/layout.tsx`;

        try {
            const fileUrl = pathToFileURL(path).href;
            
            const module = await import(fileUrl);
            
            if (typeof module['index'] === 'function') {
                this.registry.get('request').layout = layoutName;

                this.pageData.css = await Promise.all(
                    (this.pageData.css as Array<string>).map(css => this.processedAsset(css, 'css'))
                );

                this.pageData.js = await Promise.all(
                    (this.pageData.js as Array<string>).map(js => this.processedAsset(js, 'js'))
                );

                const response = createElement(module['index'], {
                    ...this.pageData,
                    lang: 'uk',
                    content
                });

                let rawHTML = renderToString(response);

                if (StringHelper.isNullOrWhiteSpace(rawHTML)) {
                    rawHTML = '<!DOCTYPE html>' + rawHTML;
                }

                return await minify(rawHTML, {
                    collapseWhitespace: true,
                    removeComments: true,
                    minifyJS: true,
                    minifyCSS: true,
                    processConditionalComments: true,
                    removeAttributeQuotes: false,
                    removeEmptyAttributes: true
                });
            } else {
                console.error(`[ViewLoader] Export "${layoutName}" is not a function in ${path}`);
                throw new Error('[Render] Layout not found or invalid!');
            }
        } catch (error) {
            console.error(`[ViewLoader] Critical error loading ${path}:`, error);
        }

        return '';
    }

    /**
     * Build the final minified HTML.
     */
    public async build(component: ComponentType<any>, data: Map<string, any>): Promise<string> {
        if (!component) {
            return '';
        }
        
        const getter = (key: string): string => {
            return data.get(key) ?? ''; 
        };

        const getterAny = (key: string): any => {
            return data.get(key) ?? ''; 
        };

        const rawHTML = renderToString(createElement(component, { data: data, get: getter, any: getterAny }));

        return await minify(rawHTML, {
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
     * Processes and minifies an asset if it's outdated or missing.
     * @param sourcePath Path to the original file (e.g., 'public/css/main.css')
     * @param type 'css' | 'js'
     * @returns Path to the cached/minified file
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
            const minified = type === 'css' ? await this.minifyCSS(content) : await this.minifyJS(content);

            await Bun.write(cachePath, minified);
            console.log(`[Cache] Minified and saved: ${cachePath}`);
        }

        return webPath;
    }
    
    private async minifyCSS(content: string = ''): Promise<string> {
        const postcssResult = await postcss([
            autoprefixer(), 
        ]).process(content, { from: undefined });

        const { code } = transform({
            filename: 'style.css',
            code: Buffer.from(postcssResult.css),
            minify: true,
            targets: {
                safari: (13 << 16),
                ie: (11 << 16)
            }
        });

        return code.toString();
    }

    private async minifyJS(content: string = ''): Promise<string> {
        const babelResult = transformSync(content, {
            presets: [
                ["@babel/preset-env", {
                    targets: "> 0.5%, last 2 versions, Firefox ESR, not dead, not ie 11", 
                    bugfixes: true,
                    modules: false,
                    useBuiltIns: false 
                }]
            ],
            babelrc: false,
            configFile: false,
            compact: true,
            minified: true,
            comments: false
        });

        const codeToMinify = babelResult?.code || content;

        const build = await Bun.build({
            entrypoints: ["./index.ts"],
            naming: "minified.js",
            minify: true,
            plugins: [
                {
                    name: "virtual-entry",
                    setup(build) {
                        build.onLoad({ filter: /.*/ }, () => ({
                            contents: codeToMinify,
                            loader: "js",
                        }));
                    },
                },
            ],
        });

        if (!build.success) {
            console.error("Build error:", build.logs);
            return codeToMinify;
        }

        return await build.outputs[0]?.text() ?? codeToMinify;
    }
}