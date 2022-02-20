const { PREFIX, LOCALE } = require("../util/botUtil");
const { MessageEmbed } = require("discord.js");
const { play } = require("../include/play");
const { PythonShell } = require('python-shell');
const fetch = require('node-fetch');
const i18n = require("i18n");
const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs");
const util = require('util');
const exec = util.promisify(require('child_process').exec);
i18n.setLocale(LOCALE);
//const trackID = 593688912
//link = https://www.deezer.com/en/track/593688912

module.exports = {
  name: "bili",
  description: "plays music but not from youtube. Can be slow for some songs.",
  aliases: ["bi"],
  async execute(message, args) {

    let searchID = args.join(" ");

    if (searchID.includes("https://www.deezer.com")) {
      trackID = searchID.slice(29);
      console.log(trackID);
      response = await fetch(`https://api.deezer.com/track/${trackID}`).then((res) => {
        status = res.status;
        return res.json()
      });
      if (status == 800) {
        console.log("Search not found.");
        let responseEmbed = new MessageEmbed()
          .setTitle("Search not found")
          .setDescription(`The search term ${searchID} did not come back with results`)
          .setColor("#DC143C");

        let responseMsg = await message.channel.send(responseEmbed);

        return;
      } else {
        let responseEmbed = new MessageEmbed()
          .setTitle("The song is loading....")
          .setDescription("This may take a while. Please be patient.")
          .setColor("#CC38B");

        responseMsg = await message.channel.send(responseEmbed);

        if (response.title.includes('/')) {
          response.title = response.title.replace('/', '_'); }
          file_name = `${response.artist.name} - ${response.title}`;
          console.log(file_name);
          song = {
            title: `${response.artist.name} - ${response.title}`,
            url: response.link,
            duration: response.duration
          };
      }
    } else {
      let encodedSearchID = encodeURI(searchID);

      response = await fetch(`https://api.deezer.com/search?q="${encodedSearchID}"`).then((res) => {
        status = res.status;
        return res.json()
      });

      if (response.total == 0) {
        console.log("Search not found.");
        let responseEmbed = new MessageEmbed()
          .setTitle("Search not found")
          .setDescription(`The search term ${searchID} did not come back with results`)
          .setColor("#DC143C");

        let responseMsg = await message.channel.send(responseEmbed);

        return;
      } else {
        let responseEmbed = new MessageEmbed()
          .setTitle("The song is loading....")
          .setDescription("This may take a while. Please be patient.")
          .setColor("#CC38B");

        responseMsg = await message.channel.send(responseEmbed);

        if (response.data[0].title.includes('/')) {
          response.data[0].title = response.data[0].title.replace('/', '_');
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
    }

    console.log("1");
    console.log("2");
    await pythonDLL(trackID, song);
    console.log("3");
    await conversion(song);
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

    if (fs.existsSync(`./sounds/${song.title}.mp3`)) {
      fs.unlinkSync(`./sounds/${song.title}.mp3`);
    }
  }
};

function pythonDLL(trackID, song) {
  return new Promise((resolve, reject) => {

    let dlurl = `https://www.deezer.com/en/track/${trackID}`;
    if (fs.existsSync(`./sounds/${song.title}.ogg`)) {
      console.log('skipped download');
      resolve();
    } else {
        try {
          const { stdout, stderr } = await exec('ls | grep js');
          console.log('stdout:', stdout);
          console.log('stderr:', stderr);
        } catch (err)=>{
          console.error(err);
    };
      resolve();
    }
  });
};

function pythonDL(trackID, song) {
  return new Promise((resolve, reject) => {

    let options = {
      scriptPath: './commands',
      args: [`https://www.deezer.com/en/track/${trackID}`]
    };

    if (fs.existsSync(`./sounds/${song.title}.ogg`)) {
      console.log('skipped download');
      resolve();
    } else {
      PythonShell.run('untitled1.py', options, function(err, results) {
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
    if (fs.existsSync(`./sounds/${song.title}.ogg`)) {
      console.log('skipped conversion');
      resolve();
    } else {
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
