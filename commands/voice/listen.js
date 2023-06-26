const { SlashCommandBuilder } = require("discord.js");
const { joinVoiceChannel } = require("@discordjs/voice");
const { OpusEncoder } = require("@discordjs/opus");

const data = new SlashCommandBuilder()
  .setName("listen")
  .setDescription("Listen to user input in a voice call");

async function execute(interaction) {
  const member = interaction.member;
  const voiceChannel = member.voice.channel;

  if (!voiceChannel) {
    await interaction.reply({
      content: "You need to be in a voice channel to use this command.",
      ephemeral: true,
    });
    return;
  }

  await interaction.deferReply();

  const connection = joinVoiceChannel({
    channelId: voiceChannel.id,
    guildId: interaction.guild.id,
    adapterCreator: interaction.guild.voiceAdapterCreator,
    selfDeaf: false,
  });

  const encoder = new OpusEncoder(48000, 2);

  connection.on("stateChange", (oldState, newState) => {
    if (newState.status === "ready") {
      const receiver = connection.receiver;
      console.log("We made it!");
      receiver.on("pcm", (pcm) => {
        const opus = encoder.encode(pcm);
        // Process the opus data
        console.log(opus);
      });

      interaction.editReply("I am now listening to your input.");
    }
  });
}

module.exports = {
  data,
  execute,
};
