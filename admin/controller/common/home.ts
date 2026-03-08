// Developed by Hirnyk Vlad (HERN1k)

import { Controller } from "../../../system/core/controller";
import type { Registry } from "../../../system/core/registry";
import { Image } from "../../../system/helper/image";

export class HomeController extends Controller {
    constructor(registry: Registry) {
        super(registry);
    }

    public async index(): Promise<void | string> {
        this.setPageData({ title: 'Admin - Main page' });

        this.setStyles('css/main.css');
        this.setScript('js/main.js');

        this.components['gallery'] = await this.loadView('extension/module/slider', {
            'images': [
                await Image.banner('catalog/temp/photo-1.jpg'),
                await Image.banner('catalog/temp/photo-2.avif'),
                await Image.banner('catalog/temp/photo-3.avif'),
                await Image.banner('catalog/temp/photo-4.avif'),
                await Image.banner('catalog/temp/photo-5.avif'),
                await Image.banner('catalog/temp/photo-6.avif'),
                await Image.banner('catalog/temp/photo-0.svg')
            ]
        });

        this.components['header'] = await this.loadView('common/header');
        this.components['footer'] = await this.loadView('common/footer');

        // return await this.configureContent('common/home'); // for under controller

        await this.configurePage('common/home');
    }

    public async get_request(): Promise<void | string> {
        this.JSON(this.request);
    }
}