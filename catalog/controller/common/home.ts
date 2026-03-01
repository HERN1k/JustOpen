// Developed by Hirnyk Vlad (HERN1k)

import { Controller } from "../../../system/core/controller";
import type { Registry } from "../../../system/core/registry";

export class HomeController extends Controller {
    constructor(registry: Registry) {
        super(registry);
    }

    public async index(): Promise<void | string> {
        this.setPageData({ title: 'Головна' });

        this.components.set('header', await this.loadView('common/header'));
        this.components.set('footer', await this.loadView('common/footer'));

        // return await this.configureContent('common/home'); // for under controller

        await this.configurePage('common/home');
    }
}