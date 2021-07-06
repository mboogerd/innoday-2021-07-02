export class LobbyCommandHandler {
  constructor(channels, user, eventHandler) {
    this.channels = channels;
    this.user = user;
    this.eventHandler = eventHandler;
  }

  async createChannel(channelName) {
    await this.channels.createChannel(channelName);
    return this;
  }

  async deleteChannel(channelName) {
    await this.channels.deleteChannel(channelName);
    return this;
  }

  async listChannels() {
    systemLog("All channels", await this.channels.listChannels());
    return this;
  }

  async joinChannel(channelName) {
    const channel = await this.channels.getChannel(channelName);
    if (channel) {
      const activeChannel = await channel.join(this.user);
      const { onMessage, onJoin, onLeave } = this.eventHandler;
      if (onMessage) activeChannel.onMessage(onMessage);
      if (onJoin) activeChannel.onJoin(onJoin);
      if (onLeave) activeChannel.onLeave(onLeave);
      return new ChannelCommandHandler(this, activeChannel);
    }
    systemLog(`The channel ${channelName} could not be found`);
    return this;
  }

  async leaveChannel() {
    return this.#activeChannelRequired();
  }

  async sendMessage(_message) {
    return this.#activeChannelRequired();
  }

  async shrug() {
    return this.#activeChannelRequired();
  }

  async listPeers() {
    return this.#activeChannelRequired();
  }

  whereAmI() {
    systemLog("You are in the lobby");
    return this;
  }

  printDebugInfo() {
    return this;
  }

  #activeChannelRequired() {
    systemLog("This command is only valid when you joined a channel");
    return this;
  }
}

export class ChannelCommandHandler extends LobbyCommandHandler {
  constructor(lobby, activeChannel) {
    super(lobby.channels, lobby.user);
    this.lobby = lobby;
    this.activeChannel = activeChannel;
  }

  async joinChannel(channelName) {
    await this.activeChannel.leave();
    return await super.joinChannel(channelName);
  }

  async leaveChannel() {
    await this.activeChannel.leave();
    return this.lobby;
  }

  async sendMessage(message) {
    await this.activeChannel.sendMessage(message);
    return this;
  }

  async shrug() {
    return await this.sendMessage("¯\\_(ツ)_/¯");
  }

  async listPeers() {
    systemLog("Peers:", await this.activeChannel.listPeers());
    return this;
  }

  whereAmI() {
    systemLog(`You are in channel '${this.activeChannel.name()}'`);
    return this;
  }
}

const systemLog = (msg, other) =>
  other
    ? console.log(`[system] ${msg}`, other)
    : console.log(`[system] ${msg}`);
