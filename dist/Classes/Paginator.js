"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
Number.prototype.mod = function (n) {
    return ((this % n) + n) % n;
};
class Paginator {
    embeds;
    constructor(embeds = []) {
        this.embeds = embeds;
    }
    /**
     * Takes in a list of strings and creates embeds from them.
     *
     * @param list the list of strings
     * @param baseString an optional string to be displayed on every page
     * @param options object containing paremeters for the embed
     */
    listToEmbeds(list, baseString, options = {}) {
        if (!baseString)
            baseString = "";
        let embedStrings = [];
        for (let i = 0; i < list.length; i++) {
            if (!embedStrings[Math.floor(i / 10)]) {
                embedStrings[Math.floor(i / 10)] = "";
            }
            embedStrings[Math.floor(i / 10)] += `${i + 1}. ${list[i]}\n`;
        }
        if (embedStrings.length === 0)
            embedStrings = [""];
        let embeds = [];
        for (let i = 0; i < embedStrings.length; i++) {
            let embed = new discord_js_1.EmbedBuilder()
                .setColor(options.color ?? "Green")
                // .setThumbnail(interaction.user.displayAvatarURL())
                .setTitle(options.title ?? "Title")
                .setDescription(`${baseString}\n\n${embedStrings[i]}`)
                .setFooter({ text: `Page ${i + 1} / ${embedStrings.length}` })
                .setTimestamp();
            embeds.push(embed);
        }
        this.embeds = embeds;
        return embeds;
    }
    returnPaginationRow(counter) {
        return new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
            .setCustomId("back_all")
            .setStyle(discord_js_1.ButtonStyle.Primary)
            .setEmoji("⏪")
            .setDisabled(counter === 0), new discord_js_1.ButtonBuilder()
            .setCustomId("back")
            .setStyle(discord_js_1.ButtonStyle.Primary)
            .setEmoji("⬅️")
            .setDisabled(counter === 0), new discord_js_1.ButtonBuilder()
            .setCustomId("end")
            .setStyle(discord_js_1.ButtonStyle.Primary)
            .setEmoji("⏹️"), new discord_js_1.ButtonBuilder()
            .setCustomId("forward")
            .setStyle(discord_js_1.ButtonStyle.Primary)
            .setEmoji("➡️")
            .setDisabled(counter === this.embeds.length - 1), new discord_js_1.ButtonBuilder()
            .setCustomId("forward_all")
            .setStyle(discord_js_1.ButtonStyle.Primary)
            .setEmoji("⏩")
            .setDisabled(counter === this.embeds.length - 1));
    }
    /**
     * Takes in a list of embeds to paginate.
     *
     * @param options options necessary for the pagination. Interaction and Client are necessary
     * @returns
     */
    async paginate(options) {
        const { client, interaction, ephemeral } = options;
        if (this.embeds.length === 1) {
            return interaction.reply({
                embeds: [this.embeds[0]],
                ephemeral: ephemeral,
            });
        }
        else {
            let msg = await interaction.reply({
                embeds: [this.embeds[0]],
                components: [this.returnPaginationRow(0)],
                fetchReply: true,
                ephemeral: ephemeral,
            });
            let counter = 0;
            const listener = async (pagInter) => {
                if (!pagInter.message)
                    return;
                if (pagInter.user.id !== interaction.user.id)
                    return;
                if (pagInter.message.id !== msg.id)
                    return;
                if (pagInter.customId === "back_all") {
                    counter = 0;
                    pagInter
                        .update({
                        embeds: [this.embeds[counter]],
                        components: [this.returnPaginationRow(counter)],
                    })
                        .catch(() => { });
                }
                if (pagInter.customId === "back" && counter - 1 >= 0) {
                    counter--;
                    pagInter
                        .update({
                        embeds: [this.embeds[counter]],
                        components: [this.returnPaginationRow(counter)],
                    })
                        .catch(() => { });
                }
                if (pagInter.customId === "forward" &&
                    counter + 1 < this.embeds.length) {
                    counter++;
                    pagInter
                        .update({
                        embeds: [this.embeds[counter]],
                        components: [this.returnPaginationRow(counter)],
                    })
                        .catch(() => { });
                }
                if (pagInter.customId === "forward_all") {
                    counter = this.embeds.length - 1;
                    pagInter
                        .update({
                        embeds: [this.embeds[counter]],
                        components: [this.returnPaginationRow(counter)],
                    })
                        .catch(() => { });
                }
                if (pagInter.customId === "end") {
                    pagInter
                        .update({ embeds: [this.embeds[counter]], components: [] })
                        .catch(() => { });
                    client.off("interactionCreate", listener);
                }
            };
            client.on("interactionCreate", listener);
            setTimeout(() => {
                try {
                    client.off("interactionCreate", listener);
                }
                catch { }
            }, 120000);
        }
    }
    bazaarPaginationRow(title) {
        return new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
            .setCustomId("back")
            .setStyle(discord_js_1.ButtonStyle.Primary)
            .setEmoji("⬅️"), new discord_js_1.ButtonBuilder()
            .setCustomId("switch")
            .setStyle(discord_js_1.ButtonStyle.Secondary)
            .setLabel(title), new discord_js_1.ButtonBuilder()
            .setCustomId("forward")
            .setStyle(discord_js_1.ButtonStyle.Primary)
            .setEmoji("➡️"));
    }
    async bazaarPaginate(options, list1, list2) {
        const { client, interaction } = options;
        let currentList = list1;
        let label = currentList === list1 ? "collectors" : "stats";
        let msg = await interaction.editReply({
            embeds: [currentList[0]],
            components: [this.bazaarPaginationRow(label)],
            fetchReply: true,
        });
        let counter = 0;
        const listener = async (pagInter) => {
            if (!pagInter.message)
                return;
            if (pagInter.user.id !== interaction.user.id)
                return;
            if (pagInter.message.id !== msg.id)
                return;
            if (pagInter.customId === "back") {
                counter--;
                pagInter
                    .update({
                    embeds: [currentList[counter.mod(currentList.length)]],
                    components: [this.bazaarPaginationRow(label)],
                })
                    .catch(() => { });
            }
            if (pagInter.customId === "switch") {
                counter = 0;
                currentList = currentList === list1 ? list2 : list1;
                label = currentList === list1 ? "collectors" : "stats";
                pagInter
                    .update({
                    embeds: [currentList[counter.mod(currentList.length)]],
                    components: [this.bazaarPaginationRow(label)],
                })
                    .catch(() => { });
            }
            if (pagInter.customId === "forward") {
                counter++;
                pagInter
                    .update({
                    embeds: [currentList[counter.mod(currentList.length)]],
                    components: [this.bazaarPaginationRow(label)],
                })
                    .catch(() => { });
            }
        };
        client.on("interactionCreate", listener);
        setTimeout(() => {
            try {
                client.off("interactionCreate", listener);
            }
            catch { }
        }, 120000);
    }
}
exports.default = Paginator;
