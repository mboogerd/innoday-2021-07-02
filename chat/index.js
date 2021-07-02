const IpfsClient = require("ipfs-http-client");
const OrbitDB = require("orbit-db");

const ipfs = IpfsClient.create("http://localhost:5001");

OrbitDB.createInstance(ipfs).then(async (orbitdb) => {
  console.log("Connected to OrbitDB");

  const options = {
    // Setup write access
    accessController: {
      write: [
        // Give access to ourselves
        orbitdb.identity.id,
        // Give access to the second peer
        "03990f6dabfd6d20a1cae72d22262089429659fdc885b8c45dc42572984b891fd8", // leon
        "02d418b70b13c79773aa74998c26d26af828a157a90096c3e25ef7a31f69cb9055",
        "03bd95a4b1d91681648bfb1a9f7554ce9d14c1cf6290d8804d685f20963c80d7cc",
        "03f1e6690b48b1e37a1c96148dffb2fdf80bee50e9d5d42a5e870f064f869e9650",
      ],
    },
  };

  const db = await orbitdb.log(
    `zdpuAsLzqPyDWzYNTcb3wdeE3E7svJdn7UrKNVL6v8YHMMaq6/chat-together`,
    options
  );
  await db.load();

  console.log(orbitdb.identity);

  db.events.on("replicated", (address) => {
    db.iterator({ limit: -1 }).collect().forEach(item => item.payload.value)
  });

  console.log(db.address);

  db.add("This is Jethro!");
});
