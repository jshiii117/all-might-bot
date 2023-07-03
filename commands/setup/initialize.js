const { SlashCommandBuilder } = require("discord.js");
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
const axios = require("axios");
const { riotKey } = require("../../config.json");

const data = new SlashCommandBuilder()
  .setName("initialize")
  .setDescription(
    "Get information about a user with their username and tagline"
  )
  .addStringOption((option) =>
    option
      .setName("username")
      .setDescription("The username of the user")
      .setRequired(true)
  )
  .addStringOption((option) =>
    option
      .setName("tagline")
      .setDescription("The tagline of the user")
      .setRequired(true)
  );

async function execute(interaction) {
  const username = interaction.options.getString("username");
  const tagline = interaction.options.getString("tagline");

  // Make the API request
  try {
    const response = await axios.get(
      `https://americas.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(
        username
      )}/${encodeURIComponent(tagline)}`,
      {
        headers: {
          "X-Riot-Token": "RGAPI-45e9a4f3-ee6b-45ee-ab12-4a1da0b48907",
        },
      }
    );

    const data = response.data;
    await interaction.reply(`User information: ${JSON.stringify(data)}`);
  } catch (error) {
    await interaction.reply({
      content: "There was an error while fetching the user information.",
      ephemeral: true,
    });
    console.error(error.response.status); // logs the status code of the error
    console.error(error.response.statusText); // logs the status text of the error
    console.error(error.response.data); // logs the response data of the error
  }
}

module.exports = {
  data,
  execute,
};
