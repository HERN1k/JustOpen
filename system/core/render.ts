// Developed by Hirnyk Vlad (HERN1k)

import { renderToString } from "react-dom/server";
import { minify } from "html-minifier-terser";
import { createElement } from "react";
import { StringHelper } from "../helper/string";
import { pathToFileURL } from "node:url";
import type { ComponentType } from "react";
import type { Registry } from "./registry";

/**
 * Core Rendering Engine.
 * Now instance-based to support one-instance-per-request pattern.
 */
export class Render {
    private registry: Registry;
    private pageData: Record<string, any> = {};

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

        const path: string = `${parser.path}/view/${layoutName}/layout.tsx`; // maybe set this in Load class

        try {
            const fileUrl = pathToFileURL(path).href;
            
            const module = await import(fileUrl);
            
            if (typeof module['index'] === 'function') {
                this.registry.get('request').layout = layoutName;

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
    public async build(component: ComponentType<any>, data: Map<string, string>): Promise<string> {
        if (!component) {
            return '';
        }
        
        const getter = (key: string): string => {
            return data.get(key) ?? ''; 
        };

        const rawHTML = renderToString(createElement(component, { data: data, get: getter  }));

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

    /* public async build(component: ComponentType<any>, data: Map<string, string>): Promise<string> {
        if (!this.layout) {
            await this.setLayout('theme');
        }

        const pageElement = createElement(component, {
            ...this.pageData,
            lang: 'ru',
            renderSlot: (name: string) => this.getSlot(name)
        });

        const rawHtml = `<!DOCTYPE html>${renderToString(pageElement)}`;

        return await minify(rawHtml, {
            collapseWhitespace: true,
            removeComments: true,
            minifyJS: true,
            minifyCSS: true,
            processConditionalComments: true,
            removeAttributeQuotes: false,
            removeEmptyAttributes: true
        });
    } 
        
    public async setLayout(layout: string): Promise<void> {
        if (StringHelper.isNullOrWhiteSpace(layout)) {
            console.error(`[ViewLoader] Layout name is empty!`);
            return Promise.resolve();
        }

        const request = this.registry.get('request');
        const parser = request.getParserResult();

        const path: string = `${parser.path}/view/${layout}/layout.tsx`;

        try {
            const fileUrl = pathToFileURL(path).href;
            
            const module = await import(fileUrl);
            const component = module['index'];

            if (typeof component === 'function') {
                this.registry.get('request').layout = layout;
                this.layout = component as ComponentType<any>;
            } else {
                console.error(`[ViewLoader] Export "${layout}" is not a function in ${path}`);
                throw new Error('[Render] Layout not found or invalid!');
            }
        } catch (error) {
            console.error(`[ViewLoader] Critical error loading ${path}:`, error);
        }
    }

    

    public async add(path: string, props?: any): Promise<void> {
        this.addBlockByComponent({
            slot: 'main',
            component: await Load.loadView(this.registry, path),
            props: props
        }); 
    }

    
    public async addBlock(options: RenderPathOptions): Promise<void> {
        this.addBlockByComponent({
            slot: options.slot || 'main',
            component: await Load.loadView(this.registry, options.path),
            props: options.props,
            priority: options.priority || 100
        });
    }

    public addBlockByComponent(options: RenderComponentOptions): void {
        const { 
            component, 
            slot = 'main', 
            props = {}, 
            priority = 100 
        } = options;

        if (component) {
            if (!this.slots.has(slot)) {
                this.slots.set(slot, []);
            }

            this.slots.get(slot)?.push({ component, props, priority });
            this.slots.get(slot)?.sort((a, b) => a.priority - b.priority);
        }
    }

    public getSlot(slotName: string): ReactNode {
        const blocks = this.slots.get(slotName) || [];

        return createElement(
            Fragment,
            null,
            blocks.map((block, index) => 
                createElement(block.component, { 
                    key: `${slotName}_${index}`, 
                    ...this.pageData, 
                    ...block.props 
                })
            )
        );
    } */
}