const IpfsClient = require("ipfs-http-client");
const OrbitDB = require("orbit-db");
const readline = require("readline");

const ipfs = IpfsClient.create("http://localhost:5001");

OrbitDB.createInstance(ipfs).then(async (orbitdb) => {
  console.log("Connected to OrbitDB");
  console.log(`My identity: ${orbitdb.identity.id}`);

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

  // const spawnDB = await orbitdb.log(`chatting-together`, options);
  // console.log(spawnDB.address);

  const db = await orbitdb.log(
    `/orbitdb/zdpuAsyNpbZvcZK4Gwp8CNux5xWZyLkSdLA7qQUseMbzpvNVZ/chatting-together`,
    options
  );
  await db.load();

  // db.events.on("replicated", (address, entry) => {
  //   console.log(entry);
  // });

  db.events.on("replicate.progress", (address, hash, entry) => {
    console.log(`[${entry.payload.op}] ${entry.payload.value}`);
  });

  // db.events.on("log.op.ADD", (id, hash, payload) => {
  //   console.log(payload.value);
  // });

  console.log(db.address);

  const rl = readline.createInterface(process.stdin);

  rl.on("line", (message) => {
    db.add(`[${process.env["USER"]}]: ${message}`);
  });
});
