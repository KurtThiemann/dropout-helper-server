export default class WatchPartyEvent {
    /** @type {string} */ type;
    /** @type {Object} */ data;

    /**
     * @param {string} json
     * @returns {WatchPartyEvent}
     */
    static fromJSON(json) {
        let parsed = JSON.parse(json);
        return new WatchPartyEvent(parsed.type, parsed.data);
    }

    /**
     * @param {string} type
     * @param {Object} data
     */
    constructor(type, data) {
        this.type = type;
        this.data = data;
    }

    /**
     * @returns {string}
     */
    getType() {
        return this.type;
    }

    /**
     * @returns {Object}
     */
    getData() {
        return this.data;
    }

    toJSON() {
        return {
            type: this.type,
            data: this.data
        };
    }
}
