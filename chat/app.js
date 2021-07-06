import { Channels } from "./channel.js";
import { LobbyCommandHandler } from "./commands.js";
import readline from "readline";

const ChatApp = async (orbitdb, channelsAddress, user) => {
  const channels = await Channels.create(orbitdb, channelsAddress);
  const lobbyCommandHandler = new LobbyCommandHandler(
    channels,
    user,
    eventHandler
  );

  const rl = readline.createInterface(process.stdin);

  const handleInput = (handler) => {
    rl.once("line", async (line) => {
      const [command, args] = getCommandLine(line);
      const commandMap = commandMapping(handler, args);
      const task = commandMap[command];

      if (task) {
        try {
          handleInput(await task());
        } catch (err) {
          console.log("Command execution failed.", err);
          handleInput(handler);
        }
      } else {
        console.log(`Unknown command '${command}(${args})'`);
        handleInput(handler);
      }
    });
  };

  handleInput(lobbyCommandHandler);
};

const commandMapping = (handler, args) => ({
  create: () => handler.createChannel(...args),
  delete: () => handler.deleteChannel(...args),
  channels: () => handler.listChannels(...args),
  join: () => handler.joinChannel(...args),
  leave: () => handler.leaveChannel(...args),
  say: () => handler.sendMessage(...args),
  shrug: () => handler.shrug(...args),
  peers: () => handler.listPeers(...args),
  whereami: () => handler.whereAmI(...args),
  debug: () => handler.printDebugInfo(...args),
});

const getCommandLine = (line) => {
  const words = line.split(" ");
  const command = words[0];
  const args = words.slice(1);
  if (command.startsWith("/")) return [command.slice(1), args];
  else return ["say", [line]];
};

const eventHandler = {
  onMessage: ({ user, message, timestamp }) => {
    console.log(`[${user.name}] ${message}`);
  },
  onJoin: ({ user, channel }) =>
    systemLog(`${user.name} joined ${channel.name}`),
  onLeave: ({ user, channel }) =>
    systemLog(`${user.name} left ${channel.name}`),
};

const systemLog = (msg, other) =>
  other
    ? console.log(`[system] ${msg}`, other)
    : console.log(`[system] ${msg}`);

export default ChatApp;
