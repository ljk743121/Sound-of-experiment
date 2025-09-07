<template>
  <div>
    <ul>
      <li v-for="track in tracks" :key="track.id">
        <button type="button" @click="onPlayAsPlaylist(tracks, track)">
          {{ isTrackPlaying(track.id) ? "Pause" : "Play" }}
        </button>
        {{ track.title }}
      </li>
    </ul>
  </div>
  <MusicFlow
    :options=options
  />
</template>

<script setup lang="ts">
import type { TMusicFlow } from '~~/types';
const { onPlayAsPlaylist, isTrackPlaying } = useMusicFlow();



const options = {
  "height": 30,
  "waveColor": "#c9f3e8",
  "progressColor": "#1d7ed7",
  "cursorColor": "#ffffff",
  "cursorWidth": 1,
  "barWidth": 4,
  "barGap": 4,
  "barRadius": 4,
  "barHeight": 0.8,
  "minPxPerSec": 0,
  "autoScroll": false,
  "autoCenter": false,
  "hideScrollbar": false,
  "interact": true,
  "autoplay": false
}

const tracks: TMusicFlow[] = [
  {
    id: 1,
    audio:
      "https://m7.music.126.net/20250906205610/4b8dd32be07f109a38099d6f143f74b3/ymusic/MTIwMjIzMjc1/91fa95b46b1b491c41e3dd4b3da5b34d.mp3?vuutv=L2imsymKgIvQ6IpBxjPPQCG+2xIk6kn1F/LBrbS/IcXKNkDHCCmjFVfaM6Clmuz07H2p9nPGuZZSIbEPaOnHOZSJNHre0W28iRALUCo+Kf0=&cdntag=bWFyaz1vc193ZWIscXVhbGl0eV9oaWdoZXI",
    title: "Sample Audio 1#",
    artist: "John Walkers",
    artwork: "http://p2.music.126.net/bA7B8NnDpjG90qTWTfvtrw==/3402988488404571.jpg?param=130y130",
    album: "Free Audio",
    original: {
      source:
        "https://file-examples.com/index.php/sample-audio-files/sample-mp3-download/",
    },
  },
  {
    id: 2,
    audio:
      "https://file-examples.com/storage/fefc0d228767c931e9c16ed/2017/11/file_example_MP3_1MG.mp3",
    title: "Sample Audio 2#",
    artist: "Steve Rooney",
    artwork: "https://placehold.co/512x512",
    album: "Free Audio",
    original: {
      source:
        "https://file-examples.com/index.php/sample-audio-files/sample-mp3-download/",
    },
  },
  {
    id: 3,
    audio:
      "https://file-examples.com/storage/fefc0d228767c931e9c16ed/2017/11/file_example_MP3_2MG.mp3",
    title: "Sample Audio 3#",
    artist: "Julie Rock",
    artwork: "https://placehold.co/512x512",
    album: "Free Audio",
    original: {
      source:
        "https://file-examples.com/index.php/sample-audio-files/sample-mp3-download/",
    },
  },
  {
    id: 4,
    audio:
      "https://file-examples.com/storage/fefc0d228767c931e9c16ed/2017/11/file_example_MP3_5MG.mp3",
    title: "Sample Audio 4#",
    artist: "Hans Broom",
    artwork: "https://placehold.co/512x512",
    album: "Free Audio",
    original: {
      source:
        "https://file-examples.com/index.php/sample-audio-files/sample-mp3-download/",
    },
  },
];
</script>
