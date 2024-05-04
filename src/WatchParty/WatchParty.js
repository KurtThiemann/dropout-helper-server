import {EventEmitter} from "events";
import crypto from "node:crypto";
import WatchPartyEvent from "./WatchPartyEvent.js";
import Stats from "./Stats/Stats.js";
import StatsCollector from "./Stats/StatsCollector.js";

export default class WatchParty extends EventEmitter {
    /** @type {string} */ secret;
    /** @type {string} */ id;
    /** @type {string} */ url;
    /** @type {number} */ time = 0;
    /** @type {number} */ lastUpdate = Date.now();
    /** @type {number} */ speed = 1;
    /** @type {boolean} */ playing = true;

    /** @type {StatsCollector} */ statsCollector;
    /** @type {WatchPartyManager} */ manager;
    /** @type {?Function} */ _handleUpdate = null;

    /**
     * @param {WatchPartyManager} manager
     */
    constructor(manager) {
        super();
        this.manager = manager;
        this.statsCollector = new StatsCollector();
    }

    /**
     * @returns {WatchParty}
     */
    init() {
        this.secret = crypto.randomBytes(24).toString('hex');
        this.id = crypto.randomBytes(8).toString('hex');
        return this;
    }

    /**
     * @param {Object} obj
     * @param {boolean} initial
     * @returns {boolean}
     */
    updateStatus(obj, initial = false) {
        if (
            typeof obj.url !== 'string' ||
            typeof obj.time !== 'number' ||
            typeof obj.speed !== 'number' ||
            typeof obj.playing !== 'boolean'
        ) {
            return false;
        }

        if (!initial && obj.secret !== this.secret) {
            return false;
        }

        if (obj.url.length > 1024) {
            return false;
        }

        let url;
        try {
            url = new URL(obj.url);
        } catch (e) {
            return false;
        }

        if (!/^(.*\.)?dropout\.tv$/.test(url.hostname)) {
            return false;
        }

        this.url = obj.url;
        this.time = obj.time;
        this.speed = obj.speed;
        this.playing = obj.playing;
        this.lastUpdate = Date.now();
        return true;
    }

    /**
     * @returns {number}
     */
    getTime() {
        let time = this.time;
        if (this.playing) {
            time += (Date.now() - this.lastUpdate) / 1000 * this.speed;
        }
        return time;
    }

    /**
     * @returns {Object}
     */
    serialize() {
        return {
            id: this.id,
            url: this.url,
            time: this.time,
            speed: this.speed,
            playing: this.playing,
            stats: this.statsCollector.getTotal(),
            secret: this.secret
        };
    }

    /**
     * @returns {Object}
     */
    serializeStatus() {
        return {
            id: this.id,
            url: this.url,
            time: this.getTime(),
            speed: this.speed,
            playing: this.playing,
            stats: this.statsCollector.getTotal(),
        }
    }

    /**
     * @returns {Promise<this>}
     */
    async subscribe() {
        this._handleUpdate = this.handleUpdate.bind(this);
        await this.manager.subscribe(this.id, this._handleUpdate);
        return this;
    }

    /**
     * @returns {Promise<this>}
     */
    async unsubscribe() {
        if (!this._handleUpdate) {
            return this;
        }
        await this.manager.unsubscribe(this.id, this._handleUpdate);
        return this;
    }

    /**
     * @param {string} message
     */
    handleUpdate(message) {
        let event = WatchPartyEvent.fromJSON(message);
        if (event.getType() === 'stats') {
            this.statsCollector.update(Object.assign(new Stats(), event.getData()));
            this.emit('stats', this, this.statsCollector.getTotal());
            return;
        }

        if (event.getType() === 'status') {
            Object.assign(this, event.getData());
            this.lastUpdate = Date.now();
            this.emit('update', this, this.serializeStatus());
        }
    }
}
