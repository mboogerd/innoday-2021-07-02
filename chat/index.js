const IpfsClient = require("ipfs-http-client");
const OrbitDB = require("orbit-db");
const readline = require("readline");

const ipfs = IpfsClient.create("http://localhost:5001");

const options = {
  // Setup write access
  accessController: {
    write: [
      "033eda95ba4c528875c692c4c7f267b51bc42807a289f1657c23594c37e5b2fcd6", // Merlijn
      "03990f6dabfd6d20a1cae72d22262089429659fdc885b8c45dc42572984b891fd8", // Leon
      "0258983317361a634a310b5f96aa66e772f834844db4e978b505e0bffac66677f1", // Arjan
      "03bd95a4b1d91681648bfb1a9f7554ce9d14c1cf6290d8804d685f20963c80d7cc", // Jethro
      "02509fcf34235a01a5ce87e0efae80656a85b813918040a32d32652e2ae295ea52", // Matthijs
      "03a6f45b10945223b9472c3b9973897e8fe94c4684d3105ee6084688524145502e", // Jan
      // "*", // everybody!
    ],
  },
};

OrbitDB.createInstance(ipfs).then(async (orbitdb) => {
  systemLog("Connected to OrbitDB");
  systemLog(`My identity: ${orbitdb.identity.id}`);

  const channels = await orbitdb.keyvalue(
    "/orbitdb/zdpuAuBYiKzBeebGAsfWLFBKonJuA5QzhFLfNr4Z6S12aWXkf/channels",
    options
  );

  var activeChannel = undefined;

  const rl = readline.createInterface(process.stdin);

  rl.on("line", async (message) => {
    const command = message.split(" ")[0];
    switch (command) {
      case "/join": {
        if (activeChannel) {
          await leave(activeChannel);
          activeChannel = undefined;
        }

        const channelName = getChannel(message);
        const foundChannel = await channels.get(channelName);
        if (foundChannel) {
          activeChannel = await join(orbitdb, foundChannel.address);
        } else {
          systemLog(`Channel ${channelName} does not exist`);
        }
        break;
      }
      case "/create": {
        const channelName = getChannel(message);
        const newChannel = await orbitdb.log(channelName, options);
        const hash = await channels.put(channelName, {
          address: newChannel.address.toString(),
        });
        systemLog(`Created channel: ${newChannel.address}`);
        activeChannel = await join(orbitdb, newChannel.address);
        break;
      }
      case "/leave": {
        await leave(activeChannel);
        activeChannel = undefined;
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
          systemLog(`You are in: ${activeChannel.address.path}`)
        } else {
          systemLog("You are in the lobby")
        }
        break;
      }
      default: {
        if (message.startsWith("/")) {
          systemLog(`I don't understand ${message}`);
          break;
        } else if (activeChannel) {
          activeChannel.add(`[${process.env["USER"]}]: ${message}`);
        } else {
          systemLog("You're not in a channel, dude");
        }
      }
    }
  });
});

const getChannel = (message) => message.split(" ")[1];

const join = async (orbitdb, channelAddress) => {
  systemLog(`Joining ${channelAddress}`);

  const activeChannel = await orbitdb.log(channelAddress, options);
  await activeChannel.load();

  activeChannel.add(`${process.env["USER"]} joined ${channelAddress}`);

  activeChannel.events.on(
    "replicate",
    (address, entry) => entry.payload && console.log(entry.payload.value)
  );

  activeChannel.events.on("log.op.ADD", (id, hash, payload) =>
    console.log(`${payload?.value}`)
  );

  return activeChannel;
};

const list = async (channels) => {
  const allChannels = await channels.all;
  systemLog("Current channels:");
  console.log(allChannels);
};

const leave = async (activeChannel) => {
  systemLog(`Leaving ${activeChannel.address.path}`)
  await activeChannel.close();
};

const deleteChannel = async (channels, channelName) => {
  await channels.del(channelName);
};

const systemLog = (msg) => console.log(`[system] ${msg}`)