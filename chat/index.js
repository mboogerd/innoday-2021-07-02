const IpfsClient = require("ipfs-http-client");
const OrbitDB = require("orbit-db");
const readline = require("readline");

const options = {
  // Setup write access
  accessController: {
    write: ["*"],
  },
};

var activeChannel = undefined;

const orbitDBFolder = process.argv[2] || "client";
const ipfsPort = process.argv[3] || 5001;
const ipfs = IpfsClient.create(`http://localhost:${ipfsPort}`);

OrbitDB.createInstance(ipfs, { directory: orbitDBFolder }).then(
  async (orbitdb) => {
    systemLog("Connected to OrbitDB");

    const channels = await orbitdb.keyvalue(
      "/orbitdb/zdpuArTZLKcyAA984iHhoaTFNARQTcxnaXJa4J8gNnsxtXXQS/channels",
      options
    );
    await channels.load();

    // await channels.put("_", { lastOnline: process.argv[2] });
    // console.log(channels.address.toString());

    const rl = readline.createInterface(process.stdin);

    rl.on("line", async (message) => {
      const command = message.split(" ")[0];
      switch (command) {
        case "/join": {
          const channelName = getChannel(message);
          await join(orbitdb, channels, channelName);
          break;
        }
        case "/create": {
          const channelName = getChannel(message);
          await create(orbitdb, channels, channelName);
          break;
        }
        case "/leave": {
          await leave();
          break;
        }
        case "/list": {
          list(channels);
          break;
        }
        case "/delete": {
          deleteChannel(channels, getChannel(message));
          break;
        }
        case "/whereami": {
          if (activeChannel) {
            systemLog(`You are in: ${activeChannel.address.path}`);
          } else {
            systemLog("You are in the lobby");
          }
          break;
        }
        case "/peers": {
          if (activeChannel) {
            const peers = await ipfs.pubsub.peers(
              activeChannel.address.toString()
            );
            systemLog("Peers:");
            console.log(peers);
          } else {
            console.log("Please join a channel first");
          }
          break;
        }
        case "/shrug": {
          if (activeChannel) {
            activeChannel.add(
              `${new Date().toUTCString()} - [${
                process.env["USER"]
              }]: ¯\\_(ツ)_/¯`
            );
          } else {
            systemLog("You are only allowed to shrug in a channel");
          }
          break;
        }
        case "/debug": {
          printDebugInfo(ipfs, orbitdb);
          break;
        }
        default: {
          if (message.startsWith("/")) {
            systemLog(`I don't understand ${message}`);
            break;
          } else if (activeChannel) {
            activeChannel.add(
              `${new Date().toUTCString()} - [${
                process.env["USER"]
              }]: ${message}`
            );
          } else {
            systemLog("You're not in a channel, dude");
          }
        }
      }
    });
  }
);

const getChannel = (message) => message.split(" ")[1];

const join = async (orbitdb, channels, channelName) => {
  if (activeChannel) {
    await leave(activeChannel);
  }

  const foundChannel = await channels.get(channelName);
  if (foundChannel) {
    systemLog(`Joining ${foundChannel.address}`);

    activeChannel = await orbitdb.log(foundChannel.address, options);
    await activeChannel.load();

    activeChannel.add(`${process.env["USER"]} joined ${foundChannel.address}`);

    activeChannel.events.on(
      "replicate",
      (address, entry) => entry.payload && console.log(entry.payload.value)
    );

    activeChannel.events.on("log.op.ADD", (id, hash, payload) =>
      console.log(`${payload?.value}`)
    );
  } else {
    systemLog(`Channel ${channelName} does not exist`);
  }
};

const create = async (orbitdb, channels, channelName) => {
  const newChannel = await orbitdb.log(channelName, options);

  await channels.put(channelName, {
    address: newChannel.address.toString(),
  });

  systemLog(`Created channel: ${newChannel.address}`);
  await join(orbitdb, channels, channelName);
};

const list = async (channels) => {
  const allChannels = await channels.all;
  systemLog("Current channels:");
  console.log(allChannels);
};

const leave = async () => {
  if (activeChannel) {
    systemLog(`Leaving ${activeChannel.address.path}`);
    await activeChannel.add(
      `${process.env["USER"]} left ${activeChannel.address}`
    );
    await activeChannel.close();
    activeChannel = undefined;
  }
};

const deleteChannel = async (channels, channelName) => {
  await channels.del(channelName);
};

const printDebugInfo = async (ipfs, orbitdb) => {
  systemLog(`My IPFS Identity:    `, (await ipfs.id()).id);
  systemLog(`My Swarm address:    `, ipfs.swarm.address);
  systemLog(`My OrbitDB identity: `, orbitdb.identity.id);
  systemLog(`Swarm peers:         `, await ipfs.swarm.peers());
  systemLog(`Pubsub topics:       `, await ipfs.pubsub.ls());
};

const systemLog = (msg, other) =>
  other
    ? console.log(`[system] ${msg}`, other)
    : console.log(`[system] ${msg}`);
