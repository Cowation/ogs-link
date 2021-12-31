<script lang="ts">
  import type { Socket } from "socket.io-client";
  import { tweened } from 'svelte/motion';
  import { cubicOut } from 'svelte/easing';
  import { blur, scale } from "svelte/transition";
  import type Song from "./Song";
  import _ from "lodash";
import { onMount } from "svelte";
  
  export let socket: Socket | undefined;
  export let socketMessage: string | undefined;
  export let song: Song | undefined;
  export let volume: number;
  export let paused: boolean;
  export let stopped: boolean;
  export let nowLyricIndex: number | undefined;
  
  let showLyrics: boolean = false;
  let elapsedPercent: number;

  onMount(() => {
    new Image().src = 'assets/stopped.png';
    new Image().src = 'icons/rewind.png';
    new Image().src = 'icons/play.png';
    new Image().src = 'icons/pause.png';
    new Image().src = 'icons/skip.png';
    new Image().src = 'icons/sound-empty.png';
    new Image().src = 'icons/sound-full.png';
    new Image().src = 'icons/lyrics';
    new Image().src = 'icons/wave.png';
    new Image().src = 'icons/queue.png';
  });
  
  function rewind() {
    alert("This isn't gonna be implemented until way later");
  }
  
  function togglePaused() {
    socket.emit('EMIT_PAUSED');
  }

  const skip = _.throttle(function() {
    socket.emit('EMIT_SKIP');
  }, 2000);
  
  const onVolumeChange = _.debounce(function() {
    socket.emit('EMIT_VOLUME', volume);
  }, 250);
  
  const lyricsPosition = tweened(0);

  const toggleLyricsShown = _.throttle(function() {
    showLyrics = !showLyrics;
  }, 1000);

  $: {
    if (nowLyricIndex) {
      const mainLyric = document.querySelector(`#lyrics > p:nth-child(${ nowLyricIndex + 1 })`) as HTMLElement;

      if (mainLyric) {
        const yPosition = nowLyricIndex === -1 ? 0 : mainLyric.offsetTop - 200;
        lyricsPosition.set(yPosition, {
          duration: 500,
          easing: cubicOut
        });
      }
    }
  }

  lyricsPosition.subscribe((value: number) => {
    const lyricsDiv = document.getElementById('lyrics');
    if (lyricsDiv) {
      lyricsDiv.scrollTop = value;
    }
  });

  $: {
    const bg = !stopped ? song.art : 'assets/background.png'
    document.body.style.backgroundImage = `url(${bg})`;
  }
</script>
<main>
  {#if socket}
    <div id="content-container">
      <div transition:scale={{ duration: 600, start: 0.9 }} class="player">
        <img class="cover" src={ !stopped ? song.art : "assets/stopped.png" } style="transform: scale({ !paused ? 1 : 0.8 });" alt="cover art">
        <p class="spacer"></p>
        <h1>{@html (!stopped ? song.title : "Nothing") }</h1>
        <h2>{@html (!stopped ? song.creator : "Nobody") }</h2>
        <p class="spacer"></p>
        <div class="progress-bar-container">
          <input bind:value={elapsedPercent} class="progress-bar" type="range">
          <div class="progress-bar-fill" style="width: {elapsedPercent}%"></div>
        </div>
        <div class="timestamp-container">
          <p id="elapsed" class="timestamp">0:52</p>
          <p id="remaining" class="timestamp">-1:57</p>
        </div>
        <div class="controls-container">
          <input disabled={stopped} on:click={rewind} src="icons/rewind.png" class="secondary control-button" alt="rewind" type="image">
          <input disabled={stopped} on:click={togglePaused} src={(paused || stopped) ? "icons/play.png" : "icons/pause.png"} class="primary control-button" alt="play" type="image">
          <input disabled={stopped} on:click={skip} src="icons/fastforward.png" class="secondary control-button" alt="fast forward" type="image">
        </div>
        <p class="spacer"></p>
        <div class="volume-section">
          <img class="volume-icon" src="icons/sound-empty.png" alt="empty sound">
          <div id="volume-bar-container" class="progress-bar-container">
            <input on:change={onVolumeChange} id="volume-bar" bind:value={volume} class="progress-bar" type="range">
            <div class="progress-bar-fill" style="width: {volume}%"></div>
          </div>
          <img class="volume-icon" src="icons/sound-full.png" alt="full sound">
        </div>
        <p class="spacer"></p>
        <div class="misc-controls-container">
          <input id="toggle-lyrics" disabled={stopped || !song.lyrics} on:click={toggleLyricsShown} class="misc-control-button" src="icons/lyrics.png" alt="toggle lyrics" type="image">
          <input class="misc-control-button" src="icons/wave.png" alt="toggle lyrics" type="image">
          <input class="misc-control-button" src="icons/queue.png" alt="toggle lyrics" type="image">
        </div>
      </div>
      {#if !stopped && song && song.lyrics && showLyrics}
      <!-- transition:fly="{{ x: -200, duration: 500 }}" -->
        <div class="lyrics" id="lyrics">
          {#each song.lyrics as { time, words }, i (time) }
          <p class="lyric {i === nowLyricIndex ? 'main-lyric' : ''}">
            { words }
          </p>
          {/each}
        </div>
      {/if}
    </div>
  {:else}
    <h1 transition:blur={{ duration: 400 }} class='socketMessage'>{ socketMessage }</h1>
  {/if}
</main>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap');
  :global(body) {
    background: #949D4E;
    transition: background 2s ease-out;
    background-size: 100vmax;
    background-position: center;
    -webkit-backdrop-filter: blur(60px) brightness(60%);;
    backdrop-filter: blur(90px) brightness(30%);
  }

  main {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  input:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .spacer {
    margin-top: 8%
  }

  .socketMessage {
    position: absolute;
    text-align: center;
  }

  #content-container {
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
  }

  .lyrics::-webkit-scrollbar {
    display: none;
  }

  .lyrics {
    display: flex;
    -ms-overflow-style: none;
    scrollbar-width: none;
    -webkit-mask-image: linear-gradient(0deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 1) 12%, rgba(0, 0, 0, 1) 88%, rgba(255, 255, 255, 0) 100%);
    mask-image: linear-gradient(0deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 1) 12%, rgba(0, 0, 0, 1) 88%, rgba(255, 255, 255, 0) 100%);
    overflow-y: scroll;
    overflow-x: hidden;
    flex-direction: column;
    margin-left: 80px;
    justify-content: start;
    align-items: left;
    max-width: 30vw;
    max-height: 90vh;
    padding: 20px;
  }

  .lyric {
    font-size: 42px;
    transform-origin: left;
    transform: scale(0.9);
    transition: all 0.2s cubic-bezier(0.165, 0.84, 0.44, 1) 0s;
    font-weight: 700;
    color: transparent;
    text-shadow: 0 0 6px rgba(255, 255, 255, 0.3);
    text-align: left;
    margin: 22px 0;
  }

  .main-lyric {
    transform: scale(1);
    transition: all 0.2s cubic-bezier(0.165, 0.84, 0.44, 1) 0s;
    text-shadow: none;
    color: #FFFFFF;
  }

  .player {
    margin-left: 20px;
    margin-right: 20px;
    max-height: 75vh;
    aspect-ratio: 0.55;
  }

  .cover {
    object-fit: cover;
    max-width: 100%;
    aspect-ratio: 1;
    border-radius: 10px;
    -webkit-box-shadow: 0px 0px 30px 0px rgba(0, 0, 0, 0.25);
    box-shadow: 0px 0px 30px 0px rgba(0, 0, 0, 0.25);
    -webkit-transition: transform 0.5s cubic-bezier(0.26, 1.18, 0.57, 1.17);
    transition: transform 0.5s cubic-bezier(0.26, 1.18, 0.57, 1.17);
  }

  .progress-bar-container {
    position: relative;
    height: 4px;
    width: 100%
  }

  .progress-bar {
    position: absolute;
    appearance: none;
    margin: 0;
    padding: 0;
    width: 100%;
    height: 4px;
    outline: none;
    border: none;
    border-radius: 2px;
    background-color: #777777;
  }

  .progress-bar::-webkit-slider-thumb {
    appearance: none;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #FFFFFF;
    cursor: pointer;
    -webkit-box-shadow: 0px 0px 20px 0px rgba(0, 0, 0, 0.8);
    box-shadow: 0px 0px 20px 0px rgba(0, 0, 0, 0.8);
  }

  #volume-bar-container {
    margin: 0 10px;
  }

  #volume-bar::-webkit-slider-thumb {
    transition: transform 0.1s cubic-bezier(0.23, 1, 0.320, 1);
    width: 15px;
    height: 15px;
  }

  #volume-bar::-webkit-slider-thumb:hover {
    transform: scale(1.15);
  }

  #volume-bar::-webkit-slider-thumb:active {
    transform: scale(0.95);
  }

  .progress-bar-fill {
    position: absolute;
    pointer-events: none;
    left: 0;
    top: 0;
    width: 50%;
    height: 4px;
    border-radius: 2px;
    background: #FFFFFF;
    z-index: 0;
  }

  .volume-section {
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
  }

  .volume-icon {
    width: 25px;
    height: 25px;
  }

  .timestamp-container {
    display: flex;
    margin-top: 8px;
    flex-direction: row;
    justify-content: space-between;
  }

  .timestamp {
    font-family: 'Roboto', sans-serif;
    font-size: 0.8em;
    margin: 0;
    color: #FFFFFF;
    opacity: 0.6;
  }

  .controls-container {
    display: flex;
    margin-top: 1.5vh;
    flex-direction: row;
    justify-content: space-between;
    height: 9vh;
    width: 100%;
  }

  .control-button {
    margin: 0;
    border: none;
    transition: transform 0.2s ease-out;
    max-height: 100%;
    object-fit: contain;
  }

  .control-button:hover {
    transform: scale(1.15);
  }

  .control-button:active {
    transition: transform 0.05s ease-out;
    transform: scale(0.95);
  }

  .misc-controls-container {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }

  .misc-control-button {
    border: none;
    object-fit: contain;
    transition: transform 0.2s ease-out;
    height: 6vh;
  }

  .misc-control-button:hover {
    transform: scale(1.15);
  }

  .misc-control-button:active {
    transition: transform 0.05s ease-out;
    transform: scale(0.95);
  }

  h1,
  h2,
  p {
    font-family: 'Roboto', sans-serif;
  }

  h1,
  h2 {
    font-size: 1.35em;
    margin: 0;
    overflow: hidden;
  }

  h1 {
    font-weight: 700;
    color: #FFFFFF;
  }

  h2 {
    font-weight: 400;
    color: #B5B5B5;
  }
</style>