import https from "https";
import http from "http";
import {WebSocketServer} from 'ws';
import fs from "node:fs";
import {EventEmitter} from "events";
import Subscription from "../Subscription.js";
import CreateMessageHandler from "./MessageHandler/CreateMessageHandler.js";
import PingMessageHandler from "./MessageHandler/PingMessageHandler.js";
import SubscribeMessageHandler from "./MessageHandler/SubscribeMessageHandler.js";
import UnsubscribeMessageHandler from "./MessageHandler/UnsubscribeMessageHandler.js";
import UpdateMessageHandler from "./MessageHandler/UpdateMessageHandler.js";
import Message from "./Message.js";
import InfoMessageHandler from "./MessageHandler/InfoMessageHandler.js";

export default class Server extends EventEmitter {
    /** @type {import("../Config.js").default} */ config;
    /** @type {http.Server} */ webServer;
    /** @type {WatchPartyManager} */ watchPartyManager;
    /** @type {import("ws").WebSocketServer} */ wsServer;
    /** @type {Map<string, Subscription>} */ subscriptions = new Map();
    /** @type {MessageHandler[]} */ messageHandlers = [
        new CreateMessageHandler(this),
        new PingMessageHandler(this),
        new SubscribeMessageHandler(this),
        new UnsubscribeMessageHandler(this),
        new UpdateMessageHandler(this),
        new InfoMessageHandler(this)
    ];

    /**
     * @param {import("../Config.js").default} config
     * @param {WatchPartyManager} watchPartyManager
     */
    constructor(config, watchPartyManager) {
        super();
        this.config = config;
        this.watchPartyManager = watchPartyManager;
    }

    async init() {
        let httpImplementation = http;
        let keyFile = null, certFile = null;
        if (this.config.keyFile && this.config.certFile) {
            keyFile = new URL(this.config.keyFile, new URL('../', import.meta.url));
            certFile = new URL(this.config.certFile, new URL('../', import.meta.url));
            httpImplementation = https;
        }

        this.webServer = httpImplementation.createServer({
            key: keyFile ? await fs.promises.readFile(keyFile) : undefined,
            cert: certFile ? await fs.promises.readFile(certFile) : undefined
        }, this.handleRequest.bind(this));

        let port = this.config.port;
        let socket = null;
        if (this.config.socket) {
            let socketPath = this.config.socket.replace('{{instance}}', process.env.NODE_APP_INSTANCE ?? 0);
            await fs.promises.unlink(socketPath).catch(() => {});
            socket = socketPath;
        }

        this.wsServer = new WebSocketServer({server: this.webServer});
        this.wsServer.on('connection', this.handleConnection.bind(this));
        await new Promise((resolve, reject) => {
            this.webServer.on('error', reject);
            this.webServer.listen(socket ?? port, () => {
                this.webServer.off('error', reject);
                resolve();
            });
        });

        if (socket) {
            await fs.promises.chmod(socket, 0o777);
        }

        console.log('Server listening on', socket ?? port);
        this.emit('listening', socket ?? port);
    }

    /**
     * @param {http.IncomingMessage} req
     * @param {http.ServerResponse} res
     * @returns {Promise<void>}
     */
    async handleRequest(req, res) {
        res.writeHead(404);
        res.end();
    }

    /**
     * @param {WatchParty} party
     * @param {Object} status
     * @returns {Promise<void>}
     */
    async handlePartyUpdate(party, status) {
        let subscription = this.subscriptions.get(party.id);
        if (!subscription) {
            return;
        }
        let statusMessage = JSON.stringify(new Message('status', status));
        for (let ws of subscription.sockets) {
            if (ws.readyState === ws.OPEN) {
                ws.send(statusMessage);
            }
        }
    }

    /**
     * @param {WebSocket} ws
     * @param {string} id
     * @returns {Promise<boolean>}
     */
    async subscribe(ws, id) {
        let subscription = this.subscriptions.get(id);
        if (!subscription) {
            let party = await this.watchPartyManager.getParty(id);
            if (!party) {
                return false;
            }
            party.on('update', this.handlePartyUpdate.bind(this));
            await party.subscribe();
            subscription = new Subscription(party);
            this.subscriptions.set(id, subscription);
        }
        this.emit('subscribed', id, ws);
        console.log(`Client subscribed to ${id}`);
        subscription.sockets.add(ws);
        return true;
    }

    /**
     * @param {WebSocket} ws
     * @param {string} id
     * @returns {Promise<boolean>}
     */
    async unsubscribe(ws, id) {
        let subscription = this.subscriptions.get(id);
        if (!subscription) {
            return false;
        }
        subscription.sockets.delete(ws);
        if (subscription.sockets.size === 0) {
            this.subscriptions.delete(id);
            await subscription.watchParty.unsubscribe();
        }
        this.emit('unsubscribed', id, ws);
        console.log(`Client unsubscribed from ${id}`);
        return true;
    }

    /**
     * @param {import("ws").WebSocket} ws
     * @returns {Promise<void>}
     */
    async handleConnection(ws) {
        ws.on('error', () => ws.close());
        ws.on('message', async message => await this.handleMessage(ws, message));
        ws.on('close', async () => {
            for (let [id, subscription] of this.subscriptions) {
                if (subscription.sockets.has(ws)) {
                    console.log('Client disconnected');
                    await this.unsubscribe(ws, id);
                }
            }
        });
    }

    /**
     * @param {WebSocket} ws
     * @param {string|Buffer} message
     * @returns {Promise<void>}
     */
    async handleMessage(ws, message) {
        if (message instanceof Buffer) {
            message = message.toString();
        }

        let parsed;
        try {
            parsed = Message.parse(message);
        } catch (e) {
            return;
        }

        let responses;
        for (let handler of this.messageHandlers) {
            if (!handler.handlesType(parsed.getType())) {
                continue;
            }
            responses = await handler.handleMessage(ws, parsed);
            break;
        }

        if (responses === null) {
            return;
        }
        if (!Array.isArray(responses)) {
            responses = [responses];
        }

        for (let response of responses) {
            ws.send(JSON.stringify(response));
        }
    }
}
