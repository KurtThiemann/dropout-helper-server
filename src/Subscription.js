import Stats from "./WatchParty/Stats/Stats.js";

export default class Subscription {
    /** @type {string} */ instanceId;
    /** @type {WatchParty} */ watchParty;
    /** @type {Set<WebSocket>} */ sockets = new Set();

    /**
     * @param {string} instanceId
     * @param {WatchParty} watchParty
     */
    constructor(instanceId, watchParty) {
        this.instanceId = instanceId;
        this.watchParty = watchParty;
    }

    /**
     * Collect stats from this subscription instance
     *
     * @returns {Stats}
     */
    collectStats() {
        let stats = new Stats();
        stats.instanceId = this.instanceId;
        stats.viewers = this.sockets.size;
        return stats;
    }
}
