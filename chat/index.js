import dotenv from "dotenv";
dotenv.config();

import IpfsClient from "ipfs-http-client";
import OrbitDB from "orbit-db";
import ChatApp from "./app.js";

const orbitDBFolder = "orbitdb/" + process.argv[2] || "anonymous";
const ipfsPort = process.argv[3] || 5001;
const ipfs = IpfsClient.create(`http://localhost:${ipfsPort}`);

OrbitDB.createInstance(ipfs, { directory: orbitDBFolder }).then(
  async (orbitdb) => {
    console.log("Connected to OrbitDB");

    const user = {
      name: process.argv[2] || process.env["USER"],
      id: orbitdb.identity.id,
    };

    ChatApp(orbitdb, process.env.CHANNELS_ADDRESS, user);
  }
);
