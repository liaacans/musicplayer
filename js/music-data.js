// Music Data Management
const MusicData = {
    // Key untuk localStorage
    STORAGE_KEY: 'music_library',
    
    // Array untuk menyimpan musik
    songs: [],
    
    // ID counter
    nextId: 1,
    
    // Inisialisasi data
    init: function() {
        console.log('MusicData init...');
        this.loadFromStorage();
        
        // Jika tidak ada data, tambahkan sample
        if (this.songs.length === 0) {
            console.log('No data found, adding sample data');
            this.addSampleData();
        }
        
        // Update ID counter
        if (this.songs.length > 0) {
            this.nextId = Math.max(...this.songs.map(s => s.id)) + 1;
        }
        
        console.log('Music Data initialized:', this.songs.length, 'songs');
        return this.songs;
    },
    
    // Load dari localStorage
    loadFromStorage: function() {
        try {
            const savedData = localStorage.getItem(this.STORAGE_KEY);
            if (savedData) {
                this.songs = JSON.parse(savedData);
                console.log('Loaded from storage:', this.songs.length, 'songs');
            } else {
                console.log('No data in storage');
                this.songs = [];
            }
        } catch (error) {
            console.error('Error loading from storage:', error);
            this.songs = [];
        }
    },
    
    // Simpan ke localStorage
    saveToStorage: function() {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.songs));
            console.log('Saved to storage:', this.songs.length, 'songs');
            
            // Trigger event untuk update UI
            document.dispatchEvent(new CustomEvent('musicDataChanged', {
                detail: { songs: this.songs }
            }));
        } catch (error) {
            console.error('Error saving to storage:', error);
        }
    },
    
    // Menambahkan musik baru
    addSong: function(songData) {
        // Validasi data
        if (!songData.title || !songData.artist || !songData.albumArt || !songData.audioUrl) {
            throw new Error('Data lagu tidak lengkap');
        }
        
        const song = {
            id: this.nextId++,
            title: songData.title,
            artist: songData.artist,
            album: songData.album || 'Single',
            genre: songData.genre || 'Pop',
            albumArt: songData.albumArt,
            audioUrl: songData.audioUrl,
            duration: songData.duration || '3:00',
            uploadedBy: songData.uploadedBy || 'admin',
            uploadDate: new Date().toLocaleString(),
            plays: 0,
            createdAt: new Date().getTime()
        };
        
        this.songs.push(song);
        this.saveToStorage();
        
        console.log('Song added:', song);
        return song;
    },
    
    // Mendapatkan semua musik
    getAllSongs: function() {
        // Urutkan berdasarkan tanggal upload (terbaru dulu)
        return [...this.songs].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    },
    
    // Mendapatkan musik berdasarkan ID
    getSongById: function(id) {
        const song = this.songs.find(song => song.id === id);
        if (!song) {
            console.warn('Song not found with ID:', id);
        }
        return song;
    },
    
    // Menghapus musik berdasarkan ID
    deleteSong: function(id) {
        const index = this.songs.findIndex(song => song.id === id);
        if (index !== -1) {
            const deleted = this.songs.splice(index, 1)[0];
            this.saveToStorage();
            console.log('Song deleted:', deleted);
            return true;
        }
        return false;
    },
    
    // Mengupdate musik
    updateSong: function(id, updatedData) {
        const song = this.getSongById(id);
        if (song) {
            Object.assign(song, updatedData);
            this.saveToStorage();
            console.log('Song updated:', song);
            return true;
        }
        return false;
    },
    
    // Menambah play count
    incrementPlays: function(id) {
        const song = this.getSongById(id);
        if (song) {
            song.plays = (song.plays || 0) + 1;
            this.saveToStorage();
            return song.plays;
        }
        return 0;
    },
    
    // Mencari musik
    searchSongs: function(query) {
        if (!query) return this.getAllSongs();
        
        query = query.toLowerCase().trim();
        return this.songs.filter(song => 
            song.title.toLowerCase().includes(query) ||
            song.artist.toLowerCase().includes(query) ||
            (song.album && song.album.toLowerCase().includes(query))
        );
    },
    
    // Filter by genre
    filterByGenre: function(genre) {
        if (!genre || genre === 'all') return this.getAllSongs();
        return this.songs.filter(song => song.genre === genre);
    },
    
    // Mendapatkan statistik
    getStats: function() {
        return {
            totalSongs: this.songs.length,
            totalArtists: new Set(this.songs.map(s => s.artist)).size,
            totalAlbums: new Set(this.songs.map(s => s.album)).size,
            totalPlays: this.songs.reduce((sum, song) => sum + (song.plays || 0), 0)
        };
    },
    
    // Hapus semua data
    clearAll: function() {
        this.songs = [];
        this.nextId = 1;
        localStorage.removeItem(this.STORAGE_KEY);
        console.log('All data cleared');
        
        // Trigger event
        document.dispatchEvent(new CustomEvent('musicDataChanged', {
            detail: { songs: [] }
        }));
    },
    
    // Sample data untuk demo
    addSampleData: function() {
        console.log('Adding sample data...');
        
        const sampleSongs = [
            {
                title: 'Berita Kepada Kawan',
                artist: 'Ebiet G. Ade',
                album: 'Camellia',
                genre: 'Pop',
                albumArt: 'https://via.placeholder.com/300x300/667eea/ffffff?text=EBIT',
                audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
                duration: '4:30'
            },
            {
                title: 'Kisah Kasih di Sekolah',
                artist: 'Chrisye',
                album: 'Kisah Kasih',
                genre: 'Pop',
                albumArt: 'https://via.placeholder.com/300x300/764ba2/ffffff?text=CHRISYE',
                audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
                duration: '5:15'
            },
            {
                title: 'Bohemian Rhapsody',
                artist: 'Queen',
                album: 'A Night at the Opera',
                genre: 'Rock',
                albumArt: 'https://via.placeholder.com/300x300/e74c3c/ffffff?text=QUEEN',
                audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
                duration: '5:55'
            },
            {
                title: 'Take Five',
                artist: 'Dave Brubeck',
                album: 'Time Out',
                genre: 'Jazz',
                albumArt: 'https://via.placeholder.com/300x300/3498db/ffffff?text=JAZZ',
                audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
                duration: '5:24'
            },
            {
                title: 'Ghibah',
                artist: 'Via Vallen',
                album: 'Via Vallen',
                genre: 'Dangdut',
                albumArt: 'https://via.placeholder.com/300x300/f1c40f/ffffff?text=DANGDUT',
                audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
                duration: '4:45'
            }
        ];
        
        sampleSongs.forEach(song => {
            song.id = this.nextId++;
            song.createdAt = new Date().getTime() - Math.random() * 10000000;
            this.songs.push(song);
        });
        
        this.saveToStorage();
        console.log('Sample data added:', this.songs.length, 'songs');
    }
};

// Inisialisasi saat file dimuat
MusicData.init();