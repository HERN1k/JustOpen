CREATE TABLE IF NOT EXISTS setting (
    setting_id INTEGER PRIMARY KEY AUTOINCREMENT,
    store_id INTEGER DEFAULT 0,
    `code` TEXT NOT NULL,
    `key` TEXT NOT NULL,
    `value` TEXT NOT NULL,
    serialized INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS user (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_group_id INTEGER NOT NULL,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    firstname TEXT NOT NULL,
    lastname TEXT NOT NULL,
    email TEXT NOT NULL,
    image TEXT DEFAULT NULL,
    code TEXT DEFAULT NULL,
    ip TEXT DEFAULT NULL,
    status INTEGER DEFAULT 0,
    date_added DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_group (
    user_group_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    permission TEXT
);

CREATE TABLE IF NOT EXISTS language (
    language_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    locale TEXT NOT NULL,
    image TEXT DEFAULT NULL,
    directory TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    status INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS extension (
    extension_id INTEGER PRIMARY KEY AUTOINCREMENT,
    `type` TEXT NOT NULL,
    `code` TEXT NOT NULL
);

INSERT INTO user_group (name, permission) VALUES ('Administrator', '{"access": ["*"], "modify": ["*"]}');

INSERT INTO user (user_group_id, username, password, firstname, lastname, email, status) 
VALUES (1, 'admin', '$2b$10$e9S8.V.P1.K.vG9Z9Z9Z9O', 'System', 'Admin', 'admin@localhost', 1);

INSERT INTO language (name, code, locale, directory, sort_order) 
VALUES ('English', 'en', 'en_US.UTF-8,en_US,en-gb', 'english', 1);

INSERT INTO setting (`code`, `key`, `value`) VALUES ('config', 'config_name', 'JustOpen CMS');