// Music Data Management - VERSION PERMANEN DENGAN JSON
const MusicData = {
    // Key untuk localStorage
    STORAGE_KEY: 'music_library_permanent',
    BACKUP_KEY: 'music_library_backup',
    
    // Array untuk menyimpan musik
    songs: [],
    
    // ID counter
    nextId: 1,
    
    // Metadata
    metadata: {
        totalSongs: 0,
        lastUpdated: null,
        version: '1.0'
    },
    
    // Inisialisasi data
    init: function() {
        console.log('MusicData init dengan sistem permanen...');
        
        // Coba load dari localStorage dulu
        const loaded = this.loadFromStorage();
        
        if (!loaded || this.songs.length === 0) {
            console.log('Tidak ada data di storage, load dari JSON internal');
            this.loadFromJSON();
        }
        
        // Update ID counter
        if (this.songs.length > 0) {
            this.nextId = Math.max(...this.songs.map(s => s.id)) + 1;
        }
        
        // Update metadata
        this.updateMetadata();
        
        // Simpan ke storage
        this.saveToStorage();
        
        console.log('Music Data initialized:', this.songs.length, 'songs');
        console.log('Next ID:', this.nextId);
        
        return this.songs;
    },
    
    // Load dari localStorage
    loadFromStorage: function() {
        try {
            const savedData = localStorage.getItem(this.STORAGE_KEY);
            if (savedData) {
                const data = JSON.parse(savedData);
                this.songs = data.songs || [];
                this.metadata = data.metadata || this.metadata;
                console.log('Loaded from storage:', this.songs.length, 'songs');
                return true;
            }
        } catch (error) {
            console.error('Error loading from storage:', error);
        }
        return false;
    },
    
    // Load dari JSON internal (data default)
    loadFromJSON: function() {
        // Data default dari JSON
        this.songs = [];
        
        console.log('Loaded from JSON internal:', this.songs.length, 'songs');
    },
    
    // Simpan ke localStorage
    saveToStorage: function() {
        try {
            const dataToSave = {
                songs: this.songs,
                metadata: this.metadata,
                lastBackup: new Date().toISOString()
            };
            
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(dataToSave));
            
            // Buat backup
            this.createBackup();
            
            console.log('Saved to storage:', this.songs.length, 'songs');
            
            // Trigger event untuk update UI
            this.dispatchChangeEvent();
            
            return true;
        } catch (error) {
            console.error('Error saving to storage:', error);
            return false;
        }
    },
    
    // Buat backup
    createBackup: function() {
        try {
            const backup = {
                songs: this.songs,
                metadata: this.metadata,
                backupDate: new Date().toISOString()
            };
            localStorage.setItem(this.BACKUP_KEY, JSON.stringify(backup));
        } catch (error) {
            console.error('Error creating backup:', error);
        }
    },
    
    // Restore dari backup
    restoreFromBackup: function() {
        try {
            const backup = localStorage.getItem(this.BACKUP_KEY);
            if (backup) {
                const data = JSON.parse(backup);
                this.songs = data.songs || [];
                this.metadata = data.metadata || this.metadata;
                this.saveToStorage();
                console.log('Restored from backup:', this.songs.length, 'songs');
                return true;
            }
        } catch (error) {
            console.error('Error restoring from backup:', error);
        }
        return false;
    },
    
    // Dispatch change event
    dispatchChangeEvent: function() {
        const event = new CustomEvent('musicDataChanged', {
            detail: { 
                songs: this.songs,
                total: this.songs.length,
                metadata: this.metadata
            }
        });
        document.dispatchEvent(event);
    },
    
    // Update metadata
    updateMetadata: function() {
        this.metadata = {
            totalSongs: this.songs.length,
            totalArtists: new Set(this.songs.map(s => s.artist)).size,
            totalAlbums: new Set(this.songs.map(s => s.album)).size,
            totalPlays: this.songs.reduce((sum, song) => sum + (song.plays || 0), 0),
            lastUpdated: new Date().toLocaleString(),
            version: '1.0'
        };
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
            createdAt: Date.now()
        };
        
        this.songs.push(song);
        this.updateMetadata();
        this.saveToStorage();
        
        console.log('Song added:', song);
        return song;
    },
    
    // Menambahkan multiple songs (untuk import)
    addMultipleSongs: function(songsArray) {
        let added = 0;
        songsArray.forEach(songData => {
            try {
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
                    uploadDate: songData.uploadDate || new Date().toLocaleString(),
                    plays: songData.plays || 0,
                    createdAt: songData.createdAt || Date.now()
                };
                this.songs.push(song);
                added++;
            } catch (e) {
                console.error('Error adding song:', e);
            }
        });
        
        this.updateMetadata();
        this.saveToStorage();
        console.log(`Added ${added} songs`);
        return added;
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
            this.updateMetadata();
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
            this.updateMetadata();
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
            this.updateMetadata();
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
            totalPlays: this.songs.reduce((sum, song) => sum + (song.plays || 0), 0),
            lastUpdated: this.metadata.lastUpdated
        };
    },
    
    // Export ke JSON string
    exportToJSON: function() {
        const exportData = {
            songs: this.songs,
            metadata: this.metadata,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
        return JSON.stringify(exportData, null, 2);
    },
    
    // Import dari JSON string
    importFromJSON: function(jsonString) {
        try {
            const importData = JSON.parse(jsonString);
            
            if (importData.songs && Array.isArray(importData.songs)) {
                // Validasi struktur data
                const validSongs = importData.songs.filter(song => 
                    song.title && song.artist && song.albumArt && song.audioUrl
                );
                
                // Assign ID baru
                validSongs.forEach(song => {
                    song.id = this.nextId++;
                    if (!song.createdAt) song.createdAt = Date.now();
                });
                
                this.songs = [...this.songs, ...validSongs];
                this.updateMetadata();
                this.saveToStorage();
                
                console.log(`Imported ${validSongs.length} songs`);
                return { success: true, count: validSongs.length };
            }
            
            return { success: false, message: 'Format JSON tidak valid' };
        } catch (error) {
            console.error('Error importing JSON:', error);
            return { success: false, message: error.message };
        }
    },
    
    // Reset ke data awal (dari JSON)
    resetToDefault: function() {
        if (confirm('Reset ke data default? Semua perubahan akan hilang!')) {
            this.songs = [];
            this.loadFromJSON();
            this.updateMetadata();
            this.saveToStorage();
            this.dispatchChangeEvent();
            console.log('Reset to default data');
            return true;
        }
        return false;
    },
    
    // Hapus semua data
    clearAll: function() {
        this.songs = [];
        this.nextId = 1;
        this.metadata = {
            totalSongs: 0,
            totalArtists: 0,
            totalAlbums: 0,
            totalPlays: 0,
            lastUpdated: new Date().toLocaleString(),
            version: '1.0'
        };
        localStorage.removeItem(this.STORAGE_KEY);
        console.log('All data cleared');
        
        // Trigger event
        this.dispatchChangeEvent();
    },
    
    // Sample data untuk demo
    addSampleData: function() {
        this.loadFromJSON();
        this.updateMetadata();
        this.saveToStorage();
        this.dispatchChangeEvent();
    }
};

// Inisialisasi saat file dimuat
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing MusicData...');
    MusicData.init();
    
    // Debug info
    console.log('Songs in storage:', MusicData.getAllSongs().length);
});