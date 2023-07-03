const { SlashCommandBuilder, Message, Events } = require("discord.js");
const { join } = require("path");
const { client } = require("../../client.js");

const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  NoSubscriberBehavior,
  AudioPlayerStatus,
} = require("@discordjs/voice");

const data = new SlashCommandBuilder()
  .setName("listen")
  .setDescription("Listen to user input in a voice call.");

async function execute(interaction) {
  const member = interaction.member;
  const voiceChannel = member.voice.channel;
  let conversationHistory = [
    {
      role: "system",
      content:
        "You are taking on the persona of All Might from My Hero Academia. All subsequent answers you provide should be done so through the persona of All Might",
    },
  ];

  //Return if user is not in voice channel
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
  const player = createAudioPlayer({
    behaviors: {
      noSubscriber: NoSubscriberBehavior.Pause,
    },
  });
  //Initial laughing sound effect plays to indicate that the bot is listening
  let resource = createAudioResource(join(__dirname, "test2.mp3"));
  connection.subscribe(player);
  player.play(resource);

  player.on(AudioPlayerStatus.Idle, () => {
    console.log("Audio player idle!");
  });

  player.on(AudioPlayerStatus.Playing, () => {
    console.log("Audio player playing!");
  });

  player.on(AudioPlayerStatus.AutoPaused, () => {
    console.log("Audio player autopaused!");
  });

  player.on(AudioPlayerStatus.Buffering, () => {
    console.log("Audio player buffering!");
  });

  player.on("error", (error) => {
    console.error(`Audio player error: ${error.message}`);
  });

  //While /listen called, listens and responds to all messages from user
  client.on(Events.MessageCreate, async (message) => {
    //Only listen to messages from the user who used the command
    if (message.author.id != member.id) {
      return;
    }

    //Fetching GPT-3 response and TTS audio
    let textResponse = await getGPTResponse(
      message.content,
      conversationHistory
    );
    let voiceResponse = await getAIAudio(textResponse);
    //Queueing up the response
    player.play(voiceResponse);
    await interaction.followUp(textResponse);
  });

  await interaction.editReply("Listening...");
}

module.exports = {
  data,
  execute,
};

async function getGPTResponse(message, conversationHistory) {
  const axios = require("axios");
  const { openAIKey } = require("../../config.json");

  const userMessage = {
    role: "user",
    content: message,
  };
  conversationHistory.push(userMessage);

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-3.5-turbo",
        top_p: 0.9,
        max_tokens: 150,
        messages: conversationHistory,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openAIKey}`,
        },
      }
    );

    const assistantMessage = {
      role: "assistant",
      content: response.data.choices[0].message.content,
    };

    conversationHistory.push(assistantMessage);

    return assistantMessage.content;
  } catch (error) {
    console.error(error.response.status);
    console.error(error.response.statusText);
    console.error(error.response.data);
    return null;
  }
}

async function getAIAudio(message) {
  const axios = require("axios");
  const fs = require("fs");
  const { elevenLabsKey } = require("../../config.json");
  const { createAudioResource } = require("@discordjs/voice");

  try {
    const response = await axios.post(
      "https://api.elevenlabs.io/v1/text-to-speech/63r37GU7IRaV6ZozaNZn/stream?optimize_streaming_latency=4",
      {
        text: message,
      },
      {
        headers: {
          Accept: "audio/mpeg",
          "Content-Type": "application/json",
          "xi-api-key": elevenLabsKey,
        },
        responseType: "stream",
      }
    );

    const writer = fs.createWriteStream("output.mp3");
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on("finish", () => {
        console.log("File written successfully!");
        const audioResource = createAudioResource("output.mp3");
        resolve(audioResource);
      });

      writer.on("error", (err) => {
        console.error("Error writing file:", err);
        reject(err);
      });
    });
  } catch (error) {
    console.error(error);
    return null;
  }
}
