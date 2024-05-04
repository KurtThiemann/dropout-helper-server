import out from "./src/out.js";
import Config from "./src/Config.js";
import WatchPartyManager from "./src/WatchParty/WatchPartyManager.js";
import Server from "./src/Server/Server.js";

out();

let config = await Config.get();

console.log('Starting watch party manager...');
let watchPartyManager = new WatchPartyManager(config);
watchPartyManager.on('redis-error', err => console.error(err));
await watchPartyManager.init();

console.log('Starting server...');
let server = new Server(config, watchPartyManager);
await server.init();
