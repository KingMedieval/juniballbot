const { PREFIX, LOCALE } = require("../util/botUtil");
const { MessageEmbed } = require("discord.js");
const { play } = require("../include/play");
const { PythonShell } = require('python-shell');
const fetch = require('node-fetch');
const i18n = require("i18n");
const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs");
i18n.setLocale(LOCALE);
//const trackID = 593688912
//link = https://www.deezer.com/en/track/593688912

module.exports = {
  name: "bili",
  description: "plays music but not from youtube. Can be slow for some songs.",
  aliases: ["bi"],
  async execute(message, args) {

    let searchID = args.join(" ");
    let bvid = searchID.slice(31, 43);
    response = await fetch(`https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`).then((res) => {
      status = res.status;
      return res.json()
    });
    if (response.code != 0) {
      let responseEmbed = new MessageEmbed()
        .setTitle("Search not found")
        .setDescription(`The search term ${searchID} did not come back with results`)
        .setColor("#DC143C");

      let responseMsg = await message.channel.send(responseEmbed);

      return;
    }
    else {
      let responseEmbed = new MessageEmbed()
        .setTitle("The song is loading....")
        .setDescription("This may take a while. Please be patient.")
        .setColor("#CC38B");
      responseMsg = await message.channel.send(responseEmbed);
      song = {
        title: response.data.title,
        url: `https://www.bilibili.com/video/${bvid}`,
        duration: response.data.duration
      };
    }
    console.log("1");
    console.log("2");
    await pythonDL(song.url, bvid);
    console.log(`3, ${song.url}`);
    await conversion(bvid);
    responseMsg.delete().catch(console.error);
    const {
      channel
    } = message.member.voice;
    const queue = message.client.queue.get(message.guild.id);
    const serverQueue = message.client.queue.get(message.guild.id);

    const queueConstruct = {
      textChannel: message.channel,
      channel,
      connection: null,
      songs: [],
      loop: false,
      volume: 100,
      playing: true
    };

    if (serverQueue) {
      serverQueue.songs.push(song);
      return serverQueue.textChannel
        .send(i18n.__mf("play.queueAdded", {
          title: song.title,
          author: message.author
        }))
        .catch(console.error);
    }

    queueConstruct.songs.push(song);

    message.client.queue.set(message.guild.id, queueConstruct);
    console.log("4");
    try {
      queueConstruct.connection = await channel.join();
      await queueConstruct.connection.voice.setSelfDeaf(true);
      play(queueConstruct.songs[0], message);
    } catch (error) {
      console.error(error);
      message.client.queue.delete(message.guild.id);
      await channel.leave();
      return message.channel.send(i18n.__('play.cantJoinChannel', {
        error: error
      })).catch(console.error);
    }
    if (fs.existsSync(`./bilibili/${bvid}.flv`)) {
      fs.unlinkSync(`./bilibili/${bvid}.flv`);
    }
  }
};

function pythonDL(searchID, bvid) {
  return new Promise((resolve, reject) => {
    let options = {
      scriptPath: './commands',
      args: ['--format=flv360', '-O', `${bvid}`, '-o', './bilibili', '--no-caption', `${searchID}`]
    };
    console.log(options.args);

      PythonShell.run('you-get.py', options, function(err, results) {
        if (err) throw err;
        // results is an array consisting of messages collected during execution
        console.log('results: %j', results);
        resolve();
      });
  });
};

function conversion(bvid) {
  return new Promise((resolve, reject) => {
      ffmpeg(`./bilibili/${bvid}.flv`)
        .format('ogg')
        .audioCodec('libopus')
        .audioQuality(0)
        .inputOptions('-vn')
        .on('error', (err) => console.error(err))
        .on('end', () => {
          console.log('converted');
          resolve();
        })
        .save(`./bilibili/${bvid}.ogg`);
  });
};
