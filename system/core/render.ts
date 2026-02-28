// Developed by Hirnyk Vlad (HERN1k)

import { renderToString } from "react-dom/server";
import { minify } from "html-minifier-terser";
import { createElement, Fragment } from "react";
import type { ComponentType, ReactNode } from "react";
import type { Registry } from "./registry";
import { StringHelper } from "../helper/string";
import { pathToFileURL } from "node:url";
import type { ComponentBlock } from "./types";

/**
 * Core Rendering Engine.
 * Now instance-based to support one-instance-per-request pattern.
 */
export class Render {
    private registry: Registry;
    private slots: Map<string, ComponentBlock[]> = new Map(); 
    private pageData: Record<string, any> = {};
    private layout: ComponentType<any> | null = null;

    constructor(registry: Registry) {
        this.registry = registry;
    }

    /**
     * Set the main Layout for this specific request.
     */
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

    /**
     * Set data for this specific request.
     */
    public setPageData(data: Record<string, any>): void {
        this.pageData = { ...this.pageData, ...data };
    }

    /**
     * Add a block to a slot for this specific request.
     */
    public addBlock(slot: string, component: ComponentType<any> | null | undefined, props: any = {}, priority: number = 100): void {
        if (component) {
            if (!this.slots.has(slot)) {
                this.slots.set(slot, []);
            }

            this.slots.get(slot)?.push({ component, props, priority });
            this.slots.get(slot)?.sort((a, b) => a.priority - b.priority);
        }
    }

    /**
     * Render a slot into a React fragment.
     */
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
    }

    /**
     * Build the final minified HTML.
     */
    public async build(): Promise<string> {
        if (!this.layout) {
            await this.setLayout('theme');
        }

        const pageElement = createElement(this.layout!, {
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
}