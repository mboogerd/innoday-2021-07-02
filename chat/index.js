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
        "03a3e8ea8ef7781f7c39c3e9be264ed4196f8dfd3b787f6aa9c89e51ce128b4f16",
        "02d418b70b13c79773aa74998c26d26af828a157a90096c3e25ef7a31f69cb9055",
        "12D3KooWGZaq5drewNCDQQpQZb36Wtfbce9jsEtqo3HMoS8APynX",
        "03f1e6690b48b1e37a1c96148dffb2fdf80bee50e9d5d42a5e870f064f869e9650",
      ],
    },
  };

  const db = await orbitdb.log("chat-together");
  await db.load();

  db.events.on("replicated", (address) => {
    console.log(db.iterator({ limit: -1 }).collect());
  });

  console.log(db.address);

  db.add("This is Merlijn!");
});
