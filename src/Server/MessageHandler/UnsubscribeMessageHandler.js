import MessageHandler from "./MessageHandler.js";

export default class UnsubscribeMessageHandler extends MessageHandler {
    /**
     * @inheritDoc
     */
    async handleMessage(ws, message) {
        let data = message.getData();
        if (typeof data.id !== 'string' || data.id.length !== 16) {
            return message.respondError('Invalid party ID');
        }
        if (!await this.server.unsubscribe(ws, data.id)) {
            return message.respondError('Failed to leave party');
        }

        return message.respond({id: data.id});
    }

    /**
     * @inheritDoc
     */
    handlesType(type) {
        return type === 'unsubscribe';
    }
}
