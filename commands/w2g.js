const { SlashCommandBuilder } = require("discord.js");
require('dotenv').config();

module.exports = {
    data: new SlashCommandBuilder()
        .setName("w2g")
        .setDescription("Creates a w2g link from a videolink")
        .addStringOption(option =>
            option.setName("video-url")
                .setDescription("Url for the video to watch together")
                .setRequired(true)),

    async execute(interaction) {
        const videoUrl = interaction.options.getString("video-url");

        async function fetchJson(url) {
            try {
                const response = await fetch("https://api.w2g.tv/rooms/create.json", {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        "w2g_api_key": process.env.W2G_TOKEN,
                        "share": url
                    })
                })
                if(!response.ok){
                    throw new Error(`${response.status}`);
                }
                const json = await response.json();
                return json;
            } catch (error) {
                console.error(`${new Date().toLocaleString()}: User ${interaction.user.username} used command ${interaction.commandName} and sent a video unsuccessfully`);
                console.error(`${new Date().toLocaleString()}: ${error}`);
                throw error;
            }
        }

        await fetchJson(videoUrl).then(data => {
            link = `https://w2g.tv/rooms/${data.streamkey}`
            content = `W2G: Here is your room! ${link}`;
            interaction.reply(content);
            console.log(`${new Date().toLocaleString()}: User ${interaction.user.username} used command ${interaction.commandName} and sent a video successfully (${videoUrl}).`);
        }).catch(error => {
            console.error(`${new Date().toLocaleString()}: User ${interaction.user.username} used command ${interaction.commandName} and sent a video unsuccessfully`);
            console.error(`${new Date().toLocaleString()}: ${error}`);
            interaction.reply({ content: `Unexpected error ocurred!\n**${error}**`, ephemeral: true })
        })
    }
}
