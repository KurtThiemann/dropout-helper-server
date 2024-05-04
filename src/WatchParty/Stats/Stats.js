export default class Stats {
    /** @type {string} */ instanceId;
    /** @type {number} */ viewers = 0;
    /** @type {number} */ createTime = Date.now();

    /**
     * @param {Stats[]|Iterator<Stats>} stats
     * @returns {Stats}
     */
    static combine(stats) {
        let result = new Stats();
        for (let stat of stats) {
            result.viewers += stat.viewers;
        }
        return result;
    }

    /**
     * @returns {string}
     */
    getInstanceId() {
        return this.instanceId;
    }

    toJSON() {
        return {
            instanceId: this.instanceId,
            viewers: this.viewers
        };
    }
}
