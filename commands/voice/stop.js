const { SlashCommandBuilder } = require("discord.js");
const { getVoiceConnection } = require("@discordjs/voice");

const data = new SlashCommandBuilder()
  .setName("stop")
  .setDescription("Stop listening to user input in a voice call");

async function execute(interaction) {
  const connection = getVoiceConnection(interaction.guild.id);

  if (connection) {
    connection.destroy();
    await interaction.reply(
      "I have stopped listening to your input and left the voice channel."
    );
  } else {
    await interaction.reply("I am not currently in a voice channel.");
  }
}

module.exports = {
  data,
  execute,
};
