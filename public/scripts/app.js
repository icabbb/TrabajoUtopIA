let progressInterval;
let trackQueue = []; // Cola de canciones
let currentTrackIndex = 0; // Índice de la canción actual

document.addEventListener('DOMContentLoaded', function () {
  fetchTopArtists();

  window.onSpotifyWebPlaybackSDKReady = () => {
    const token = window.spotifyToken;
    const player = new Spotify.Player({
      name: 'Web Playback SDK Player',
      getOAuthToken: cb => { cb(token); },
      volume: 0.5
    });

    // Ready
    player.addListener('ready', ({ device_id }) => {
      console.log('Ready with Device ID', device_id);
      window.deviceId = device_id; // Guardar el ID del dispositivo
      setDeviceActive(device_id, token);
    });

    // Player State Changed
    player.addListener('player_state_changed', state => {
      if (!state) {
        return;
      }
      const currentTrack = state.track_window.current_track;
      document.getElementById('track-name').innerText = currentTrack.name;
      document.getElementById('artist-name').innerText = currentTrack.artists.map(artist => artist.name).join(', ');
      updateProgress(state.position, state.duration);
      updateBackgroundImage(currentTrack.album.images[0].url);

      // Controlar la animación del vinilo
      const vinyl = document.getElementById('vinyl');
      if (state.paused) {
        vinyl.classList.add('paused');
        clearInterval(progressInterval);
      } else {
        vinyl.classList.remove('paused');
        startProgressInterval(player);
      }

      // Reproducción automática de la siguiente canción al finalizar
      if (state.position === 0 && state.paused && currentTrackIndex < trackQueue.length - 1) {
        nextTrack();
      }
    });

    // Not Ready
    player.addListener('not_ready', ({ device_id }) => {
      console.log('Device ID has gone offline', device_id);
    });

    player.connect();
    window.player = player; // Guardar el reproductor en una variable global
  };
  const volumeSlider = document.getElementById('volume');
  volumeSlider.addEventListener('input', (e) => {
    const volume = e.target.value / 100; // Convertir a un valor entre 0 y 1
    window.player.setVolume(volume).then(() => {
      console.log(`Volume set to ${volume}`);
    });
  });

  const miniProgress = document.getElementById('mini-progress');
  miniProgress.addEventListener('input', (e) => {
    const newPosition = e.target.value;
    window.player.seek(newPosition * 1000).then(() => {
      console.log(`Changed position to ${newPosition}`);
    });
  });

});

async function fetchTopArtists() {
  try {
    const response = await fetch('/music/top-artists');
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data = await response.json();
    displayTopArtists(data.items);
  } catch (error) {
    console.error('Error fetching top artists:', error);
  }
}

function displayTopArtists(artists) {
  const container = document.getElementById('artists-container');
  if (!container) {
    console.error('artists-container not found');
    return;
  }
  container.innerHTML = '';
  artists.forEach(artist => {
    const card = document.createElement('div');
    card.className = 'artist-card';
    card.innerHTML = `
      <img src="${artist.images[0].url}" alt="${artist.name}" />
      <h3>${artist.name}</h3>
      <button onclick="fetchTopSongs('${artist.id}')">Ver Canciones</button>
    `;
    container.appendChild(card);
  });
}

async function fetchTopSongs(artistId) {
  try {
    const response = await fetch(`/music/top-songs?artistId=${artistId}`);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data = await response.json();
    displayTopSongs(data.tracks);
  } catch (error) {
    console.error('Error fetching top songs:', error);
  }
}

function displayTopSongs(tracks) {
  const container = document.getElementById('songs-container');
  if (!container) {
    console.error('songs-container not found');
    return;
  }
  container.innerHTML = '';
  tracks.forEach(track => {
    const card = document.createElement('div');
    card.className = 'song-card';
    card.innerHTML = `
      <img src="${track.album.images[0].url}" alt="${track.name}" />
      <h3>${track.name}</h3>
      <p>${track.artists.map(artist => artist.name).join(', ')}</p>
      <button onclick="playTrack('${track.uri}', '${track.name}', '${track.artists.map(artist => artist.name).join(', ')}', '${track.album.images[0].url}')">Play <i class="fas fa-play"></i></button>
      <button onclick="addToQueue('${track.uri}', '${track.name}', '${track.artists.map(artist => artist.name).join(', ')}', '${track.album.images[0].url}')">Añadir a la cola <i class="fas fa-plus"></i></button>
    `;
    container.appendChild(card);
  });
}

function addToQueue(uri, trackName, artistName, albumImage) {
  trackQueue.push({ uri, trackName, artistName, albumImage });
  console.log(`Added to queue: ${trackName} by ${artistName}`);
}

async function playTrack(uri, trackName, artistName, albumImage) {
  const token = window.spotifyToken;
  const deviceId = window.deviceId;
  if (!deviceId) {
    console.error('No device ID found');
    return;
  }

  try {
    await fetch(`/music/playTrack`, {
      method: 'POST',
      body: JSON.stringify({ uri }),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    });
    openModal(trackName, artistName, albumImage);
    currentTrackIndex = trackQueue.findIndex(track => track.uri === uri);
  } catch (error) {
    console.error('Error playing track:', error);
  }
}

function openModal(trackName, artistName, albumImage) {
  const modal = document.getElementById('player-modal');
  document.getElementById('track-name').innerText = trackName;
  document.getElementById('artist-name').innerText = artistName;
  updateBackgroundImage(albumImage);
  modal.style.display = 'block';
}

function closeModal() {
  const modal = document.getElementById('player-modal');
  modal.style.display = 'none';
  window.player.getCurrentState().then(state => {
    if (state) {
      showMiniPlayer(state.track_window.current_track);
    }
  });
}

function showMiniPlayer(currentTrack) {
  const miniPlayer = document.getElementById('mini-player');
  const miniAlbumCover = document.getElementById('mini-album-cover');
  const trackName = document.getElementById('track-name').innerText;
  const artistName = document.getElementById('artist-name').innerText;

  miniAlbumCover.src = currentTrack.album.images[0].url;
  document.getElementById('mini-track-name').innerText = trackName;
  document.getElementById('mini-artist-name').innerText = artistName;
  miniPlayer.style.display = 'block';
}

function togglePlayPause() {
  const player = window.player;
  const playPauseButton = document.querySelector('.control-btn[onclick="togglePlayPause()"] i');
  const miniPlayPauseButton = document.querySelector('.mini-control-btn[onclick="togglePlayPause()"] i');
  
  player.getCurrentState().then(state => {
    if (!state) {
      console.error('Player state is null');
      return;
    }
    if (state.paused) {
      player.resume().then(() => {
        const vinyl = document.getElementById('vinyl');
        vinyl.classList.remove('paused');
        startProgressInterval(player);
        playPauseButton.classList.remove('fa-play');
        playPauseButton.classList.add('fa-pause');
        miniPlayPauseButton.classList.remove('fa-play');
        miniPlayPauseButton.classList.add('fa-pause');
        showMiniPlayer(state.track_window.current_track);
      });
    } else {
      player.pause().then(() => {
        const vinyl = document.getElementById('vinyl');
        vinyl.classList.add('paused');
        clearInterval(progressInterval);
        playPauseButton.classList.remove('fa-pause');
        playPauseButton.classList.add('fa-play');
        miniPlayPauseButton.classList.remove('fa-pause');
        miniPlayPauseButton.classList.add('fa-play');
        showMiniPlayer(state.track_window.current_track);
      });
    }
  });
}


async function nextTrack() {
  if (currentTrackIndex < trackQueue.length - 1) {
    currentTrackIndex++;
    const nextTrack = trackQueue[currentTrackIndex];
    try {
      await playTrack(nextTrack.uri, nextTrack.trackName, nextTrack.artistName, nextTrack.albumImage);
    } catch (error) {
      console.error('Error skipping to next track:', error);
    }
  } else {
    console.warn('No more tracks in the queue');
  }
}

async function previousTrack() {
  if (currentTrackIndex > 0) {
    currentTrackIndex--;
    const previousTrack = trackQueue[currentTrackIndex];
    try {
      await playTrack(previousTrack.uri, previousTrack.trackName, previousTrack.artistName, previousTrack.albumImage);
    } catch (error) {
      console.error('Error skipping to previous track:', error);
    }
  } else {
    console.warn('No previous tracks in the queue');
  }
}

function updateTrackInfo() {
  const player = window.player;
  player.getCurrentState().then(state => {
    if (state) {
      const currentTrack = state.track_window.current_track;
      document.getElementById('track-name').innerText = currentTrack.name;
      document.getElementById('artist-name').innerText = currentTrack.artists.map(artist => artist.name).join(', ');
      updateBackgroundImage(currentTrack.album.images[0].url);
      startProgressInterval(player);
    } else {
      console.warn('No current track');
    }
  });
}

function updateProgress(position, duration) {
  const progress = document.getElementById('progress');
  const currentTime = document.getElementById('current-time');
  const totalTime = document.getElementById('total-time');

  const positionMinutes = Math.floor(position / 60000);
  const positionSeconds = ((position % 60000) / 1000).toFixed(0);
  const durationMinutes = Math.floor(duration / 60000);
  const durationSeconds = ((duration % 60000) / 1000).toFixed(0);

  currentTime.innerText = `${positionMinutes}:${positionSeconds < 10 ? '0' : ''}${positionSeconds}`;
  totalTime.innerText = `${durationMinutes}:${durationSeconds < 10 ? '0' : ''}${durationSeconds}`;

  progress.value = (position / duration) * 100;
}

function startProgressInterval(player) {
  progressInterval = setInterval(() => {
    player.getCurrentState().then(state => {
      if (!state) {
        return;
      }
      const currentPosition = state.position / 1000;
      const duration = state.duration / 1000;
      const progressPercentage = (currentPosition / duration) * 100;

      document.getElementById('progress').value = currentPosition;
      document.getElementById('mini-progress').value = currentPosition;
      document.getElementById('current-time').innerText = formatTime(currentPosition);
      document.getElementById('mini-current-time').innerText = formatTime(currentPosition);
      document.getElementById('total-time').innerText = formatTime(duration);
      document.getElementById('mini-total-time').innerText = formatTime(duration);
    });
  }, 1000);
}
function updateBackgroundImage(url) {
  const modalBackground = document.querySelector('.modal-background');
  modalBackground.style.backgroundImage = `url(${url})`;
}
function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
}

// Hacer funciones globales para que puedan ser llamadas desde el HTML
window.nextTrack = nextTrack;
window.previousTrack = previousTrack;

document.getElementById('progress').addEventListener('input', (e) => {
  const player = window.player;
  const progress = document.getElementById('progress');
  const value = progress.value;
  player.getCurrentState().then(state => {
    if (state) {
      const duration = state.duration;
      player.seek((value / 100) * duration);
    }
  });
});

async function setDeviceActive(device_id, token) {
  try {
    const response = await fetch(`https://api.spotify.com/v1/me/player`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        device_ids: [device_id],
        play: false // No empezar a reproducir automáticamente
      })
    });
    if (!response.ok) {
      throw new Error(`Error setting device active: ${response.statusText}`);
    }
    console.log('Device set as active successfully');
  } catch (error) {
    console.error('Error setting device active:', error);
  }
}
