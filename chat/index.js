const IpfsClient = require("ipfs-http-client");
const OrbitDB = require("orbit-db");

const ipfs = IpfsClient.create("http://localhost:5001");

OrbitDB.createInstance(ipfs).then(async (orbitdb) => {
  console.log("Connected to OrbitDB");

  const db = await orbitdb.log("chat");
  await db.load();

  db.events.on("replicated", (address) => {
    console.log(db.iterator({ limit: -1 }).collect());
  });

  setInterval(() => {
    console.log("Sending message...");
    db.add("This is Léon!");
  }, 1000);
});
