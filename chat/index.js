const IpfsClient = require("ipfs-http-client");
const OrbitDB = require("orbit-db");

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
        "02d418b70b13c79773aa74998c26d26af828a157a90096c3e25ef7a31f69cb9055", // Arjan
        "03bd95a4b1d91681648bfb1a9f7554ce9d14c1cf6290d8804d685f20963c80d7cc", // Jethro
        "02509fcf34235a01a5ce87e0efae80656a85b813918040a32d32652e2ae295ea52", // Matthijs
      ],
    },
  };

  const db = await orbitdb.log(
    `zdpuAsLzqPyDWzYNTcb3wdeE3E7svJdn7UrKNVL6v8YHMMaq6/chat-together`,
    options
  );
  await db.load();

  db.events.on("replicated", (address) => {
    db.iterator({ limit: -1 })
      .collect()
      .forEach((item) => item.payload.value);
  });

  console.log(db.address);

  db.add(`This is ${process.env["USER"]}!`);
});
