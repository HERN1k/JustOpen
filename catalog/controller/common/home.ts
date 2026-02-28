// Developed by Hirnyk Vlad (HERN1k)

import { Controller } from "../../../system/core/controller";
import type { Registry } from "../../../system/core/registry";

export class HomeController extends Controller {
    constructor(registry: Registry) {
        super(registry);
    }

    async index() {
        this.render.setPageData({ title: 'Головна' });

        this.render.addBlock('main', await this.loadView('common/home'));

        this.render.addBlock('header', await this.loadView('common/header'), {}, 1);
        this.render.addBlock('footer', await this.loadView('common/footer'), {}, 500);

        this.response.setOutput(await this.render.build());
    }
}