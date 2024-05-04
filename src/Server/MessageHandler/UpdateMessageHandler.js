import MessageHandler from "./MessageHandler.js";

export default class UpdateMessageHandler extends MessageHandler {
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
        if (!party.updateStatus(data)) {
            return message.respondError('Failed to update party');
        }
        await this.server.watchPartyManager.saveParty(party);

        return message.respond({id: party.id});
    }

    /**
     * @inheritDoc
     */
    handlesType(type) {
        return type === 'update';
    }
}
