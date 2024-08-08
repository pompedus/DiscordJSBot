const { SlashCommandBuilder, ChannelType, ThreadAutoArchiveDuration } = require("discord.js");
// Importing the OpenAI module using require
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Access your API key as an environment variable (see "Set up your API key" above)
const genAI = new GoogleGenerativeAI(process.env.GPT_KEY);

const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro"});

function splitStringByLength(str, length) {
    let result = [];
    for (let i = 0; i < str.length; i += length) {
        result.push(str.slice(i, i + length));
    }
    return result;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("gpt")
        .setDescription("Sends a question to Gemini")
        .addStringOption(option =>
            option.setName("question")
                .setDescription("What you want to ask Gemini")
                .setRequired(true)),
    
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });
        try{
        const question = "Answer the following prompt in 2000 letters or less: " + interaction.options.getString("question");

        /*const thread = await interaction.channel.threads.create({
            name: question,
            autoArchiveDuration: ThreadAutoArchiveDuration.OneHour,
            type: ChannelType.PrivateThread,
            reason: 'Needed a separate thread for moderation',
        });
        if (thread.joinable) thread.join();
        thread.members.add(interaction.user);*/
        const result = await model.generateContent(question);
        const response = await result.response;
        const text = response.text();
        if (text.length < 2000) {
            await interaction.editReply({ content: text, ephemeral: true })
        } else {
            stringlist = splitStringByLength(text, 2000)
            for(let string of stringlist){
                await interaction.followUp({ content: string, ephemeral: true })
            }
        }

        console.log(new Date().toLocaleString() + ": " + "User " + interaction.user.username + " used command " + interaction.commandName + " and asked gemini successfully.");
        } catch (error) {
            await interaction.editReply({ content: "Unexpected error ocurred!\n**" + error + "**", ephemeral: true });
        }
    }
}
  