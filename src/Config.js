import fs from "node:fs";

export default class Config {
    /** @type {this} */ static instance;
    /** @type {Object} */ redisOptions = {}
    /** @type {?string} */ keyFile = null;
    /** @type {?string} */ certFile = null;
    /** @type {number} */ port = 3000;
    /** @type {?string} */ socket = null;

    /**
     * @returns {Promise<Config>}
     */
    static async get() {
        if (this.instance) {
            return this.instance;
        }
        let config = JSON.parse(await fs.promises.readFile(new URL('../config.json', import.meta.url), 'utf8'));
        return this.instance = Object.assign(new this(), config);
    }
}
