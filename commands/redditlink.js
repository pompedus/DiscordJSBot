const { SlashCommandBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
            .setName("redditparse")
            .setDescription("Extracts gif and video link from a redditlink and sends it")
            .addStringOption(option =>
                option.setName("reddit-link")
                    .setDescription("The link to the post with the gif or video")
                    .setRequired(true)),

    async execute(interaction){
        const jsonUrl = interaction.options.getString("reddit-link")+".json";
        fetch(jsonUrl)
            .then(response => response.json())
            .then(async (json) => {
                var data = json[0].data.children[0].data
                switch(data.is_video){
                    case true:
                        //await interaction.reply(data.media.reddit_video.fallback_url);
                        await interaction.reply(data.media.reddit_video.fallback_url)
                        console.log(new Date().toLocaleString() + ": " + "User " + interaction.user.username + " used command " + interaction.commandName + " to send a video successfully!")
                        return
                    case false:
                        //await interaction.reply(data.url);
                        await interaction.reply(data.url)
                        console.log(new Date().toLocaleString() + ": " + "User " + interaction.user.username + " used command " + interaction.commandName + " to send a gif successfully!")
                        return
                }
            })
            .catch(async error => {
            	await interaction.reply({content:"Skriv en riktig länk bror!!\nFelmeddelandet är: \n**" + error.toString() + "**", ephemeral:true})
                console.log(new Date().toLocaleString() + ": " + "User " + interaction.user.username + " used command " + interaction.commandName + " unsuccessfully, with error code:\n" + error.toString())
            });
    }
}
