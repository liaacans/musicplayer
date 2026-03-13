// Auth System untuk Admin - DENGAN NAVBAR FIX
const Auth = {
    // Data user admin (hardcoded untuk keamanan)
    users: [
        {
            id: 1,
            username: 'admin',
            password: 'admin123',
            email: 'admin@music.com',
            role: 'admin'
        }
    ],
    
    // Current user yang login
    currentUser: null,
    
    // Key untuk localStorage
    SESSION_KEY: 'music_admin_session',
    
    // Inisialisasi auth - cek session yang tersimpan
    init: function() {
        console.log('Auth init...');
        
        // Cek apakah ada session tersimpan
        const savedSession = localStorage.getItem(this.SESSION_KEY);
        
        if (savedSession) {
            try {
                const sessionData = JSON.parse(savedSession);
                const user = this.users.find(u => u.id === sessionData.userId);
                
                if (user) {
                    this.currentUser = user;
                    console.log('Session restored for:', user.username);
                    
                    // Update UI navbar
                    this.updateNavbar();
                    
                    // Dispatch event untuk komponen lain
                    this.dispatchAuthEvent();
                    
                    return true;
                } else {
                    // Session tidak valid, hapus
                    localStorage.removeItem(this.SESSION_KEY);
                }
            } catch (error) {
                console.error('Error parsing session:', error);
                localStorage.removeItem(this.SESSION_KEY);
            }
        }
        
        // Update navbar untuk state tidak login
        this.updateNavbar();
        console.log('No valid session found');
        return false;
    },
    
    // Login function
    login: function(username, password) {
        console.log('Login attempt:', username);
        
        const user = this.users.find(u => u.username === username && u.password === password);
        
        if (user) {
            this.currentUser = user;
            
            // Simpan session ke localStorage
            const sessionData = {
                userId: user.id,
                username: user.username,
                role: user.role,
                loginTime: new Date().toISOString()
            };
            
            localStorage.setItem(this.SESSION_KEY, JSON.stringify(sessionData));
            console.log('Login successful, session saved');
            
            // Update navbar
            this.updateNavbar();
            
            // Dispatch event
            this.dispatchAuthEvent();
            
            return { success: true, user: user };
        }
        
        console.log('Login failed');
        return { success: false, message: 'Username atau password salah!' };
    },
    
    // Logout function
    logout: function() {
        console.log('Logout...');
        
        this.currentUser = null;
        
        // Hapus session dari localStorage
        localStorage.removeItem(this.SESSION_KEY);
        
        // Update navbar
        this.updateNavbar();
        
        // Dispatch event
        this.dispatchAuthEvent();
        
        // Sembunyikan admin section
        const adminSection = document.getElementById('admin');
        if (adminSection) {
            adminSection.style.display = 'none';
        }
    },
    
    // Update navbar berdasarkan status login
    updateNavbar: function() {
        const adminMenuContent = document.getElementById('adminMenuContent');
        
        if (!adminMenuContent) {
            console.warn('Admin menu container not found');
            return;
        }
        
        if (this.isAdmin()) {
            // Tampilkan menu admin yang sudah login
            adminMenuContent.innerHTML = `
                <div class="dropdown">
                    <a class="nav-link dropdown-toggle" href="#" id="adminDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                        <i class="fas fa-user-circle"></i> ${this.currentUser.username}
                    </a>
                    <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="adminDropdown">
                        <li><a class="dropdown-item" href="#admin" onclick="scrollToAdmin()">
                            <i class="fas fa-cog"></i> Admin Panel
                        </a></li>
                        <li><hr class="dropdown-divider"></li>
                        <li><a class="dropdown-item" href="#" onclick="Auth.logout()">
                            <i class="fas fa-sign-out-alt"></i> Logout
                        </a></li>
                    </ul>
                </div>
            `;
            
            // Tampilkan admin section
            const adminSection = document.getElementById('admin');
            if (adminSection) {
                adminSection.style.display = 'block';
                // Render music list jika fungsi tersedia
                if (typeof renderMusicList === 'function') {
                    setTimeout(() => renderMusicList(), 100);
                }
                if (typeof updateStats === 'function') {
                    setTimeout(() => updateStats(), 100);
                }
            }
            
            console.log('Navbar updated - logged in as admin');
        } else {
            // Tampilkan tombol login
            adminMenuContent.innerHTML = `
                <a class="nav-link" href="#" data-bs-toggle="modal" data-bs-target="#loginModal">
                    <i class="fas fa-sign-in-alt"></i> Admin Login
                </a>
            `;
            
            // Sembunyikan admin section
            const adminSection = document.getElementById('admin');
            if (adminSection) {
                adminSection.style.display = 'none';
            }
            
            console.log('Navbar updated - logged out');
        }
    },
    
    // Dispatch auth changed event
    dispatchAuthEvent: function() {
        const event = new CustomEvent('authChanged', { 
            detail: { user: this.currentUser } 
        });
        document.dispatchEvent(event);
    },
    
    // Cek apakah user adalah admin
    isAdmin: function() {
        return this.currentUser && this.currentUser.role === 'admin';
    },
    
    // Get current user
    getCurrentUser: function() {
        return this.currentUser;
    }
};

// Initialize auth saat halaman dimuat
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing auth...');
    
    // Tunggu sebentar untuk memastikan DOM siap
    setTimeout(() => {
        Auth.init();
    }, 100);
});

// Login function untuk form
function login(event) {
    event.preventDefault();
    
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    
    const result = Auth.login(username, password);
    
    if (result.success) {
        // Tampilkan pesan sukses
        showNotification('✅ Login berhasil! Selamat datang Admin', 'success');
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
        if (modal) modal.hide();
        
        // Clear form
        document.getElementById('loginForm').reset();
        
        // Scroll ke admin panel
        setTimeout(() => {
            const adminSection = document.getElementById('admin');
            if (adminSection) {
                adminSection.scrollIntoView({ behavior: 'smooth' });
            }
        }, 500);
    } else {
        // Tampilkan pesan error
        showNotification('❌ ' + result.message, 'error');
    }
}

// Logout function
function logout() {
    Auth.logout();
    showNotification('✅ Anda telah logout', 'info');
    
    // Scroll ke home
    document.getElementById('home').scrollIntoView({ behavior: 'smooth' });
}

// Scroll ke admin panel
function scrollToAdmin() {
    const adminSection = document.getElementById('admin');
    if (adminSection) {
        adminSection.scrollIntoView({ behavior: 'smooth' });
    }
}

// Function untuk menampilkan notifikasi
function showNotification(message, type = 'info') {
    // Cek apakah sudah ada container notifikasi
    let container = document.getElementById('notificationContainer');
    
    if (!container) {
        container = document.createElement('div');
        container.id = 'notificationContainer';
        container.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            z-index: 9999;
        `;
        document.body.appendChild(container);
    }
    
    // Buat notifikasi
    const notification = document.createElement('div');
    notification.style.cssText = `
        background: ${type === 'success' ? '#32cd32' : type === 'error' ? '#ff6b6b' : '#667eea'};
        color: white;
        padding: 15px 25px;
        border-radius: 10px;
        margin-bottom: 10px;
        box-shadow: 0 5px 20px rgba(0,0,0,0.2);
        animation: slideIn 0.3s ease;
        cursor: pointer;
        font-weight: 500;
        min-width: 250px;
    `;
    notification.innerHTML = message;
    
    // Hover effect
    notification.onmouseenter = () => {
        notification.style.opacity = '0.9';
    };
    notification.onmouseleave = () => {
        notification.style.opacity = '1';
    };
    
    // Click to close
    notification.onclick = () => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            notification.remove();
        }, 300);
    };
    
    container.appendChild(notification);
    
    // Auto remove setelah 5 detik
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }
    }, 5000);
}

// Tambahkan CSS untuk animasi notifikasi
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    /* Style untuk dropdown admin */
    .dropdown-menu {
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(10px);
        border: none;
        border-radius: 10px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        margin-top: 10px;
    }
    
    .dropdown-item {
        padding: 10px 20px;
        transition: all 0.3s ease;
    }
    
    .dropdown-item:hover {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        transform: translateX(5px);
    }
    
    .dropdown-item i {
        width: 20px;
        margin-right: 10px;
    }
    
    /* Style untuk nav link */
    .nav-link {
        color: white !important;
        font-weight: 500;
        padding: 0.5rem 1rem !important;
        transition: all 0.3s ease;
    }
    
    .nav-link:hover {
        color: #ffd700 !important;
        transform: translateY(-2px);
    }
    
    .nav-link i {
        margin-right: 5px;
    }
`;
document.head.appendChild(style);