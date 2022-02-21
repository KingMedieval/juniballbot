const fetch = require('node-fetch');
const { MessageEmbed } = require('discord.js');

module.exports = {
  name: "meme",
  description: "POGGERS",
  execute(message) {
    const embed = new MessageEmbed();
  	response = fetch('https://www.reddit.com/r/memes/random/.json').then((res) => {
      status = res.status;
      return res.json()
  	}).catch(console.error);
    let permalink = response[0].data.children[0].data.permalink;
    let memeUrl = `https://reddit.com${permalink}`;
    let memeImage = response[0].data.children[0].data.url;
    let memeTitle = response[0].data.children[0].data.title;
    let memeUpvotes = response[0].data.children[0].data.ups;
    let memeDownvotes = response[0].data.children[0].data.downs;
    let memeNumComments = response[0].data.children[0].data.num_comments;
    embed.addField(`${memeTitle}`, `[View thread](${memeUrl})`);
    embed.setImage(memeImage);
    embed.setFooter(`👍 ${memeUpvotes} 👎 ${memeDownvotes} 💬 ${memeNumComments}`);
    message.channel.send(embed)
        .then(sent => console.log(`Sent a reply to ${sent.author.username}`))
    console.log('Bot responded with: ' + memeImage);
  }
};
