const { SlashCommandBuilder } = require("discord.js");
const { time } = require("node:console");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("redditparse")
        .setDescription("Extracts gif and video link from a redditlink and sends it")
        .addStringOption(option =>
            option.setName("reddit-link")
                .setDescription("The link to the post with the gif or video")
                .setRequired(true)),

    async execute(interaction) {
        const jsonUrl = interaction.options.getString("reddit-link") + ".json";
        let attempts = 0;
        const maxAttempts = 5;

        async function fetchJson() {
            fetch(jsonUrl)
                .then(response => {
                    if (response.headers.get("content-type").includes("application/json")) {
                        return response.json();
                    } else {
                        throw new Error("Received HTML instead of JSON");
                    }
                })
                .then(async (json) => {
                    var data = json[0].data.children[0].data
                    switch (data.is_video) {
                        case true:
                            await interaction.reply(data.media.reddit_video.fallback_url);
                            console.log(new Date().toLocaleString() + ": " + "User " + interaction.user.username + " used command " + interaction.commandName + " to send a video successfully!")
                            return
                        case false:
                            await interaction.reply(data.url);
                            console.log(new Date().toLocaleString() + ": " + "User " + interaction.user.username + " used command " + interaction.commandName + " to send a gif successfully!")
                            return
                    }
                })
                .catch(async error => {
                    console.log(new Date().toLocaleString() + ": " + "User " + interaction.user.username + " used command " + interaction.commandName + " unsuccessfully.");
                    if (error.message === "Received HTML instead of JSON" && attempts < maxAttempts) {
                        attempts++;
                        console.log(new Date().toLocaleString() + ": " + "Fail " + attempts + "/" + maxAttempts + " to fetch JSON - retrying.");
                        fetchJson();
                    } else {
                        console.log(new Date().toLocaleString() + ": " + error);
                        await interaction.reply({ content: "Unexpected error ocurred!\nError message is:\n**" + error + "**", ephemeral: true });
                    }
                });
        }
        fetchJson();
    }
}