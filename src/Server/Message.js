export default class Message {
    /** @type {string} */ type;
    /** @type {Object} */ data;
    /** @type {string} */ id;

    /**
     * @param {string} json
     * @returns {Message}
     */
    static parse(json) {
        if (typeof json !== 'string' || json.length > 2048) {
            throw new Error('Invalid message JSON');
        }
        let obj = JSON.parse(json);
        if (typeof obj.type !== 'string') {
            throw new Error('Invalid message type');
        }
        if (typeof obj.data !== 'object') {
            throw new Error('Invalid message data');
        }
        if (typeof obj.id !== 'string') {
            throw new Error('Invalid message id');
        }
        return new this(obj.type, obj.data, obj.id);
    }

    /**
     * @param {string} type
     * @param {Object} data
     * @param {?string} id
     */
    constructor(type, data = {}, id = null) {
        this.type = type;
        this.data = data;
        this.id = id ?? (Math.random() + 1).toString(36).substring(7);
    }

    /**
     * @returns {Object}
     */
    getData() {
        return this.data;
    }

    /**
     * @returns {string}
     */
    getId() {
        return this.id;
    }

    /**
     * @returns {string}
     */
    getType() {
        return this.type;
    }

    /**
     * @param {Object} data
     * @param {?string} error
     * @returns {Message}
     */
    respond(data = {}, error = null) {
        return new this.constructor('response', {response: data, error: error}, this.getId());
    }

    /**
     * @param {string} error
     * @returns {Message}
     */
    respondError(error) {
        return this.respond({}, error);
    }

    toJSON() {
        return {
            type: this.type,
            data: this.data,
            id: this.id
        };
    }
}
