// Developed by Hirnyk Vlad (HERN1k)

import { Controller } from "../../../system/core/controller";
import type { Registry } from "../../../system/core/registry";

export class HomeController extends Controller {
    constructor(registry: Registry) {
        super(registry);
    }

    public async index(): Promise<void | string> {
        this.setPageData({ title: 'Main page' });

        this.setStyles('css/main.css');
        this.setScript('js/main.js');

        this.components['gallery'] = await this.loadView('extension/module/slider', {
            'images': [
                "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
                "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=80",
                "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=80",
                "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=80",
                "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&w=1200&q=80",
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