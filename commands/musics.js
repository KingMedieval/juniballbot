const { PREFIX, LOCALE } = require("../util/botUtil");
const { play } = require("../include/play");
const { PythonShell } = require('python-shell');
const fetch = require('node-fetch');
const i18n = require("i18n");
i18n.setLocale(LOCALE);
//const trackID = 593688912
//link = https://www.deezer.com/en/track/593688912

module.exports = {
  name: "musics",
  description: "beta. deemix",
  async execute(message, args) {

    searchID = args.join(" ");

    response = await fetch(`https://api.deezer.com/search?q="${searchID}"`).then((res) => {
      status = res.status;
      return res.json()
    });

    console.log("1");

    let file_name = `${response.data[0].artist.name} - ${response.data[0].title}`;
    console.log(file_name);
    trackID = response.data[0].id;

    song = {
      title: `${response.data[0].artist.name} - ${response.data[0].title}`,
      url: response.data[0].link,
      duration: response.data[0].duration
    };

    /*var fs = require('fs');
    await fs.rename(`./sounds/${file_name}.mp3`, './sounds/currPlaying.mp3', function(err) {
        if ( err ) console.log('ERROR: ' + err);
    });*/
    console.log("2");
    await pythonDL(trackID);
    console.log("3");

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

function pythonDL(trackID) {
  return new Promise((resolve, reject) => {
    let options = {
      scriptPath: './commands',
      args: [`https://www.deezer.com/en/track/${trackID}`]
    };

    PythonShell.run('untitled1.py', options, function (err, results) {
      //PythonShell.on('Paste here your arl:', function (message) {
      //  PythonShell.send('1565afb649c55f87f26d28a57f0b1bba546cc9b992c554ceb93635b095527b4808d14eaadd4a637c130b8a1227db1e94a7f8084a78625889c1299681f42beec05ca1b2f7d889f11663b3f75a4fb3fdb5318a4413afdfcff67c3e5f53f3d74ecd');
      //});
      if (err) throw err;
      // results is an array consisting of messages collected during execution
      console.log('results: %j', results);
      resolve();
    });
  });
};