// Developed by Hirnyk Vlad (HERN1k)

import { Controller } from "../../../system/core/controller";
import type { Registry } from "../../../system/core/registry";

export class NotFoundController extends Controller {
    constructor(registry: Registry) {
        super(registry);
    }

    async index() {
        this.setPageData({ title: 'ADMIN Error 404' });

        this.components.set('header', await this.loadView('common/header'));
        this.components.set('footer', await this.loadView('common/footer'));

        // return await this.configureContent('common/home'); // for under controller
        
        await this.configurePage('error/not_found');
    }
}