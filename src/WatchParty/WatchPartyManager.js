import {createClient} from 'redis';
import {EventEmitter} from "events";
import WatchParty from "./WatchParty.js";

export default class WatchPartyManager extends EventEmitter {
    static prefix = 'dropout_party_';

    /** @type {import("../Config.js").default} */ config;
    /** @type {import("redis").RedisClient} */ redis;
    /** @type {import("redis").RedisClient} */ subscriber;
    /** @type {import("redis").RedisClient} */ publisher;

    /**
     * @param {import("../Config.js").default} config
     */
    constructor(config) {
        super();
        this.config = config;
    }

    async init() {
        this.redis = await createClient(this.config.redisOptions)
            .on('error', err => this.emit('redis-error', err))
            .connect();
        this.subscriber = await this.redis.duplicate()
            .on('error', err => this.emit('redis-error', err))
            .connect();
        this.publisher = await this.redis.duplicate()
            .on('error', err => this.emit('redis-error', err))
            .connect();
    }

    /**
     * @param {string} id
     * @returns {Promise<?WatchParty>}
     */
    async getParty(id) {
        let party = await this.redis.get(WatchPartyManager.prefix + id);
        if (!party) {
            return null;
        }
        return Object.assign(new WatchParty(this), JSON.parse(party));
    }

    /**
     * @param {WatchParty} party
     * @returns {Promise<this>}
     */
    async saveParty(party) {
        let status = JSON.stringify(party.serialize());
        await this.redis.set(
            WatchPartyManager.prefix + party.id,
            status,
            {EX: 60 * 60 * 24}
        );
        await this.publisher.publish(WatchPartyManager.prefix + party.id, status);
        return this;
    }

    /**
     * @param {string} id
     * @param {Function} callback
     * @returns {Promise<this>}
     */
    async subscribe(id, callback) {
        await this.subscriber.subscribe(WatchPartyManager.prefix + id, callback);
        return this;
    }

    /**
     * @param {string} id
     * @param {Function} listener
     * @returns {Promise<this>}
     */
    async unsubscribe(id, listener) {
        await this.subscriber.unsubscribe(WatchPartyManager.prefix + id, listener);
        return this;
    }
}
