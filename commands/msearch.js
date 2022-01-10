const { MessageEmbed } = require("discord.js");
const i18n = require("i18n");

i18n.setLocale(LOCALE);

module.exports = {
  name: "msearch",
  description: "deezer search cause deezer sucks",
  async execute(message, args) {
    if (!args.length)
      return message
        .reply(i18n.__mf("search.usageReply", { prefix: message.client.prefix, name: module.exports.name }))
        .catch(console.error);
      if (message.channel.activeCollector) return message.reply(i18n.__("search.errorAlreadyCollector"));
      if (!message.member.voice.channel)
        return message.reply(i18n.__("search.errorNotChannel")).catch(console.error);

      const search = args.join(" ");

      let resultsEmbed = new MessageEmbed()
        .setTitle(i18n.__("search.resultEmbedTtile"))
        .setDescription(i18n.__mf("search.resultEmbedDesc", { search: search }))
        .setColor("#F8AA2A");


  }
};
