const { SlashCommandBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("redditparse")
        .setDescription("Extracts gif and video link from a redditlink and sends it")
        .addStringOption(option =>
            option.setName("reddit-link")
                .setDescription("The link to the post with the gif or video")
                .setRequired(true)),

    async execute(interaction) {
        const url = interaction.options.getString("reddit-link");
        const jsonUrl = url.split('?')[0] + ".json";
        let attempts = 0;
        const maxAttempts = 5;

        async function fetchJson(url) {
            try {
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`${response.status}`);
                }
                const json = await response.json();
                return json;
            } catch (error) {
                if (error.message === '403' && attempts < maxAttempts) {
                    attempts++;
                    console.log(new Date().toLocaleString() + ": " + error + " - Try: " + attempts + "/" + maxAttempts + " to fetch JSON - Retrying.");
                    return fetchJson(url);
                } else {
                    console.error(new Date().toLocaleString() + ": " + "User " + interaction.user.username + " used command " + interaction.commandName + " unsuccessfully.");
                    console.error(new Date().toLocaleString() + ": " + error);
                    throw error;
                }
            }
        }
        await fetchJson(jsonUrl).then(json => {
            var data = json[0].data.children[0].data
            switch (data.is_video) {
                case true:
                    interaction.reply(data.media.reddit_video.fallback_url);
                    console.log(new Date().toLocaleString() + ": " + "User " + interaction.user.username + " used command " + interaction.commandName + " to send a video successfully.");
                    break;
                case false:
                    interaction.reply(data.url);
                    console.log(new Date().toLocaleString() + ": " + "User " + interaction.user.username + " used command " + interaction.commandName + " to send a gif successfully.");
                    break;
            }
        }).catch(error => {
            interaction.reply({ content: "Unexpected error ocurred!\n**" + error + "**", ephemeral: true });
        })
    }
}