import MessageHandler from "./MessageHandler.js";
import Message from "../Message.js";

export default class InfoMessageHandler extends MessageHandler {
    /**
     * @inheritDoc
     */
    async handleMessage(ws, message) {
        let data = message.getData();
        if (typeof data.id !== 'string' || data.id.length !== 16) {
            return message.respondError('Invalid party ID');
        }

        let party = await this.server.watchPartyManager.getParty(data.id);
        if (!party) {
            return message.respondError('Party not found');
        }

        // Optionally check if a secret is still valid
        if (typeof data.secret === 'string' && data.secret !== party.secret) {
            return message.respondError('Invalid party secret');
        }

        return message.respond(party.serializeStatus());
    }

    /**
     * @inheritDoc
     */
    handlesType(type) {
        return type === 'info';
    }
}
