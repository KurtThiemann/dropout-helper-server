export default class Subscription {
    /** @type {WatchParty} */ watchParty;
    /** @type {Set<WebSocket>} */ sockets = new Set();

    /**
     * @param {WatchParty} watchParty
     */
    constructor(watchParty) {
        this.watchParty = watchParty;
    }
}
