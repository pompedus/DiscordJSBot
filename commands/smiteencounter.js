const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require("discord.js");
const { PythonShell } = require('python-shell');

module.exports = {
    data: new SlashCommandBuilder()
        .setName("smiteencounter")
        .setDescription("Shows a list of top gods encountered last 25 matches")
        .addStringOption(option => option.setName("profilelink")
            .setDescription("Link to smite guru profile")
            .setRequired(true))
        .addNumberOption(option => option.setName("lowestencounter")
            .setDescription("Lowest number for encounters")
            .setRequired(false))
        .addNumberOption(option => option.setName("pages")
            .setDescription("number of pages to check")
            .setRequired(false)),


    async execute(interaction) {
        const url = interaction.options.getString("profilelink");
        const lowestEncounter = interaction.options.getNumber("lowestencounter") || 3;
        const pages = interaction.options.getNumber("pages") || 1;
        await interaction.deferReply();
        const godEmbed = new EmbedBuilder();
        godEmbed.addFields({
            name: "Pages checked (25 matches per page)",
            value: pages.toString()
        });
        console.log(`${new Date().toLocaleString()}: Starting godlist fetch on url: ${url}`);
        let options = {
            mode: 'json',
            pythonOptions: ['-u'], // get print results in real-time
            scriptPath: './commands',
            args: [url, pages]
        };
        correctFetch = 0;
        inCorrectFetch = 0;
        let getlist = new PythonShell('getlist.py', options);
        getlist.on('message', async (message) => {
            // received a message sent from the Python script (a simple "print" statement)
            messageType = message.Type;
            messageData = message.Data;
            if (messageType == "Info") {
                console.log(`${new Date().toLocaleString()}: ${messageData}`);
                correctFetch += 1;
            };
            if (messageType == "Error") {
                console.error(`${new Date().toLocaleString()}: ${messageData}`);
                inCorrectFetch += 1;
            };
            if (messageType == "Result") {
                var godList = messageData;
                var groupedByCount = {};

                for (var god in godList) {
                    var count = godList[god];

                    if (!groupedByCount[count]) {
                        groupedByCount[count] = [];
                    }

                    groupedByCount[count].push(god);
                }
                var sortedCounts = Object.keys(groupedByCount).sort((a, b) => b - a);

                // Output the sorted counts and corresponding gods
                sortedCounts.forEach(count => {
                    var gods = groupedByCount[count].sort((a, b) => {
                        if (a < b) {
                            return -1;
                        }
                        if (a > b) {
                            return 1;
                        }
                        // names must be equal
                        return 0;
                    });

                    if (count >= lowestEncounter) {
                        godEmbed.addFields({
                            name: count.toString(),
                            value: gods.join("\n")
                        });
                    }
                });
                godEmbed.addFields({
                    name: "Matches correctly fetched",
                    value: `${correctFetch.toString()}/${(correctFetch+inCorrectFetch).toString()}`
                })

                await interaction.editReply({ embeds: [godEmbed] });
                console.log(`${new Date().toLocaleString()}: User ${interaction.user.username} used command ${interaction.commandName} successfully.`);
            }
        });
        getlist.on('stderr', async (error) => {
            await interaction.editReply({ content: `Unexpected error ocurred!\n**${error}**`, flags: MessageFlags.Ephemeral });
            console.error(`${new Date().toLocaleString()}: User ${interaction.user.username} used command ${interaction.commandName} unsuccessfully`);
            console.error(`${new Date().toLocaleString()}: ${error}`);
        });
    }
}