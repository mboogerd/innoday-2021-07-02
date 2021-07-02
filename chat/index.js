const IpfsClient = require("ipfs-http-client");
const OrbitDB = require("orbit-db");

const ipfs = IpfsClient.create("http://localhost:5001");

OrbitDB.createInstance(ipfs).then(async (orbitdb) => {
  console.log("Connected to OrbitDB");

  const db = await orbitdb.log('zdpuAukF9SYSVyptoAxmP7TxiwALeZ5iiKhZ52e71HAa4Astv/chat-together');
  await db.load();

  console.log(orbitdb.identity);

  db.events.on("replicated", (address) => {
    console.log(address);
    console.log(db.iterator({ limit: -1 }).collect());
  });

  console.log("Sending message...");
  db.add("This is Jethro!")

  // setInterval(() => {
  //   console.log("Sending message...");
  //   db.add("This is Jethro!");
  // }, 1000);
});
