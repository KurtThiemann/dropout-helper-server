import MessageHandler from "./MessageHandler.js";
import Message from "../Message.js";

export default class SubscribeMessageHandler extends MessageHandler {
    /**
     * @inheritDoc
     */
    async handleMessage(ws, message) {
        let data = message.getData();
        if (typeof data.id !== 'string' && data.id.length !== 16) {
            return message.respondError('Invalid party ID');
        }
        if (!await this.server.subscribe(ws, data.id)) {
            return message.respondError('Failed to join party');
        }
        let res = [message.respond({id: data.id})];
        let party = this.server.subscriptions.get(data.id)?.watchParty;
        if (party) {
            res.push(new Message('status', party.serializeStatus()));
        }

        return res;
    }

    /**
     * @inheritDoc
     */
    handlesType(type) {
        return type === 'subscribe';
    }
}
