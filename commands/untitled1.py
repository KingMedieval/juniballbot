#!/usr/bin/env python
# -*- coding: utf-8 -*-

import click
from pathlib import Path

from deezer import Deezer
from deezer import TrackFormats

from deemix import generateDownloadObject
from deemix.settings import load as loadSettings
from deemix.utils import getBitrateNumberFromText, formatListener
import deemix.utils.localpaths as localpaths
from deemix.downloader import Downloader
from deemix.itemgen import GenerationError
from deemix.plugins.spotify import Spotify


class LogListener:
    @classmethod
    def send(cls, key, value=None):
        logString = formatListener(key, value)
        if logString: print(logString)


@click.command()
@click.option('--portable', is_flag=True, help='Creates the config folder in the same directory where the script is launched')
@click.option('-b', '--bitrate', default=128, help='Overwrites the default bitrate selected')
@click.option('-p', '--path', type=str, default='./sounds', help='Downloads in the given folder')
@click.argument('url', nargs=-1, required=True)
def download(url, bitrate, portable, path):
    # Check for local configFolder
    localpath = Path('.')
    configFolder = localpath / 'config' if portable else localpaths.getConfigFolder()

    settings = loadSettings(configFolder)
    dz = Deezer(settings.get('tagsLanguage', ""))
    listener = LogListener()

    def requestValidArl():
        while True:
            arl = "1565afb649c55f87f26d28a57f0b1bba546cc9b992c554ceb93635b095527b4808d14eaadd4a637c130b8a1227db1e94a7f8084a78625889c1299681f42beec05ca1b2f7d889f11663b3f75a4fb3fdb5318a4413afdfcff67c3e5f53f3d74ecd"
            if dz.login_via_arl(arl.strip()): break
        return arl

    if (configFolder / '.arl').is_file():
        with open(configFolder / '.arl', 'r') as f:
            arl = f.readline().rstrip("\n").strip()
        if not dz.login_via_arl(arl): arl = requestValidArl()
    else: arl = requestValidArl()
    with open(configFolder / '.arl', 'w') as f:
        f.write(arl)

    plugins = {
        "spotify": Spotify()
    }
    plugins["spotify"].setup()

    def downloadLinks(url, bitrate=128):
        if not bitrate: bitrate = settings.get("maxBitrate", TrackFormats.MP3_128)
        links = []
        for link in url:
            if ';' in link:
                for l in link.split(";"):
                    links.append(l)
            else:
                links.append(link)

        downloadObjects = []

        for link in links:
            try:
                downloadObject = generateDownloadObject(dz, link, bitrate, plugins, listener)
            except GenerationError as e:
                print(f"{e.link}: {e.message}")
                continue
            if isinstance(downloadObject, list):
                downloadObjects += downloadObject
            else:
                downloadObjects.append(downloadObject)

        for obj in downloadObjects:
            print(obj.__type__)
            if obj.__type__ == "Convertable":
                obj = plugins[obj.plugin].convert(dz, obj, settings, listener)
            Downloader(dz, obj, settings, listener).start()


    if path is not None:
        if path == '': path = '.'
        path = Path(path)
        settings['downloadLocation'] = str(path)
    url = list(url)
    if bitrate: bitrate = getBitrateNumberFromText(bitrate)

    # If first url is filepath readfile and use them as URLs
    try:
        isfile = Path(url[0]).is_file()
    except Exception:
        isfile = False
    if isfile:
        filename = url[0]
        with open(filename) as f:
            url = f.readlines()

    downloadLinks(url, bitrate)
    click.echo("All done!")

if __name__ == '__main__':
    download() # pylint: disable=E1120
