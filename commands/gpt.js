const { SlashCommandBuilder, ChannelType, ThreadAutoArchiveDuration } = require("discord.js");
const { Anthropic } = require("@anthropic-ai/sdk")

const anthropic = new Anthropic({apiKey: process.env.CLAUDE_KEY});

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
        .setDescription("Sends a question to Anthropic Claude")
        .addStringOption(option =>
            option.setName("question")
                .setDescription("What you want to ask Claude")
                .setRequired(true))
        .addBooleanOption(option=>
            option.setName("private")
                .setDescription("Do you want this to be a private call?")
                .setRequired(false)),
    
    async execute(interaction) {
        displayName = interaction.member ? interaction.member.displayName : interaction.user.username;
        ephemeralResponse = interaction.options.getBoolean("private") == null ? true : false
        await interaction.deferReply({ ephemeral: ephemeralResponse });
        try{
            const question = interaction.options.getString("question");
            /*const thread = await interaction.channel.threads.create({
                name: question,
                autoArchiveDuration: ThreadAutoArchiveDuration.OneHour,
                type: ChannelType.PrivateThread,
                reason: 'Needed a separate thread for moderation',
            });
            if (thread.joinable) thread.join();
            thread.members.add(interaction.user);*/
            currentMessage = ""
            const msg = await anthropic.messages.create({
                model: "claude-3-5-sonnet-20240620",
                max_tokens: 1000,
                temperature: 0,
                system: "Keep the response under 2000 characters.",
                messages: [
                    {
                    "role": "user",
                    "content": [
                        {
                        "type": "text",
                        "text": question
                        }
                    ]
                    }
                ]
            })
            /*.on('text', (text) => {
                console.log(text)
                currentMessage += text
                interaction.editReply({ content: currentMessage, ephemeral: ephemeralResponse })
            })*/
            answer = `${displayName} asked the question:\n**${question}** \n\n ${msg.content[0].text}`

            if (answer.length < 2000) {
                await interaction.editReply({ content: answer, ephemeral: ephemeralResponse })
            } else {
                stringlist = splitStringByLength(answer, 2000)
                for(let string of stringlist){
                    await interaction.followUp({ content: string, ephemeral: ephemeralResponse })
                }
            }

            console.log(`${new Date().toLocaleString()}: User ${displayName} used command ${interaction.commandName} and asked Claude successfully. The answer was ${answer.length} characters long.`);
        } catch (error) {
            await interaction.editReply({ content: "Unexpected error ocurred!\n**" + error + "**", ephemeral: true });
            console.log(`${new Date().toLocaleString()}: User ${displayName} used command ${interaction.commandName} and it failed. The reason was ${error}.`);
        }
    }
}
  