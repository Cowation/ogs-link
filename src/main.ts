import io from 'socket.io-client';
import App from './App.svelte';
import type Song from './Song';

const GUILD_ID = '790647809460142080';

// Change this value in prod or set it to use same origin
const socket = io('https://ogs-player.herokuapp.com', {});

const defaultProps = {
  socket: undefined,
  socketMessage: 'Connecting...',
  song: undefined,
  volume: 100,
  paused: true,
  stopped: true,
  nowLyricIndex: undefined
};

/**
 * TODO: This code shouldn't be here!
 * Instead, it should be in the <script> tags in App.svelte.
 * 
 * Also, when implementing startedPlaying, ensure OGs Link is
 * set for accepting the new value.
 * 
 * Find some way to load lyrics and display them in the app.
 * In the process, also figure out the transition and animate directives.
 */

const app = new App({
  target: document.body,
  props: defaultProps
});

socket.on('connect', () => {
  app.$set({ socket: socket });

  socket.emit('INIT', GUILD_ID);
});

socket.on('disconnect', () => {
  app.$set({
    ...defaultProps,
    socket: undefined,
  });
});

socket.on('PLAYING', (song: Song | undefined) => {
  console.log('song', song);
  app.$set({ song: song, stopped: song ? false : true, nowLyricIndex: -1 });
});

socket.on('PAUSED', (paused: boolean) => {
  console.log('paused', paused);
  app.$set({ paused: paused });
});

socket.on('VOLUME', (volume: number) => {
  console.log('volume', volume);
  app.$set({ volume: volume });
});

socket.on('LYRIC', (index: number) => {
  console.log('lyric', index);
  app.$set({ nowLyricIndex: index });
});

export default app;