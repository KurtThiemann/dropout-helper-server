import MessageHandler from "./MessageHandler.js";
import WatchParty from "../../WatchParty/WatchParty.js";

export default class CreateMessageHandler extends MessageHandler {
    /**
     * @inheritDoc
     */
    async handleMessage(ws, message) {
        let data = message.getData();
        let party = new WatchParty(this.server.watchPartyManager).init();
        if (!party.updateStatus(data, true)) {
            return message.respondError('Failed to create party');
        }
        await this.server.watchPartyManager.saveParty(party);

        console.log(`Created party ${party.id}`);
        return message.respond(party.serialize());
    }

    /**
     * @inheritDoc
     */
    handlesType(type) {
        return type === 'create';
    }
}
