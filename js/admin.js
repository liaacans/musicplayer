// Admin Functions - Dengan fitur lengkap
let currentUser = null;

// Update current user dari auth
document.addEventListener('authChanged', function(e) {
    currentUser = e.detail.user;
    console.log('Auth changed, current user:', currentUser);
    
    if (currentUser && currentUser.role === 'admin') {
        // Pastikan admin section visible
        const adminSection = document.getElementById('admin');
        if (adminSection) {
            adminSection.style.display = 'block';
        }
        
        // Render semua komponen admin
        setTimeout(() => {
            renderMusicList();
            updateAllStats();
            renderDashboard();
            renderGenreDistribution();
            renderTopPlayed();
        }, 200);
    } else {
        // Sembunyikan admin section
        const adminSection = document.getElementById('admin');
        if (adminSection) {
            adminSection.style.display = 'none';
        }
    }
});

// Preview image before upload
function previewImage(input) {
    const preview = document.getElementById('imagePreview');
    if (!preview) return;
    
    const img = preview.querySelector('img');
    
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            img.src = e.target.result;
            preview.style.display = 'block';
        };
        
        reader.readAsDataURL(input.files[0]);
    }
}

// Upload music function
function uploadMusic() {
    if (!currentUser || currentUser.role !== 'admin') {
        showNotification('❌ Anda harus login sebagai admin!', 'error');
        return;
    }
    
    // Get form values
    const title = document.getElementById('songTitle').value;
    const artist = document.getElementById('artistName').value;
    const album = document.getElementById('albumName').value;
    const genre = document.getElementById('genre').value;
    const duration = document.getElementById('duration').value;
    const albumArtFile = document.getElementById('albumArt').files[0];
    const musicFile = document.getElementById('musicFile').files[0];
    
    // Validate
    if (!title || !artist) {
        showNotification('❌ Judul dan artis harus diisi!', 'error');
        return;
    }
    
    if (!albumArtFile) {
        showNotification('❌ Cover album harus diupload!', 'error');
        return;
    }
    
    if (!musicFile) {
        showNotification('❌ File musik harus diupload!', 'error');
        return;
    }
    
    // Validate file types
    if (!musicFile.type.startsWith('audio/')) {
        showNotification('❌ File harus berupa audio!', 'error');
        return;
    }
    
    // Validate file size (max 50MB)
    if (musicFile.size > 50 * 1024 * 1024) {
        showNotification('❌ File musik maksimal 50MB!', 'error');
        return;
    }
    
    // Show progress
    const progress = document.getElementById('uploadProgress');
    progress.style.display = 'block';
    const progressBar = progress.querySelector('.progress-bar');
    
    // Simulate upload progress
    let width = 0;
    const interval = setInterval(() => {
        if (width >= 90) {
            clearInterval(interval);
        } else {
            width += 10;
            progressBar.style.width = width + '%';
            progressBar.textContent = width + '%';
        }
    }, 200);
    
    // Convert files to base64
    Promise.all([
        fileToBase64(albumArtFile),
        fileToBase64(musicFile)
    ]).then(([albumArtBase64, musicBase64]) => {
        console.log('Files converted to base64');
        
        // Add to music data
        const newSong = MusicData.addSong({
            title: title,
            artist: artist,
            album: album || 'Single',
            genre: genre,
            albumArt: albumArtBase64,
            audioUrl: musicBase64,
            duration: duration || calculateDuration(musicFile),
            uploadedBy: currentUser.username
        });
        
        // Complete progress
        clearInterval(interval);
        progressBar.style.width = '100%';
        progressBar.textContent = '100%';
        
        setTimeout(() => {
            progress.style.display = 'none';
            progressBar.style.width = '0%';
            progressBar.textContent = '0%';
            
            // Reset form
            document.getElementById('uploadForm').reset();
            document.getElementById('imagePreview').style.display = 'none';
            
            // Refresh displays
            renderMusicList();
            updateAllStats();
            renderDashboard();
            renderGenreDistribution();
            renderTopPlayed();
            
            showNotification(`✅ Musik "${title}" berhasil diupload! ID: #${newSong.id}`, 'success');
            
            // Trigger event untuk update publik
            document.dispatchEvent(new CustomEvent('musicDataChanged'));
            
        }, 500);
    }).catch(error => {
        console.error('Upload error:', error);
        showNotification('❌ Error uploading files: ' + error.message, 'error');
        progress.style.display = 'none';
    });
}

// Convert file to base64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

// Calculate duration (simulasi)
function calculateDuration(file) {
    const minutes = Math.floor(Math.random() * 4) + 3;
    const seconds = Math.floor(Math.random() * 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Render music list in admin panel
function renderMusicList() {
    const musicList = document.getElementById('musicList');
    if (!musicList) {
        console.warn('Music list element not found');
        return;
    }
    
    const songs = MusicData.getAllSongs();
    console.log('Rendering music list, total songs:', songs.length);
    
    if (songs.length === 0) {
        musicList.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-music fa-3x text-muted mb-3"></i>
                <p class="text-muted">Belum ada musik. Upload sekarang!</p>
            </div>
        `;
        return;
    }
    
    musicList.innerHTML = songs.map(song => `
        <div class="music-item" data-id="${song.id}">
            <div class="music-item-check">
                <input type="checkbox" class="form-check-input music-checkbox" value="${song.id}" onchange="toggleBulkActions()">
            </div>
            <div class="music-item-img">
                <img src="${song.albumArt || 'https://via.placeholder.com/50x50?text=Music'}" 
                     alt="${song.title}"
                     onerror="this.src='https://via.placeholder.com/50x50?text=Music'">
            </div>
            <div class="music-item-info">
                <div class="music-item-title">
                    ${song.title} 
                    <span class="badge bg-primary">ID: #${song.id}</span>
                    <span class="badge bg-secondary">${song.genre}</span>
                </div>
                <div class="music-item-artist">${song.artist}</div>
                <div class="music-item-meta small">
                    <span><i class="fas fa-compact-disc"></i> ${song.album || 'Single'}</span>
                    <span><i class="fas fa-clock"></i> ${song.duration || '3:00'}</span>
                    <span><i class="fas fa-play"></i> ${song.plays || 0} plays</span>
                    <span><i class="fas fa-calendar"></i> ${song.uploadDate}</span>
                </div>
            </div>
            <div class="music-item-actions">
                <button class="btn-action" onclick="playMusicById(${song.id})" title="Play">
                    <i class="fas fa-play"></i>
                </button>
                <button class="btn-action" onclick="editMusic(${song.id})" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-action delete" onclick="deleteMusic(${song.id})" title="Hapus">
                    <i class="fas fa-trash"></i>
                </button>
                <button class="btn-action" onclick="showSongInfo(${song.id})" title="Info">
                    <i class="fas fa-info-circle"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// Toggle bulk actions
function toggleBulkActions() {
    const checkboxes = document.querySelectorAll('.music-checkbox:checked');
    const bulkActions = document.getElementById('bulkActions');
    const selectedCount = document.getElementById('selectedCount');
    
    if (checkboxes.length > 0) {
        bulkActions.style.display = 'block';
        selectedCount.textContent = `${checkboxes.length} terpilih`;
    } else {
        bulkActions.style.display = 'none';
    }
}

// Delete selected
function deleteSelected() {
    if (!currentUser || currentUser.role !== 'admin') {
        showNotification('❌ Anda harus login sebagai admin!', 'error');
        return;
    }
    
    const checkboxes = document.querySelectorAll('.music-checkbox:checked');
    const ids = Array.from(checkboxes).map(cb => parseInt(cb.value));
    
    if (ids.length === 0) return;
    
    if (confirm(`Hapus ${ids.length} musik terpilih?`)) {
        ids.forEach(id => {
            MusicData.deleteSong(id);
            
            // If currently playing this song, stop it
            if (musicPlayer.currentSongId === id) {
                musicPlayer.audio.pause();
                musicPlayer.currentSongId = null;
            }
        });
        
        renderMusicList();
        updateAllStats();
        document.dispatchEvent(new CustomEvent('musicDataChanged'));
        showNotification(`✅ ${ids.length} musik berhasil dihapus!`, 'success');
        
        document.getElementById('bulkActions').style.display = 'none';
    }
}

// Export selected
function exportSelected() {
    const checkboxes = document.querySelectorAll('.music-checkbox:checked');
    const ids = Array.from(checkboxes).map(cb => parseInt(cb.value));
    
    const selectedSongs = MusicData.songs.filter(s => ids.includes(s.id));
    const exportData = {
        songs: selectedSongs,
        exportDate: new Date().toISOString(),
        count: selectedSongs.length
    };
    
    const jsonData = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `selected_music_${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification(`✅ ${selectedSongs.length} musik diexport!`, 'success');
}

// Edit music
function editMusic(id) {
    const song = MusicData.getSongById(id);
    if (!song) return;
    
    const newTitle = prompt('Edit judul lagu:', song.title);
    if (newTitle && newTitle !== song.title) {
        song.title = newTitle;
        MusicData.saveToStorage();
        renderMusicList();
        document.dispatchEvent(new CustomEvent('musicDataChanged'));
        showNotification('✅ Judul lagu diupdate!', 'success');
    }
}

// Play music by ID
function playMusicById(id) {
    musicPlayer.playSongById(id);
    
    // Scroll to player
    document.getElementById('music').scrollIntoView({ behavior: 'smooth' });
    
    // Show notification
    const song = MusicData.getSongById(id);
    if (song) {
        showNotification(`🎵 Memutar: ${song.title} - ${song.artist}`, 'info');
    }
}

// Delete music
function deleteMusic(id) {
    if (!currentUser || currentUser.role !== 'admin') {
        showNotification('❌ Anda harus login sebagai admin!', 'error');
        return;
    }
    
    const song = MusicData.getSongById(id);
    if (!song) return;
    
    if (confirm(`Hapus musik "${song.title}"?`)) {
        MusicData.deleteSong(id);
        
        // If currently playing this song, stop it
        if (musicPlayer.currentSongId === id) {
            musicPlayer.audio.pause();
            musicPlayer.currentSongId = null;
            musicPlayer.currentSongEl.textContent = 'Pilih Lagu';
            musicPlayer.currentArtistEl.textContent = '-';
            musicPlayer.currentAlbumArt.src = 'https://via.placeholder.com/300x300?text=Music';
            musicPlayer.updateStatus('stopped', 'Lagu dihapus');
        }
        
        // Refresh displays
        renderMusicList();
        updateAllStats();
        renderDashboard();
        
        // Trigger event untuk publik
        document.dispatchEvent(new CustomEvent('musicDataChanged'));
        
        showNotification(`✅ Musik "${song.title}" berhasil dihapus!`, 'success');
    }
}

// Show song info
function showSongInfo(id) {
    const song = MusicData.getSongById(id);
    if (!song) return;
    
    const info = `
        🎵 ID: #${song.id}
        📝 Judul: ${song.title}
        👤 Artis: ${song.artist}
        💿 Album: ${song.album}
        🎸 Genre: ${song.genre}
        ⏱️ Durasi: ${song.duration}
        ▶️ Diputar: ${song.plays} kali
        📅 Diupload: ${song.uploadDate}
        👨‍💼 Oleh: ${song.uploadedBy}
    `;
    
    alert(info);
}

// Filter admin music
function filterAdminMusic() {
    const query = document.getElementById('searchMusic').value;
    
    if (!query) {
        renderMusicList();
        return;
    }
    
    const results = MusicData.searchSongs(query);
    displayAdminResults(results);
}

// Filter by genre
function filterAdminByGenre() {
    const genre = document.getElementById('genreFilter').value;
    const results = MusicData.filterByGenre(genre);
    displayAdminResults(results);
}

// Display admin results
function displayAdminResults(results) {
    const musicList = document.getElementById('musicList');
    
    if (results.length === 0) {
        musicList.innerHTML = '<p class="text-center text-muted py-5">Tidak ada hasil</p>';
        return;
    }
    
    musicList.innerHTML = results.map(song => `
        <div class="music-item" data-id="${song.id}">
            <div class="music-item-img">
                <img src="${song.albumArt}" alt="${song.title}">
            </div>
            <div class="music-item-info">
                <div class="music-item-title">${song.title}</div>
                <div class="music-item-artist">${song.artist}</div>
            </div>
            <div class="music-item-actions">
                <button class="btn-action" onclick="playMusicById(${song.id})">
                    <i class="fas fa-play"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// Update all stats
function updateAllStats() {
    const stats = MusicData.getStats();
    
    document.getElementById('totalSongs').textContent = stats.totalSongs;
    document.getElementById('totalArtists').textContent = stats.totalArtists;
    document.getElementById('totalAlbums').textContent = stats.totalAlbums;
    document.getElementById('totalPlays').textContent = stats.totalPlays;
    
    document.getElementById('dashboardTotalSongs').textContent = stats.totalSongs;
    document.getElementById('dashboardTotalArtists').textContent = stats.totalArtists;
    document.getElementById('dashboardTotalAlbums').textContent = stats.totalAlbums;
    document.getElementById('dashboardTotalPlays').textContent = stats.totalPlays;
}

// Render dashboard
function renderDashboard() {
    renderGenreDistribution();
    renderTopPlayed();
    renderTopArtists();
}

// Render genre distribution
function renderGenreDistribution() {
    const songs = MusicData.getAllSongs();
    const genreCount = {};
    
    songs.forEach(song => {
        genreCount[song.genre] = (genreCount[song.genre] || 0) + 1;
    });
    
    const genreDist = document.getElementById('genreDistribution');
    if (!genreDist) return;
    
    if (songs.length === 0) {
        genreDist.innerHTML = '<p class="text-muted">Belum ada data</p>';
        return;
    }
    
    let html = '<div class="list-group">';
    Object.entries(genreCount).sort((a,b) => b[1] - a[1]).forEach(([genre, count]) => {
        const percentage = Math.round((count / songs.length) * 100);
        html += `
            <div class="list-group-item d-flex justify-content-between align-items-center">
                <span>${genre}</span>
                <div>
                    <span class="badge bg-primary rounded-pill me-2">${count}</span>
                    <span class="badge bg-secondary">${percentage}%</span>
                </div>
            </div>
        `;
    });
    html += '</div>';
    
    genreDist.innerHTML = html;
    
    // Update genre stats tab
    const genreStats = document.getElementById('genreStats');
    if (genreStats) {
        genreStats.innerHTML = html;
    }
}

// Render top played
function renderTopPlayed() {
    const songs = MusicData.getAllSongs();
    const topPlayed = [...songs].sort((a, b) => (b.plays || 0) - (a.plays || 0)).slice(0, 5);
    
    const topPlayedEl = document.getElementById('topPlayed');
    if (!topPlayedEl) return;
    
    if (topPlayed.length === 0) {
        topPlayedEl.innerHTML = '<p class="text-muted">Belum ada data</p>';
        return;
    }
    
    let html = '<div class="list-group">';
    topPlayed.forEach((song, index) => {
        html += `
            <div class="list-group-item d-flex justify-content-between align-items-center">
                <div>
                    <span class="badge bg-${index === 0 ? 'warning' : 'secondary'} me-2">#${index + 1}</span>
                    <strong>${song.title}</strong> - ${song.artist}
                </div>
                <span class="badge bg-info">${song.plays || 0} plays</span>
            </div>
        `;
    });
    html += '</div>';
    
    topPlayedEl.innerHTML = html;
}

// Render top artists
function renderTopArtists() {
    const songs = MusicData.getAllSongs();
    const artistPlays = {};
    
    songs.forEach(song => {
        if (!artistPlays[song.artist]) {
            artistPlays[song.artist] = {
                plays: 0,
                songs: 0
            };
        }
        artistPlays[song.artist].plays += song.plays || 0;
        artistPlays[song.artist].songs += 1;
    });
    
    const topArtists = Object.entries(artistPlays)
        .sort((a, b) => b[1].plays - a[1].plays)
        .slice(0, 5);
    
    const topArtistsEl = document.getElementById('topArtists');
    if (!topArtistsEl) return;
    
    if (topArtists.length === 0) {
        topArtistsEl.innerHTML = '<p class="text-muted">Belum ada data</p>';
        return;
    }
    
    let html = '<div class="list-group">';
    topArtists.forEach(([artist, data], index) => {
        html += `
            <div class="list-group-item">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <span class="badge bg-${index === 0 ? 'warning' : 'secondary'} me-2">#${index + 1}</span>
                        <strong>${artist}</strong>
                    </div>
                    <span class="badge bg-info">${data.plays} plays</span>
                </div>
                <small class="text-muted">${data.songs} lagu</small>
            </div>
        `;
    });
    html += '</div>';
    
    topArtistsEl.innerHTML = html;
}

// Export data ke file JSON
function exportMusicData() {
    if (!currentUser || currentUser.role !== 'admin') {
        showNotification('❌ Anda harus login sebagai admin!', 'error');
        return;
    }
    
    const jsonData = MusicData.exportToJSON();
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `music_data_${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification('✅ Data berhasil diexport!', 'success');
}

// Import data dari file JSON
function importMusicData(event) {
    if (!currentUser || currentUser.role !== 'admin') {
        showNotification('❌ Anda harus login sebagai admin!', 'error');
        return;
    }
    
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const result = MusicData.importFromJSON(e.target.result);
            if (result.success) {
                renderMusicList();
                updateAllStats();
                renderDashboard();
                document.dispatchEvent(new CustomEvent('musicDataChanged'));
                showNotification(`✅ Berhasil import ${result.count} lagu!`, 'success');
            } else {
                showNotification('❌ ' + result.message, 'error');
            }
        } catch (error) {
            showNotification('❌ Error: ' + error.message, 'error');
        }
    };
    reader.readAsText(file);
    
    // Reset input
    event.target.value = '';
}

// Reset ke data default
function resetToDefault() {
    if (!currentUser || currentUser.role !== 'admin') {
        showNotification('❌ Anda harus login sebagai admin!', 'error');
        return;
    }
    
    if (confirm('⚠️ Reset ke data default? Semua perubahan akan hilang!')) {
        MusicData.clearAll();
        MusicData.loadFromJSON();
        MusicData.saveToStorage();
        renderMusicList();
        updateAllStats();
        renderDashboard();
        document.dispatchEvent(new CustomEvent('musicDataChanged'));
        showNotification('✅ Data direset ke default!', 'success');
    }
}

// Backup data
function backupData() {
    if (!currentUser || currentUser.role !== 'admin') {
        showNotification('❌ Anda harus login sebagai admin!', 'error');
        return;
    }
    
    MusicData.createBackup();
    showNotification('✅ Backup data berhasil dibuat!', 'success');
}

// Restore dari backup
function restoreFromBackup() {
    if (!currentUser || currentUser.role !== 'admin') {
        showNotification('❌ Anda harus login sebagai admin!', 'error');
        return;
    }
    
    if (MusicData.restoreFromBackup()) {
        renderMusicList();
        updateAllStats();
        renderDashboard();
        document.dispatchEvent(new CustomEvent('musicDataChanged'));
        showNotification('✅ Data direstore dari backup!', 'success');
    } else {
        showNotification('❌ Tidak ada backup tersedia', 'error');
    }
}