const defaultOptions = {
  accessController: {
    write: ["*"],
  },
};

export class Channels {
  constructor(channelsDb, logLoader) {
    this.channelsDb = channelsDb;
    this.logLoader = logLoader;
  }

  async listChannels() {
    return await this.channelsDb.all;
  }

  async getChannel(channelName, options) {
    const foundChannel = await this.channelsDb.get(channelName);
    if (foundChannel) {
      return Channel.create(
        this.logLoader,
        foundChannel.address,
        options || defaultOptions
      );
    }
  }

  async createChannel(channelName, options) {
    const o = options || defaultOptions;
    var channel = await this.getChannel(channelName, o);
    if (!channel) {
      const newChannel = await this.logLoader(channelName, o);
      await this.channelsDb.put(channelName, {
        address: newChannel.address.toString(),
      });
      channel = await this.getChannel(channelName, o);
    }
    return channel;
  }

  async deleteChannel(channelName) {
    await this.channelsDb.del(channelName);
  }

  static async create(orbitdb, addr, options) {
    const o = options || defaultOptions;
    const channelsDb = await orbitdb.keyvalue(addr, o);
    await channelsDb.load();
    return new Channels(channelsDb, (name, options) =>
      orbitdb.log(name, options || defaultOptions)
    );
  }
}

export class Channel {
  constructor(channelDb) {
    this.channelDb = channelDb;
  }

  async join(user) {
    await this.channelDb.load();
    const joinMessage = {
      type: "join",
      user: user,
      timestamp: new Date().toISOString(),
    };
    await this.channelDb.add(joinMessage);
    return new ActiveChannel(this, user);
  }

  static async create(logLoader, addr, options) {
    return new Channel(await logLoader(addr, options || defaultOptions));
  }
}

export class ActiveChannel {
  constructor(channel, user) {
    this.channel = channel;
    this.user = user;
  }

  name() {
    return this.channel.channelDb.address.path;
  }

  async leave() {
    await this.channel.channelDb.add({
      type: "leave",
      user: this.user,
      timestamp: new Date().toISOString(),
    });
    return await this.channel.channelDb.close();
  }

  async sendMessage(message) {
    return await this.channel.channelDb.add({
      type: "message",
      user: this.user,
      message: message,
      timestamp: new Date().toISOString(),
    });
  }

  async listPeers() {}

  onMessage(messageHandler) {
    this.#eventHandler(messageHandler, "message");
  }

  onJoin(joinHandler) {
    this.#eventHandler(joinHandler, "join");
  }

  onLeave(leaveHandler) {
    this.#eventHandler(leaveHandler, "leave");
  }

  #eventHandler(handler, type) {
    this.channel.channelDb.events.on(
      "replicate",
      (_address, entry) =>
        entry?.payload?.value?.type === type && handler(entry.payload.value)
    );
    this.channel.channelDb.events.on(
      "log.op.ADD",
      (_id, _hash, payload) =>
        payload?.value?.type === type && handler(payload.value)
    );
  }
}
