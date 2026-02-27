// Developed by Hirnyk Vlad (HERN1k)

import { Controller } from "../../../system/core/controller";

export class NotFoundController extends Controller {
    async index() {
        this.response.setOutput('<h2>ADMIN 404 Not found!</h2>');
    }
}