import MessageHandler from "./MessageHandler.js";

export default class PingMessageHandler extends MessageHandler {
    /**
     * @inheritDoc
     */
    async handleMessage(ws, message) {
        return message.respond({});
    }

    /**
     * @inheritDoc
     */
    handlesType(type) {
        return type === 'ping';
    }
}
