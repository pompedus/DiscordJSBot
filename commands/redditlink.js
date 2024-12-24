const { SlashCommandBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("redditparse")
        .setDescription("Extracts gif and video link from a reddit link and sends it")
        .addStringOption(option =>
            option.setName("reddit-link")
                .setDescription("The link to the post with the gif or video")
                .setRequired(true)
        ),

    async execute(interaction) {
        const url = interaction.options.getString("reddit-link");
        const jsonUrl = `${url.split('?')[0]}.json`;
        const maxAttempts = 5;

        const logInteraction = (message) => {
            console.log(`${new Date().toLocaleString()}: User ${interaction.user.username} used command ${interaction.commandName} - ${message}`);
        };

        const logError = (error) => {
            console.error(`${new Date().toLocaleString()}: User ${interaction.user.username} used command ${interaction.commandName} - Error: ${error.message}`);
        };

        const fetchJson = async (url, attempts = 0) => {
            try {
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`${response.status}`);
                }
                return await response.json();
            } catch (error) {
                if (error.message === '403' && attempts < maxAttempts) {
                    logInteraction(`${error.message} - Retry ${attempts + 1}/${maxAttempts}`);
                    return fetchJson(url, attempts + 1);
                } else {
                    logError(error);
                    throw error;
                }
            }
        };

        try {
            const json = await fetchJson(jsonUrl);
            const data = json[0]?.data?.children[0]?.data;

            if (!data) {
                throw new Error("Invalid data structure");
            }

            if (data.is_video) {
                await interaction.reply(data.media.reddit_video.fallback_url);
                logInteraction("successfully sent a video link");
            } else {
                await interaction.reply(data.url);
                logInteraction("successfully sent a gif link");
            }
        } catch (error) {
            logError(error);
            await interaction.reply({
                content: `Unexpected error occurred!\n**${error.message}**`,
                ephemeral: true
            });
        }
    }
};
