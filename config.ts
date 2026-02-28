// Developed by Hirnyk Vlad (HERN1k)

import { join } from 'path';
import { DBDriverName } from './system/core/db';

export const ROOT_DIR: string = process.cwd();

export const APP_PORT: number = 31415;

export const CUSTOMERS_DIR: string = 'catalog';
export const ADMIN_DIR: string = 'admin';

export const DIR_CONTROLLERS: string = join(ROOT_DIR, `${CUSTOMERS_DIR}/controller`);
export const DIR_MODELS: string = join(ROOT_DIR, `${CUSTOMERS_DIR}/model`);
export const DIR_VIEW: string = join(ROOT_DIR, `${CUSTOMERS_DIR}/view`);

export const ADMIN_DIR_CONTROLLERS: string = join(ROOT_DIR, `${ADMIN_DIR}/controller`);
export const ADMIN_DIR_MODELS: string = join(ROOT_DIR, `${ADMIN_DIR}/model`);
export const ADMIN_DIR_VIEW: string = join(ROOT_DIR, `${ADMIN_DIR}/view`);

export const BASE_URL: string = 'http://localhost';
export const ADMIN_BASE_URL: string = `${BASE_URL}${ADMIN_DIR}`;

export const DB_DRIVER: DBDriverName = DBDriverName.MySQL;
export const DB_CONFIG: string = '';