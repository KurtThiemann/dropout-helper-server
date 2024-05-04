import Stats from "./Stats.js";
import crypto from "node:crypto";

export default class StatsCollector {
    /** @type {?Stats} */ total = null;
    /** @type {Map<string, Stats>} */ stats = new Map();

    /**
     * @param {Stats} stats
     * @returns {this}
     */
    update(stats) {
        this.stats.set(stats.getInstanceId(), stats);
        this.updateTotal();
        return this;
    }

    /**
     * @returns {Stats}
     */
    updateTotal() {
        this.total = Stats.combine(this.stats.values());
        return this.total;
    }

    /**
     * @returns {Stats}
     */
    getTotal() {
        if (this.total === null) {
            this.updateTotal();
        }
        return this.total;
    }
}
