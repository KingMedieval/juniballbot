const { MessageEmbed } = require("discord.js");
const { LOCALE } = require("../util/botUtil");
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

        searchID = args.join(" ");
        encodedSearchID = encodeURI(searchID);

      let resultsEmbed = new MessageEmbed()
        .setTitle(i18n.__("search.resultEmbedTtile"))
        .setDescription(i18n.__mf("search.resultEmbedDesc", { search: search }))
        .setColor("#F8AA2A");

      try {
        response = await fetch(`https://api.deezer.com/search?q="${encodedSearchID}"`).then((res) => {
          status = res.status;
          return res.json()
        });
        if(response.data[0].title.includes('/')) {
          response.data[0].title = response.data[0].title.replace('/','_');
        }
        response.map((data[0], index) => resultsEmbed.addField(data[0].link, `${index + 1}. ${data[0].title} - ${data[0].artist.name}`))
        let resultsMessage = await message.channel.send(resultsEmbed);
        function filter(msg) {
          const pattern = /^[0-9]{1,2}(\s*,\s*[0-9]{1,2})*$/;
          return pattern.test(msg.content);
      }



  }
};
