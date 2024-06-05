document.getElementById('login').addEventListener('click', () => {
  window.location.href = '/auth/login';
});

async function fetchMusic(query) {
  const response = await fetch(`/music/search?query=${query}`);
  const data = await response.json();
  displayMusic(data.tracks.items);
}

function displayMusic(tracks) {
  const container = document.getElementById('music-container');
  container.innerHTML = '';
  tracks.forEach(track => {
    const card = document.createElement('div');
    card.className = 'music-card';
    card.innerHTML = `
      <img src="${track.album.images[0].url}" alt="${track.name}" />
      <h3>${track.name}</h3>
      <p>${track.artists.map(artist => artist.name).join(', ')}</p>
      <button onclick="playTrack('${track.uri}')">Play</button>
    `;
    container.appendChild(card);
  });
}

async function playTrack(uri) {
  await fetch('/music/play', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ uri })
  });
}

// Llamar a fetchMusic con un término de búsqueda
window.onload = () => {
  const query = 'your search query';
  fetchMusic(query);
};
