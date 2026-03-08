import type { IConfig } from "./types";

export class Config {
    private settings: IConfig;

    constructor() {
        this.settings = {
            theme: 'theme',
            lang: 'uk'
        };
    }

    public get<T = any>(key: string): T {
        const keys = key.split('.');
        let result: any = this.settings;

        for (const k of keys) {
            if (result && Object.prototype.hasOwnProperty.call(result, k)) {
                result = result[k];
            } else {
                return undefined as T;
            }
        }

        return result as T;
    }
};