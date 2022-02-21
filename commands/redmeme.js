const fetch = require('node-fetch');
const { MessageEmbed } = require('discord.js');

module.exports = {
  name: "redmeme",
  description: "☭POGGERS",
  async execute(message) {
    const embed = new MessageEmbed();
  	response = await fetch('https://www.reddit.com/r/CommunismMemes/random/.json').then((res) => {
      status = res.status;
      return res.json()
  	}).catch(console.error);

    console.log(response);
    let permalink = response[0].data.children[0].data.permalink;
    let redmemeUrl = `https://reddit.com${permalink}`;
    let redmemeImage = response[0].data.children[0].data.url;
    let redmemeTitle = response[0].data.children[0].data.title;
    let redmemeUpvotes = response[0].data.children[0].data.ups;
    let redmemeDownvotes = response[0].data.children[0].data.downs;
    let redmemeNumComments = response[0].data.children[0].data.num_comments;
    embed.addField(`${redmemeTitle}`, `[View thread](${redmemeUrl})`);
    embed.setImage(redmemeImage);
    embed.setFooter(`👍 ${redmemeUpvotes} 👎 ${redmemeDownvotes} 💬 ${redmemeNumComments}`);
    message.channel.send(embed)
        .then(sent => console.log(`Sent a reply to ${sent.author.username}`))
    console.log('Bot responded with: ' + redmemeImage);
  }
};
