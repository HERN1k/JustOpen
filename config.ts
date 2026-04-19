// Developed by Hirnyk Vlad (HERN1k)

import { join } from 'path';
import { DBDriverName } from './system/core/db';
import type { IDBConfig } from './system/core/types';

export const IS_DEV: boolean = true;

export const ROOT_DIR: string = process.cwd();

export const APP_PORT: number = 31415;
export const DOMAIN: string = `localhost:${APP_PORT}`;

export const CUSTOMERS_DIR: string = 'catalog';
export const ADMIN_DIR: string = 'admin';

export const BASE_URL: string = `http://${DOMAIN}`;
export const ADMIN_BASE_URL: string = `${BASE_URL}${ADMIN_DIR}`;

export const HTTPS_BASE_URL: string = `http://${DOMAIN}`;
export const HTTPS_ADMIN_BASE_URL: string = `${HTTPS_BASE_URL}${ADMIN_DIR}`;

export const DIR_CONTROLLERS: string = join(ROOT_DIR, `${CUSTOMERS_DIR}/controller`);
export const DIR_MODELS: string = join(ROOT_DIR, `${CUSTOMERS_DIR}/model`);
export const DIR_VIEW: string = join(ROOT_DIR, `${CUSTOMERS_DIR}/view`);

export const ADMIN_DIR_CONTROLLERS: string = join(ROOT_DIR, `${ADMIN_DIR}/controller`);
export const ADMIN_DIR_MODELS: string = join(ROOT_DIR, `${ADMIN_DIR}/model`);
export const ADMIN_DIR_VIEW: string = join(ROOT_DIR, `${ADMIN_DIR}/view`);

export const IMAGE_DIR: string = join(ROOT_DIR, 'image');

export const CACHE_DIR: string = join(ROOT_DIR, 'storage/cache');

export const LOGS_DIR: string = join(CACHE_DIR, 'logs');

export const CACHE_IMAGE_DIR: string = join(CACHE_DIR, 'image');

export const DB_PREFIX: string = '';
export const DB_DRIVER: DBDriverName = DBDriverName.SQLite;
export const DB_CONFIG: IDBConfig = { 
    data: {
        dbFilePath: join(ROOT_DIR, 'storage/db/sqlite/master.db')
    }
};
export const DB_MIGRATIONS_DIR: string = join(ROOT_DIR, 'storage/db/migrations');
export const DB_VIEW_ALL_TABLES: boolean = false;