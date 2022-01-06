const { PREFIX, LOCALE } = require("../util/botUtil");
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
  name: "musics",
  description: "beta. deemix",
  aliases: ["ms"],
  async execute(message, args) {

    searchID = args.join(" ");

    response = await fetch(`https://api.deezer.com/search?q="${searchID}"`).then((res) => {
      status = res.status;
      return res.json()
    });

    if(response.total == 0) {
      console.log("Search not found.");
      let responseEmbed = new MessageEmbed()
      .setTitle("Search not found")
      .setDescription(`The search term ${args} did not come back with results`)
      .setColor("#CC38B");

      let responseMsg = await message.channel.send(responseEmbed);

      return;
    }
    else {
      let responseEmbed = new MessageEmbed()
      .setTitle("The song is loading....")
      .setDescription("This may take a while. Please be patient.")
      .setColor("#CC38B");

      let responseMsg = await message.channel.send(responseEmbed);

      if(response.data[0].title.includes('/')) {
        response.data[0].title = response.data[0].title.replace('/','_');
      }
      let file_name = `${response.data[0].artist.name} - ${response.data[0].title}`;
      console.log(file_name);
      trackID = response.data[0].id;

      song = {
        title: `${response.data[0].artist.name} - ${response.data[0].title}`,
        url: response.data[0].link,
        duration: response.data[0].duration
      };
      }

    console.log("1");



    /*var fs = require('fs');
    await fs.rename(`./sounds/${file_name}.mp3`, './sounds/currPlaying.mp3', function(err) {
        if ( err ) console.log('ERROR: ' + err);
    });*/
    console.log("2");
    await pythonDL(trackID, song);
    console.log("3");
    responseMsg.delete().catch(console.error);
    await conversion(song);
    const { channel } = message.member.voice;
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
        .send(i18n.__mf("play.queueAdded", { title: song.title, author: message.author }))
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
      return message.channel.send(i18n.__('play.cantJoinChannel', {error: error})).catch(console.error);
    }

  }
};

function pythonDL(trackID, song) {
  return new Promise((resolve, reject) => {

    let options = {
      scriptPath: './commands',
      args: [`https://www.deezer.com/en/track/${trackID}`]
    };

    if(fs.existsSync(`./sounds/${song.title}.mp3`)){
      console.log('skipped download');
      resolve();
    }
    else {
      PythonShell.run('untitled1.py', options, function (err, results) {
        if (err) throw err;
        // results is an array consisting of messages collected during execution
        console.log('results: %j', results);
        resolve();
      });
    }
  });
};

function conversion(song) {
  return new Promise((resolve, reject) => {
    if(fs.existsSync(`./sounds/${song.title}.ogg`)){
      console.log('skipped conversion');
      resolve();
    }
    else {
      ffmpeg(`./sounds/${song.title}.mp3`)
        .format('ogg')
        .audioCodec('libopus')
        .audioQuality(0)
        .on('error', (err) => console.error(err))
        .on('end', () => {
          console.log('converted');
          resolve();
        })
        .save(`./sounds/${song.title}.ogg`);
    }
  });
};
