const {
  MessageEmbed
} = require("discord.js");
const {
  LOCALE
} = require("../util/botUtil");
const i18n = require("i18n");
const fetch = require('node-fetch');
i18n.setLocale(LOCALE);

module.exports = {
  name: "msearch",
  description: "deezer search cause deezer sucks",
  async execute(message, args) {
    if (!args.length)
      return message
        .reply(i18n.__mf("search.usageReply", {
          prefix: message.client.prefix,
          name: module.exports.name
        }))
        .catch(console.error);
    if (message.channel.activeCollector) return message.reply(i18n.__("search.errorAlreadyCollector"));
    if (!message.member.voice.channel)
      return message.reply(i18n.__("search.errorNotChannel")).catch(console.error);

    searchID = args.join(" ");
    encodedSearchID = encodeURI(searchID);

    let resultsEmbed = new MessageEmbed()
      .setTitle(i18n.__("search.resultEmbedTtile"))
      .setDescription(i18n.__mf("search.resultEmbedDesc", {
        search: searchID
      }))
      .setColor("#F8AA2A");

    try {
      result = await fetch(`https://api.deezer.com/search?q="${encodedSearchID}"`).then((res) => {
        status = res.status;
        return res.json()
      });
      for (let i = 0; i < 10; i++) {
        resultsEmbed.addField(result.data[i].link, `${i + 1}. ${result.data[i].title} - ${result.data[i].artist.name}`)
      }

      let resultsMessage = await message.channel.send(resultsEmbed);

      function filter(msg) {
        const pattern = /^[0-9]{1,2}(\s*,\s*[0-9]{1,2})*$/;
        return pattern.test(msg.content);
      }
      message.channel.activeCollector = true;
      const response = await message.channel.awaitMessages(filter, {
        max: 1,
        time: 30000,
        errors: ["time"]
      });
      const reply = response.first().content;


      if (reply.includes(",")) {
        let songs = reply.split(",").map((str) => str.trim());

        for (let song of songs) {
          await message.client.commands
            .get("music")
            .execute(message, [resultsEmbed.fields[parseInt(song) - 1].name]);
        }
      } else {
        const choice = resultsEmbed.fields[parseInt(response.first()) - 1].name;
        message.client.commands.get("music").execute(message, [choice]);
      }

      message.channel.activeCollector = false;
      resultsMessage.delete().catch(console.error);
      response.first().delete().catch(console.error);
    } catch (error) {
      console.error(error);
      message.channel.activeCollector = false;
      message.reply(error.message).catch(console.error);

    }
  }
};
