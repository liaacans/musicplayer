// Public Player Functions - Untuk semua user (tanpa login)

// Render music grid untuk publik
function renderPublicMusic() {
    const musicGrid = document.getElementById('publicMusicGrid');
    const publicPlaylist = document.getElementById('publicPlaylist');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const noResultsMessage = document.getElementById('noResultsMessage');
    
    if (!musicGrid || !publicPlaylist) return;
    
    // Show loading
    if (loadingIndicator) loadingIndicator.style.display = 'block';
    musicGrid.style.opacity = '0.5';
    
    setTimeout(() => {
        const songs = MusicData.getAllSongs();
        console.log('Rendering public music, total songs:', songs.length);
        
        // Update statistik
        updateMusicStats(songs);
        
        // Hide loading
        if (loadingIndicator) loadingIndicator.style.display = 'none';
        musicGrid.style.opacity = '1';
        
        // Render Grid
        musicGrid.innerHTML = '';
        
        if (songs.length === 0) {
            musicGrid.innerHTML = `
                <div class="col-12 text-center py-5">
                    <i class="fas fa-music fa-4x text-muted mb-3"></i>
                    <h4 class="text-muted">Belum ada lagu tersedia</h4>
                    <p class="text-muted">Admin akan segera menambahkan lagu-lagu terbaru</p>
                </div>
            `;
            if (noResultsMessage) noResultsMessage.style.display = 'block';
        } else {
            if (noResultsMessage) noResultsMessage.style.display = 'none';
            
            songs.forEach(song => {
                const col = document.createElement('div');
                col.className = 'col-lg-3 col-md-4 col-sm-6 mb-4';
                col.innerHTML = `
                    <div class="music-grid-item animate__animated animate__fadeIn" onclick="playPublicMusic(${song.id})">
                        <img src="${song.albumArt || 'https://via.placeholder.com/300x300?text=No+Cover'}" 
                             alt="${song.title}"
                             onerror="this.src='https://via.placeholder.com/300x300?text=No+Cover'">
                        <div class="music-grid-info">
                            <div class="music-grid-title">${song.title}</div>
                            <div class="music-grid-artist">${song.artist}</div>
                            <div class="music-grid-meta">
                                <span><i class="fas fa-clock"></i> ${song.duration || '3:00'}</span>
                                <span><i class="fas fa-play"></i> ${song.plays || 0}</span>
                                <span class="badge bg-secondary">${song.genre}</span>
                            </div>
                            <button class="play-button w-100 mt-2">
                                <i class="fas fa-play me-2"></i>Putar
                            </button>
                        </div>
                    </div>
                `;
                musicGrid.appendChild(col);
            });
        }
        
        // Render Playlist (List View)
        renderPublicPlaylist(songs);
        
    }, 300); // Simulasi loading
}

// Render public playlist
function renderPublicPlaylist(songs) {
    const publicPlaylist = document.getElementById('publicPlaylist');
    if (!publicPlaylist) return;
    
    publicPlaylist.innerHTML = '';
    
    if (songs.length === 0) {
        publicPlaylist.innerHTML = '<p class="text-center text-muted py-3">Belum ada lagu</p>';
        return;
    }
    
    songs.forEach(song => {
        const item = document.createElement('div');
        item.className = `public-playlist-item ${musicPlayer.currentSongId === song.id ? 'active' : ''}`;
        item.setAttribute('onclick', `playPublicMusic(${song.id})`);
        item.innerHTML = `
            <img src="${song.albumArt || 'https://via.placeholder.com/50x50?text=Music'}" 
                 alt="${song.title}"
                 onerror="this.src='https://via.placeholder.com/50x50?text=Music'">
            <div class="public-playlist-info">
                <div class="public-playlist-title">${song.title}</div>
                <div class="public-playlist-artist">${song.artist}</div>
                <small class="text-muted">${song.genre} • ${song.plays} plays</small>
            </div>
            <div class="public-playlist-id badge bg-primary">#${song.id}</div>
        `;
        publicPlaylist.appendChild(item);
    });
}

// Update music statistics
function updateMusicStats(songs) {
    // Update total songs badge
    const totalSongsBadge = document.getElementById('totalSongsBadge');
    if (totalSongsBadge) {
        totalSongsBadge.textContent = `${songs.length} Lagu`;
    }
    
    // Hitung per genre
    const genreCount = {
        Pop: songs.filter(s => s.genre === 'Pop').length,
        Rock: songs.filter(s => s.genre === 'Rock').length,
        Jazz: songs.filter(s => s.genre === 'Jazz').length,
        Dangdut: songs.filter(s => s.genre === 'Dangdut').length,
        Classical: songs.filter(s => s.genre === 'Classical').length
    };
    
    // Update counter di filter buttons
    document.getElementById('countAll').textContent = songs.length;
    document.getElementById('countPop').textContent = genreCount.Pop || 0;
    document.getElementById('countRock').textContent = genreCount.Rock || 0;
    document.getElementById('countJazz').textContent = genreCount.Jazz || 0;
    document.getElementById('countDangdut').textContent = genreCount.Dangdut || 0;
    document.getElementById('countClassical').textContent = genreCount.Classical || 0;
    
    // Update stats summary
    const statsSummary = document.getElementById('musicStatsSummary');
    if (statsSummary) {
        const totalArtists = new Set(songs.map(s => s.artist)).size;
        const totalPlays = songs.reduce((sum, s) => sum + (s.plays || 0), 0);
        
        statsSummary.innerHTML = `
            <div class="col-md-3 col-6 mb-2">
                <div class="small-stat">
                    <i class="fas fa-music text-primary"></i>
                    <span class="fw-bold">${songs.length}</span> Lagu
                </div>
            </div>
            <div class="col-md-3 col-6 mb-2">
                <div class="small-stat">
                    <i class="fas fa-users text-success"></i>
                    <span class="fw-bold">${totalArtists}</span> Artis
                </div>
            </div>
            <div class="col-md-3 col-6 mb-2">
                <div class="small-stat">
                    <i class="fas fa-play text-info"></i>
                    <span class="fw-bold">${totalPlays}</span> Putaran
                </div>
            </div>
            <div class="col-md-3 col-6 mb-2">
                <div class="small-stat">
                    <i class="fas fa-clock text-warning"></i>
                    <span class="fw-bold">${songs.length * 4}</span> Menit
                </div>
            </div>
        `;
    }
}

// Play music untuk publik
function playPublicMusic(id) {
    console.log('Play public music ID:', id);
    
    const song = MusicData.getSongById(id);
    if (!song) {
        showNotification('❌ Lagu tidak ditemukan!', 'error');
        return;
    }
    
    musicPlayer.playSongById(id);
    
    // Update active state di playlist
    document.querySelectorAll('.public-playlist-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Cari item yang sesuai dan beri class active
    const activeItem = Array.from(document.querySelectorAll('.public-playlist-item')).find(
        item => item.querySelector('.public-playlist-id')?.textContent === `#${id}`
    );
    if (activeItem) {
        activeItem.classList.add('active');
    }
    
    // Scroll ke player di mobile
    if (window.innerWidth < 768) {
        document.getElementById('music').scrollIntoView({ behavior: 'smooth' });
    }
}

// Search untuk publik
function searchPublicMusic() {
    const query = document.getElementById('publicSearch').value;
    
    if (!query) {
        renderPublicMusic();
        return;
    }
    
    // Show loading
    const loadingIndicator = document.getElementById('loadingIndicator');
    if (loadingIndicator) loadingIndicator.style.display = 'block';
    
    setTimeout(() => {
        const results = MusicData.searchSongs(query);
        displaySearchResults(results);
        
        if (loadingIndicator) loadingIndicator.style.display = 'none';
    }, 300);
}

// Display search results
function displaySearchResults(results) {
    const musicGrid = document.getElementById('publicMusicGrid');
    const publicPlaylist = document.getElementById('publicPlaylist');
    const noResultsMessage = document.getElementById('noResultsMessage');
    
    if (results.length === 0) {
        musicGrid.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="fas fa-search fa-3x text-muted mb-3"></i>
                <h5 class="text-muted">Tidak ada hasil ditemukan</h5>
                <p class="text-muted">Coba kata kunci yang berbeda</p>
            </div>
        `;
        publicPlaylist.innerHTML = '<p class="text-center text-muted">Tidak ada hasil</p>';
        if (noResultsMessage) noResultsMessage.style.display = 'block';
        return;
    }
    
    if (noResultsMessage) noResultsMessage.style.display = 'none';
    
    // Render grid hasil
    musicGrid.innerHTML = '';
    results.forEach(song => {
        const col = document.createElement('div');
        col.className = 'col-lg-3 col-md-4 col-sm-6 mb-4';
        col.innerHTML = `
            <div class="music-grid-item" onclick="playPublicMusic(${song.id})">
                <img src="${song.albumArt || 'https://via.placeholder.com/300x300'}" 
                     alt="${song.title}"
                     onerror="this.src='https://via.placeholder.com/300x300'">
                <div class="music-grid-info">
                    <div class="music-grid-title">${song.title}</div>
                    <div class="music-grid-artist">${song.artist}</div>
                    <div class="music-grid-meta">
                        <span><i class="fas fa-clock"></i> ${song.duration}</span>
                        <span><i class="fas fa-play"></i> ${song.plays}</span>
                    </div>
                </div>
            </div>
        `;
        musicGrid.appendChild(col);
    });
    
    // Render playlist hasil
    publicPlaylist.innerHTML = '';
    results.forEach(song => {
        const item = document.createElement('div');
        item.className = 'public-playlist-item';
        item.setAttribute('onclick', `playPublicMusic(${song.id})`);
        item.innerHTML = `
            <img src="${song.albumArt || 'https://via.placeholder.com/50x50'}" 
                 alt="${song.title}"
                 onerror="this.src='https://via.placeholder.com/50x50'">
            <div class="public-playlist-info">
                <div class="public-playlist-title">${song.title}</div>
                <div class="public-playlist-artist">${song.artist}</div>
            </div>
            <div class="public-playlist-id badge bg-primary">#${song.id}</div>
        `;
        publicPlaylist.appendChild(item);
    });
}

// Filter berdasarkan genre
function filterPublicMusic(genre) {
    // Update active button
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Show loading
    const loadingIndicator = document.getElementById('loadingIndicator');
    if (loadingIndicator) loadingIndicator.style.display = 'block';
    
    setTimeout(() => {
        const filtered = MusicData.filterByGenre(genre);
        displaySearchResults(filtered);
        
        if (loadingIndicator) loadingIndicator.style.display = 'none';
    }, 300);
}

// Event listener untuk perubahan data
document.addEventListener('musicDataChanged', function(e) {
    console.log('Music data changed, refreshing UI...');
    renderPublicMusic();
    
    // Update player jika lagu yang sedang diputar dihapus
    if (musicPlayer.currentSongId) {
        const currentSong = MusicData.getSongById(musicPlayer.currentSongId);
        if (!currentSong) {
            musicPlayer.audio.pause();
            musicPlayer.currentSongId = null;
            musicPlayer.currentSongEl.textContent = 'Pilih Lagu';
            musicPlayer.currentArtistEl.textContent = '-';
            musicPlayer.currentAlbumArt.src = 'https://via.placeholder.com/300x300?text=Music';
            musicPlayer.updateStatus('stopped', 'Lagu tidak tersedia');
        }
    }
});

// Initial render
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, rendering public music...');
    
    // Small delay untuk memastikan data siap
    setTimeout(() => {
        renderPublicMusic();
    }, 200);
    
    // Tambah statistik di navbar
    const navbarNav = document.querySelector('#navbarNav .navbar-nav');
    if (navbarNav) {
        // Hapus yang lama jika ada
        const oldStats = document.getElementById('publicStats');
        if (oldStats) oldStats.remove();
        
        const statsLi = document.createElement('li');
        statsLi.className = 'nav-item';
        statsLi.id = 'publicStats';
        statsLi.innerHTML = `
            <span class="nav-link">
                <i class="fas fa-music"></i> 
                <span id="totalSongsNav">${MusicData.getStats().totalSongs}</span> Lagu
            </span>
        `;
        navbarNav.insertBefore(statsLi, navbarNav.firstChild);
    }
});

// Tambahkan CSS untuk small stat
const style = document.createElement('style');
style.textContent = `
    .small-stat {
        background: rgba(255,255,255,0.9);
        padding: 10px;
        border-radius: 10px;
        text-align: center;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .small-stat i {
        margin-right: 5px;
    }
`;
document.head.appendChild(style);