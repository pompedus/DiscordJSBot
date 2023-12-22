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

    async execute(interaction){
        const url = interaction.options.getString("video-url");

        fetch("https://api.w2g.tv/rooms/create.json", {
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
        .then(response => response.json())
        .then(async function (data) {
            content = "W2G: Here is your room! https://w2g.tv/rooms/" + data.streamkey;
            await interaction.reply(content);
            console.log(new Date().toLocaleString() + ": " + "User " + interaction.user.username + " used command " + interaction.commandName + " and sent a video successfully!")
        })
        .catch(async error => {
            console.log(new Date().toLocaleString() + ": " + "User " + interaction.user.username + " used command " + interaction.commandName + " unsuccessfully. The error message is: \n" + error)
        	await interaction.reply({content:"Unexpected error ocurred!\nError message is:\n**" + error + "**", ephemeral:true})
        })
    }
}
