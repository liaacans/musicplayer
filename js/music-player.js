// Music Player Class - Untuk semua user
class MusicPlayer {
    constructor() {
        this.audio = new Audio();
        this.currentSongId = null;
        this.isPlaying = false;
        this.playlist = [];
        
        // DOM Elements
        this.playPauseBtn = document.getElementById('playPauseBtn');
        this.progress = document.getElementById('progress');
        this.currentTimeEl = document.getElementById('currentTime');
        this.durationEl = document.getElementById('duration');
        this.volumeControl = document.getElementById('volume');
        this.currentSongEl = document.getElementById('currentSong');
        this.currentArtistEl = document.getElementById('currentArtist');
        this.currentAlbumArt = document.getElementById('currentAlbumArt');
        this.songIdEl = document.getElementById('songId');
        this.nowPlayingInfo = document.getElementById('nowPlayingInfo');
        this.visualizer = document.getElementById('visualizer');
        this.volumeValue = document.getElementById('volumeValue');
        
        this.init();
    }
    
    init() {
        // Event Listeners
        this.audio.addEventListener('timeupdate', () => this.updateProgress());
        this.audio.addEventListener('loadedmetadata', () => this.updateDuration());
        this.audio.addEventListener('ended', () => this.nextSong());
        this.audio.addEventListener('play', () => this.onPlay());
        this.audio.addEventListener('pause', () => this.onPause());
        this.audio.addEventListener('error', (e) => this.onError(e));
        this.audio.addEventListener('canplay', () => this.onCanPlay());
        this.audio.addEventListener('waiting', () => this.onWaiting());
        
        // Volume control
        this.volumeControl.addEventListener('input', (e) => {
            const vol = parseFloat(e.target.value);
            this.audio.volume = vol;
            this.volumeValue.textContent = Math.round(vol * 100) + '%';
        });
        
        // Set initial volume
        this.audio.volume = 0.7;
        
        // Update status
        this.updateStatus('stopped', '🎵 Selamat datang! Pilih lagu untuk diputar');
        
        console.log('Music Player initialized');
    }
    
    playSongById(id) {
        console.log('Attempting to play song ID:', id);
        
        const song = MusicData.getSongById(id);
        if (!song) {
            console.error('Song not found:', id);
            this.updateStatus('error', '❌ Lagu tidak ditemukan');
            return;
        }
        
        console.log('Playing song:', song);
        
        this.currentSongId = id;
        
        // Update UI
        this.currentSongEl.textContent = song.title;
        this.currentArtistEl.textContent = song.artist;
        this.currentAlbumArt.src = song.albumArt || 'https://via.placeholder.com/300x300?text=No+Cover';
        this.songIdEl.textContent = `ID: #${song.id}`;
        
        // Set audio source
        this.audio.src = song.audioUrl;
        this.audio.load();
        
        // Play
        const playPromise = this.audio.play();
        
        if (playPromise !== undefined) {
            playPromise
                .then(() => {
                    this.isPlaying = true;
                    this.updatePlayPauseIcon();
                    this.updateStatus('playing', `🎵 Memutar: ${song.title} - ${song.artist}`);
                    this.updateNowPlayingInfo(song);
                    
                    // Increment play count
                    MusicData.incrementPlays(id);
                    
                    // Aktifkan visualizer
                    this.activateVisualizer();
                    
                    console.log('Successfully playing:', song.title);
                })
                .catch(error => {
                    console.error('Error playing audio:', error);
                    this.updateStatus('error', '❌ Gagal memutar lagu. Coba lagi.');
                    
                    // Fallback ke URL langsung
                    if (song.audioUrl.startsWith('data:')) {
                        console.log('Trying with data URL...');
                        this.audio.src = song.audioUrl;
                        this.audio.play().catch(e => {
                            console.error('Still failed:', e);
                        });
                    }
                });
        }
    }
    
    updateNowPlayingInfo(song) {
        if (!this.nowPlayingInfo) return;
        
        this.nowPlayingInfo.innerHTML = `
            <div class="alert alert-info">
                <i class="fas fa-music me-2"></i>
                <strong>Now Playing:</strong> ${song.title} - ${song.artist}
                <br>
                <small>
                    <span class="badge bg-primary">ID: #${song.id}</span>
                    <span class="badge bg-secondary">${song.album || 'Single'}</span>
                    <span class="badge bg-success">${song.genre}</span>
                    <span class="badge bg-warning">${song.duration}</span>
                    <span class="badge bg-info">${song.plays || 0} plays</span>
                </small>
            </div>
        `;
    }
    
    togglePlay() {
        if (!this.currentSongId) {
            // If no song selected, play first song
            const songs = MusicData.getAllSongs();
            if (songs.length > 0) {
                this.playSongById(songs[0].id);
            } else {
                this.updateStatus('error', '❌ Belum ada lagu tersedia');
            }
            return;
        }
        
        if (this.isPlaying) {
            this.audio.pause();
        } else {
            this.audio.play()
                .then(() => {
                    this.isPlaying = true;
                    this.updatePlayPauseIcon();
                    this.updateStatus('playing', '▶️ Melanjutkan');
                    this.activateVisualizer();
                })
                .catch(error => {
                    console.error('Error playing:', error);
                });
        }
    }
    
    onPlay() {
        this.isPlaying = true;
        this.updatePlayPauseIcon();
        
        const song = MusicData.getSongById(this.currentSongId);
        if (song) {
            this.updateStatus('playing', `🎵 Memutar: ${song.title}`);
            this.activateVisualizer();
        }
    }
    
    onPause() {
        this.isPlaying = false;
        this.updatePlayPauseIcon();
        this.updateStatus('paused', '⏸️ Dijeda');
        this.deactivateVisualizer();
    }
    
    onError(e) {
        console.error('Audio error:', e);
        this.updateStatus('error', '❌ Error memutar lagu');
        this.deactivateVisualizer();
    }
    
    onCanPlay() {
        console.log('Audio can play now');
        if (this.isPlaying) {
            this.activateVisualizer();
        }
    }
    
    onWaiting() {
        console.log('Audio waiting/buffering');
        this.updateStatus('buffering', '⏳ Buffering...');
    }
    
    activateVisualizer() {
        if (this.visualizer) {
            this.visualizer.style.opacity = '1';
            this.visualizer.classList.add('active');
        }
    }
    
    deactivateVisualizer() {
        if (this.visualizer) {
            this.visualizer.style.opacity = '0.5';
            this.visualizer.classList.remove('active');
        }
    }
    
    updatePlayPauseIcon() {
        if (!this.playPauseBtn) return;
        
        const icon = this.playPauseBtn.querySelector('i');
        if (this.isPlaying) {
            icon.className = 'fas fa-pause';
        } else {
            icon.className = 'fas fa-play';
        }
    }
    
    nextSong() {
        const songs = MusicData.getAllSongs();
        if (songs.length === 0) return;
        
        if (!this.currentSongId) {
            this.playSongById(songs[0].id);
            return;
        }
        
        const currentIndex = songs.findIndex(s => s.id === this.currentSongId);
        const nextIndex = (currentIndex + 1) % songs.length;
        this.playSongById(songs[nextIndex].id);
    }
    
    previousSong() {
        const songs = MusicData.getAllSongs();
        if (songs.length === 0) return;
        
        if (!this.currentSongId) {
            this.playSongById(songs[0].id);
            return;
        }
        
        const currentIndex = songs.findIndex(s => s.id === this.currentSongId);
        const prevIndex = (currentIndex - 1 + songs.length) % songs.length;
        this.playSongById(songs[prevIndex].id);
    }
    
    updateProgress() {
        if (this.audio.duration && !isNaN(this.audio.duration)) {
            const progressPercent = (this.audio.currentTime / this.audio.duration) * 100;
            this.progress.style.width = `${progressPercent}%`;
            this.currentTimeEl.textContent = this.formatTime(this.audio.currentTime);
        }
    }
    
    updateDuration() {
        if (this.audio.duration && !isNaN(this.audio.duration)) {
            this.durationEl.textContent = this.formatTime(this.audio.duration);
        }
    }
    
    formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';
        
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    
    updateStatus(state, message) {
        const statusDiv = document.getElementById('musicStatus');
        if (!statusDiv) return;
        
        let iconHtml = '';
        let statusClass = '';
        
        switch(state) {
            case 'playing':
                iconHtml = '<i class="fas fa-circle" style="color: #32cd32;"></i>';
                statusClass = 'status-playing';
                break;
            case 'paused':
                iconHtml = '<i class="fas fa-pause-circle" style="color: #ffd966;"></i>';
                statusClass = 'status-paused';
                break;
            case 'buffering':
                iconHtml = '<i class="fas fa-spinner fa-spin" style="color: #667eea;"></i>';
                statusClass = 'status-buffering';
                break;
            case 'stopped':
                iconHtml = '<i class="fas fa-stop-circle" style="color: #aaa;"></i>';
                statusClass = 'status-stopped';
                break;
            case 'error':
                iconHtml = '<i class="fas fa-exclamation-triangle" style="color: #ff6b6b;"></i>';
                statusClass = 'status-error';
                break;
            default:
                iconHtml = '<i class="fas fa-circle" style="color: #ffd966;"></i>';
                statusClass = 'status-idle';
        }
        
        statusDiv.innerHTML = `
            <div class="status-container ${statusClass}">
                <span class="status-icon">${iconHtml}</span>
                <span class="status-text">${message}</span>
                <span class="status-time">${new Date().toLocaleTimeString()}</span>
            </div>
        `;
    }
    
    getCurrentSong() {
        return MusicData.getSongById(this.currentSongId);
    }
}

// Initialize Music Player
const musicPlayer = new MusicPlayer();

// Global functions
function togglePlay() {
    musicPlayer.togglePlay();
}

function nextSong() {
    musicPlayer.nextSong();
}

function previousSong() {
    musicPlayer.previousSong();
}

function seek(event) {
    const progress = event.currentTarget;
    const rect = progress.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const width = rect.width;
    const percentage = x / width;
    
    if (musicPlayer.audio.duration && !isNaN(musicPlayer.audio.duration)) {
        musicPlayer.audio.currentTime = percentage * musicPlayer.audio.duration;
    }
}

function scrollToMusic() {
    document.getElementById('music').scrollIntoView({ behavior: 'smooth' });
}

function scrollToPlaylist() {
    document.getElementById('playlist').scrollIntoView({ behavior: 'smooth' });
}

// Navbar scroll effect
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});