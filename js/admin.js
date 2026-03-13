// Admin Functions
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
        
        // Render music list saat login
        setTimeout(() => {
            renderMusicList();
            updateStats();
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
        
        // Calculate duration (simulasi)
        const duration = calculateDuration(musicFile);
        
        // Add to music data
        const newSong = MusicData.addSong({
            title: title,
            artist: artist,
            album: album || 'Single',
            genre: genre,
            albumArt: albumArtBase64,
            audioUrl: musicBase64,
            duration: duration,
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
            updateStats();
            
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
    // Ini hanya simulasi, seharusnya menggunakan audio context
    const minutes = Math.floor(Math.random() * 4) + 3; // 3-7 menit
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
            <div class="music-item-img">
                <img src="${song.albumArt || 'https://via.placeholder.com/50x50?text=Music'}" 
                     alt="${song.title}"
                     onerror="this.src='https://via.placeholder.com/50x50?text=Music'">
            </div>
            <div class="music-item-info">
                <div class="music-item-title">
                    ${song.title} 
                    <span class="badge bg-primary">ID: #${song.id}</span>
                </div>
                <div class="music-item-artist">${song.artist}</div>
                <div class="music-item-meta small">
                    <span><i class="fas fa-compact-disc"></i> ${song.album || 'Single'}</span>
                    <span><i class="fas fa-tag"></i> ${song.genre}</span>
                    <span><i class="fas fa-clock"></i> ${song.duration || '3:00'}</span>
                    <span><i class="fas fa-play"></i> ${song.plays || 0} plays</span>
                </div>
            </div>
            <div class="music-item-actions">
                <button class="btn-action" onclick="playMusicById(${song.id})" title="Play">
                    <i class="fas fa-play"></i>
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
        updateStats();
        
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
    
    const musicList = document.getElementById('musicList');
    if (results.length === 0) {
        musicList.innerHTML = '<p class="text-center text-muted">Tidak ada hasil</p>';
    } else {
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
}

// Update stats
function updateStats() {
    const stats = MusicData.getStats();
    
    const totalSongs = document.getElementById('totalSongs');
    const totalArtists = document.getElementById('totalArtists');
    const totalAlbums = document.getElementById('totalAlbums');
    const totalPlays = document.getElementById('totalPlays');
    
    if (totalSongs) totalSongs.textContent = stats.totalSongs;
    if (totalArtists) totalArtists.textContent = stats.totalArtists;
    if (totalAlbums) totalAlbums.textContent = stats.totalAlbums;
    if (totalPlays) totalPlays.textContent = stats.totalPlays;
}

// Reset all data
function resetAllData() {
    if (!currentUser || currentUser.role !== 'admin') {
        showNotification('❌ Anda harus login sebagai admin!', 'error');
        return;
    }
    
    if (confirm('⚠️ RESET SEMUA DATA? Semua musik akan hilang!')) {
        MusicData.clearAll();
        MusicData.addSampleData(); // Tambah sample data
        renderMusicList();
        updateStats();
        
        // Trigger event untuk publik
        document.dispatchEvent(new CustomEvent('musicDataChanged'));
        
        showNotification('✅ Data telah direset!', 'success');
    }
}

// Debug function
function debugMusicData() {
    console.log('Current music data:', MusicData.getAllSongs());
    showNotification('🔍 Cek console untuk detail data musik', 'info');
}