export default class MessageHandler {
    /** @type {Server} */ server;

    /**
     * @param server
     */
    constructor(server) {
        this.server = server;
    }

    /**
     * @param {string} type
     * @returns {boolean}
     * @abstract
     */
    handlesType(type) {
        return false;
    }

    /**
     * @param {import("ws").WebSocket} ws
     * @param {Message} message
     * @returns {Promise<null|Message|Message[]>}
     * @abstract
     */
    async handleMessage(ws, message) {

    }
}
