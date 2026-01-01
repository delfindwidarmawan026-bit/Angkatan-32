// Global variables with error handling
let photos = [];
let currentFilter = 'kegiatan';
let currentPage = 1;
const photosPerPage = 15;
let filteredPhotos = [];
let isLoading = false;

// Performance optimization flags
const MAX_PHOTOS_RENDER = 20;
const LAZY_LOAD_THRESHOLD = 6;
const BATCH_SIZE = 12;

// Error tracking and recovery
let errorCount = 0;
const MAX_ERRORS = 5;
let lastErrorTime = 0;

// DOM elements with safe initialization
let photoGrid, fileInput, uploadArea, modal, modalImage, modalTitle, modalDescription, modalCategory, totalPhotosElement;

// Safe DOM element initialization
function initializeDOMElements() {
    try {
        photoGrid = document.getElementById('photoGrid');
        fileInput = document.getElementById('fileInput');
        uploadArea = document.getElementById('uploadArea');
        modal = document.getElementById('photoModal');
        modalImage = document.getElementById('modalImage');
        modalTitle = document.getElementById('modalTitle');
        modalDescription = document.getElementById('modalDescription');
        modalCategory = document.getElementById('modalCategory');
        totalPhotosElement = document.getElementById('totalPhotos');
        return true;
    } catch (error) {
        console.error('Error initializing DOM elements:', error);
        return false;
    }
}

// Global error handlers
window.addEventListener('error', function(event) {
    console.error('Global error:', event.error);
    handleError(event.error, 'Global Error');
});

window.addEventListener('unhandledrejection', function(event) {
    console.error('Promise rejection:', event.reason);
    handleError(event.reason, 'Promise Rejection');
});

// Centralized error handling
function handleError(error, context = 'Unknown') {
    errorCount++;
    const currentTime = Date.now();
    
    if (currentTime - lastErrorTime < 5000) return;
    lastErrorTime = currentTime;
    
    console.error(`[${context}] Error #${errorCount}:`, error);
    
    if (errorCount <= MAX_ERRORS) {
        showErrorMessage('Terjadi kesalahan kecil. Website tetap berfungsi normal.');
    }
    
    // Auto-recovery
    if (errorCount <= 3) {
        setTimeout(() => {
            try {
                initializeDOMElements();
                if (photos.length === 0) loadSamplePhotos();
            } catch (e) {
                console.error('Recovery failed:', e);
            }
        }, 2000);
    }
}

function showErrorMessage(message) {
    try {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-notification';
        errorDiv.innerHTML = `
            <div class="error-content">
                <i class="fas fa-exclamation-circle"></i>
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        document.body.appendChild(errorDiv);
        setTimeout(() => errorDiv.remove(), 5000);
    } catch (e) {
        console.error('Failed to show error:', e);
    }
}

// Intro Screen Control
let introShown = false;

// Initialize app with comprehensive error handling
document.addEventListener('DOMContentLoaded', function() {
    try {
        // Clear stored states
        sessionStorage.removeItem('introShown');
        localStorage.removeItem('introShown');
        window.scrollTo(0, 0);
        
        // Initialize DOM elements safely
        if (!initializeDOMElements()) {
            setTimeout(() => {
                initializeDOMElements();
                showIntroScreen();
            }, 1000);
            return;
        }
        
        // Reset intro state
        introShown = false;
        showIntroScreen();
        
    } catch (error) {
        handleError(error, 'App Initialization');
        
        // Emergency fallback
        setTimeout(() => {
            try {
                document.body.innerHTML = `
                    <div style="text-align: center; padding: 50px; font-family: Arial;">
                        <h2>Album Al-Kahfi Angkatan ke-32</h2>
                        <p>Website sedang memuat. Silakan refresh halaman.</p>
                        <button onclick="location.reload()" style="padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 5px; cursor: pointer;">
                            Refresh Halaman
                        </button>
                    </div>
                `;
            } catch (e) {
                console.error('Emergency fallback failed:', e);
            }
        }, 3000);
    }
});

function showIntroScreen() {
    const introScreen = document.getElementById('introScreen');
    
    if (!introScreen) {
        initializeApp();
        loadSamplePhotos();
        return;
    }
    
    // Always reset intro state on page load
    introShown = false;
    
    // Hide main content initially and reset scroll
    document.body.style.overflow = 'hidden';
    window.scrollTo(0, 0);
    
    // Remove any browser styling that might cause blue lines
    document.body.style.border = 'none';
    document.body.style.outline = 'none';
    document.documentElement.style.border = 'none';
    document.documentElement.style.outline = 'none';
    
    // Ensure intro screen is visible and clean
    introScreen.style.display = 'flex';
    introScreen.style.animation = 'none';
    introScreen.style.border = 'none';
    introScreen.style.outline = 'none';
    introScreen.style.boxShadow = 'none';
    
    // Start intro sequence with longer duration for smoother experience
    setTimeout(() => {
        hideIntroScreen();
    }, 8000); // 8 seconds intro duration
    
    // Allow skip intro by clicking
    introScreen.addEventListener('click', () => {
        if (!introShown) {
            hideIntroScreen();
        }
    });
    
    // Allow skip intro with any key
    document.addEventListener('keydown', (e) => {
        if (!introShown) {
            hideIntroScreen();
        }
    });
}

function hideIntroScreen() {
    if (introShown) return;
    
    introShown = true;
    const introScreen = document.getElementById('introScreen');
    
    if (introScreen) {
        introScreen.style.animation = 'introFadeOut 1.5s ease-in-out forwards';
        
        setTimeout(() => {
            introScreen.style.display = 'none';
            document.body.style.overflow = 'auto';
            
            // Scroll to top after intro
            window.scrollTo(0, 0);
            
            // Initialize main app
            initializeApp();
            loadSamplePhotos();
            
            // Add smoother entrance animation to main content
            document.querySelector('header').style.animation = 'fadeInUp 1.2s ease-out';
            document.querySelector('main').style.animation = 'fadeInUp 1.2s ease-out 0.3s both';
        }, 1500); // Increased fade out duration
    }
}

// Add page refresh detection and intro reset
window.addEventListener('beforeunload', function() {
    // Clear any intro state before page unload
    sessionStorage.removeItem('introShown');
    localStorage.removeItem('introShown');
});

// Handle page visibility change (when user comes back to tab)
document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
        // Reset scroll position when page becomes visible
        setTimeout(() => {
            window.scrollTo(0, 0);
        }, 100);
    }
});

// Handle browser back/forward navigation
window.addEventListener('pageshow', function(event) {
    if (event.persisted) {
        // Page was loaded from cache (back/forward navigation)
        // Reset everything and show intro again
        introShown = false;
        window.scrollTo(0, 0);
        showIntroScreen();
    }
});

// Health check and recovery system
function performHealthCheck() {
    try {
        // Check critical elements
        const criticalElements = ['photoGrid', 'modal'];
        let healthScore = 0;
        
        criticalElements.forEach(elementId => {
            if (document.getElementById(elementId)) {
                healthScore++;
            }
        });
        
        // Check if photos are loaded
        if (photos && photos.length > 0) {
            healthScore++;
        }
        
        // Check if functions exist
        if (typeof renderPhotos === 'function' && typeof openModal === 'function') {
            healthScore++;
        }
        
        const healthPercentage = (healthScore / 4) * 100;
        console.log(`Website health: ${healthPercentage}%`);
        
        // Auto-recovery if health is low
        if (healthPercentage < 75) {
            console.log('Low health detected, attempting recovery...');
            setTimeout(() => {
                try {
                    initializeDOMElements();
                    if (photos.length === 0) {
                        loadSamplePhotos();
                    }
                    renderPhotos();
                } catch (e) {
                    console.error('Recovery failed:', e);
                }
            }, 1000);
        }
        
        return healthPercentage;
    } catch (error) {
        handleError(error, 'Health Check');
        return 0;
    }
}

// Periodic health monitoring
setInterval(() => {
    try {
        performHealthCheck();
    } catch (error) {
        console.error('Health check failed:', error);
    }
}, 30000); // Check every 30 seconds

// Browser compatibility checks
function checkBrowserCompatibility() {
    const features = {
        localStorage: typeof Storage !== 'undefined',
        intersectionObserver: 'IntersectionObserver' in window,
        fetch: typeof fetch !== 'undefined',
        promises: typeof Promise !== 'undefined'
    };
    
    const unsupportedFeatures = Object.keys(features).filter(key => !features[key]);
    
    if (unsupportedFeatures.length > 0) {
        console.warn('Unsupported features:', unsupportedFeatures);
        showErrorMessage('Browser Anda mungkin tidak mendukung semua fitur. Website tetap berfungsi dengan fitur dasar.');
    }
    
    return unsupportedFeatures.length === 0;
}

// Safe function execution wrapper
function safeExecute(fn, context = 'Unknown', fallback = null) {
    try {
        return fn();
    } catch (error) {
        handleError(error, context);
        if (fallback && typeof fallback === 'function') {
            try {
                return fallback();
            } catch (fallbackError) {
                console.error('Fallback also failed:', fallbackError);
            }
        }
        return null;
    }
}

// Enhanced initialization with fallbacks
function initializeApp() {
    safeExecute(() => {
        // Check browser compatibility
        checkBrowserCompatibility();
        
        // Initialize DOM elements
        if (!initializeDOMElements()) {
            throw new Error('Failed to initialize DOM elements');
        }
        
        // Mobile navigation
        const hamburger = document.querySelector('.hamburger');
        const navMenu = document.querySelector('.nav-menu');
        
        if (hamburger && navMenu) {
            hamburger.addEventListener('click', () => {
                navMenu.classList.toggle('active');
            });
        }

        // Smooth scrolling
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });

        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                safeExecute(() => {
                    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                    this.classList.add('active');
                    currentFilter = this.getAttribute('data-filter');
                    renderPhotos();
                }, 'Filter Button Click');
            });
        });

        // File upload handling
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                safeExecute(() => handleFileSelect(e), 'File Input Change');
            });
        }

        // Drag and drop
        if (uploadArea) {
            uploadArea.addEventListener('dragover', (e) => {
                safeExecute(() => handleDragOver(e), 'Drag Over');
            });
            uploadArea.addEventListener('dragleave', (e) => {
                safeExecute(() => handleDragLeave(e), 'Drag Leave');
            });
            uploadArea.addEventListener('drop', (e) => {
                safeExecute(() => handleDrop(e), 'Drop');
            });
        }

        // Modal handling
        if (modal) {
            const closeBtn = modal.querySelector('.close');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    safeExecute(() => closeModal(), 'Modal Close');
                });
            }
            
            modal.addEventListener('click', function(e) {
                if (e.target === modal) {
                    safeExecute(() => closeModal(), 'Modal Background Click');
                }
            });
        }

        // Bulk upload checkbox
        const bulkUploadCheckbox = document.getElementById('bulkUpload');
        const bulkSettings = document.getElementById('bulkSettings');
        const uploadBtnText = document.getElementById('uploadBtnText');
        
        if (bulkUploadCheckbox) {
            bulkUploadCheckbox.addEventListener('change', function() {
                safeExecute(() => {
                    if (this.checked) {
                        bulkSettings.style.display = 'block';
                        uploadBtnText.textContent = 'Upload Semua Foto';
                        document.getElementById('photoTitle').placeholder = 'Tidak digunakan untuk bulk upload';
                        document.getElementById('photoTitle').disabled = true;
                    } else {
                        bulkSettings.style.display = 'none';
                        uploadBtnText.textContent = 'Upload';
                        document.getElementById('photoTitle').placeholder = 'Judul foto';
                        document.getElementById('photoTitle').disabled = false;
                    }
                }, 'Bulk Upload Toggle');
            });
        }

        console.log('App initialized successfully');
        
    }, 'App Initialization', () => {
        // Fallback initialization
        console.log('Using fallback initialization');
        setTimeout(() => location.reload(), 5000);
    });
}

function loadSamplePhotos() {
    // Sample photos untuk demo
    const samplePhotos = [
        {
            id: 1,
            title: 'Sholat Berjamaah',
            description: 'Kegiatan sholat berjamaah santri di masjid pesantren',
            category: 'kegiatan',
            src: 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=400&h=300&fit=crop',
            date: new Date().toISOString()
        },
        {
            id: 2,
            title: 'Kegiatan PETER',
            description: 'Kegiatan PETER (Pesantren Entrepreneur) santri Al-Kahfi',
            category: 'peter',
            src: 'https://images.unsplash.com/photo-1609599006353-e629aaabfeae?w=400&h=300&fit=crop',
            date: new Date().toISOString()
        },
        {
            id: 3,
            title: 'Peringatan Maulid Nabi',
            description: 'Acara peringatan Maulid Nabi Muhammad SAW',
            category: 'acara',
            src: 'https://images.unsplash.com/photo-1542816417-0983c9c9ad53?w=400&h=300&fit=crop',
            date: new Date().toISOString()
        },
        {
            id: 4,
            title: 'Wisuda Santri',
            description: 'Acara wisuda dan khataman santri Al-Kahfi',
            category: 'acara',
            src: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=400&h=300&fit=crop',
            date: new Date().toISOString()
        }
    ];

    // Study Tour M Beach Photos
    const studyTourPhotos = [
        'IMG_9808 (1).JPG', 'IMG_9809 (1).JPG', 'IMG_9810 (1).JPG', 'IMG_9811 (1).JPG', 'IMG_9812 (1).JPG',
        'IMG_9813 (1).JPG', 'IMG_9814 (1).JPG', 'IMG_9815 (1).JPG', 'IMG_9816 (1).JPG', 'IMG_9817 (1).JPG',
        'IMG_9818 (1).JPG', 'IMG_9819 (1).JPG', 'IMG_9820 (1).JPG', 'IMG_9821 (1).JPG', 'IMG_9822 (1).JPG',
        'IMG_9827 (1).JPG', 'IMG_9828 (1).JPG', 'IMG_9829 (1).JPG', 'IMG_9830 (1).JPG', 'IMG_9831 (1).JPG',
        'IMG_9832 (1).JPG', 'IMG_9833 (1).JPG', 'IMG_9834 (1).JPG', 'IMG_9835 (1).JPG', 'IMG_9836 (1).JPG',
        'IMG_9837 (1).JPG', 'IMG_9838 (1).JPG', 'IMG_9839 (1).JPG', 'IMG_9840 (1).JPG', 'IMG_9841 (1).JPG',
        'IMG_9842 (1).JPG', 'IMG_9843 (1).JPG', 'IMG_9844 (1).JPG', 'IMG_9845 (1).JPG', 'IMG_9846 (1).JPG',
        'IMG_9847 (1).JPG', 'IMG_9848 (1).JPG', 'IMG_9849 (1).JPG', 'IMG_9850 (1).JPG', 'IMG_9851 (1).JPG',
        'IMG_9852 (1).JPG', 'IMG_9853 (1).JPG', 'IMG_9854 (1).JPG'
    ];

    // M Beach Random 1 Photos - Folder pertama
    const mBeachRandom1Photos = [
        'IMG_0003.JPG', 'IMG_0005.JPG', 'IMG_0006.JPG', 'IMG_0011.JPG', 'IMG_0014.JPG', 'IMG_0020.JPG',
        'IMG_0024.JPG', 'IMG_0025.JPG', 'IMG_0032.JPG', 'IMG_0032(1).JPG', 'IMG_0034.JPG', 'IMG_0034(1).JPG',
        'IMG_0036.JPG', 'IMG_0036(1).JPG', 'IMG_0037.JPG', 'IMG_0039.JPG', 'IMG_0041.JPG', 'IMG_0044.JPG',
        'IMG_0045.JPG', 'IMG_0046.JPG', 'IMG_0048.JPG', 'IMG_0050.JPG', 'IMG_0051.JPG', 'IMG_0053.JPG',
        'IMG_0054.JPG', 'IMG_0055.JPG', 'IMG_0058.JPG', 'IMG_0059.JPG', 'IMG_0060.JPG', 'IMG_0061.JPG',
        'IMG_0063.JPG', 'IMG_0071.JPG', 'IMG_0072.JPG', 'IMG_0074.JPG', 'IMG_0075.JPG', 'IMG_0076.JPG',
        'IMG_0095.JPG', 'IMG_0102.JPG', 'IMG_0103.JPG', 'IMG_0104.JPG', 'IMG_0106.JPG', 'IMG_0110.JPG',
        'IMG_0111.JPG', 'IMG_0112.JPG', 'IMG_9778.JPG', 'IMG_9783.JPG', 'IMG_9790.JPG', 'IMG_9791.JPG',
        'IMG_9792 (1).JPG', 'IMG_9793.JPG', 'IMG_9796.JPG', 'IMG_9801.JPG', 'IMG_9802.JPG', 'IMG_9803.JPG',
        'IMG_9804.JPG', 'IMG_9823 (1).JPG', 'IMG_9855 (1).JPG', 'IMG_9861.JPG', 'IMG_9864.JPG', 'IMG_9872 (1).JPG',
        'IMG_9873 (1).JPG', 'IMG_9928 (1).JPG', 'IMG_9929 (1).JPG', 'IMG_9930 (1).JPG', 'IMG_9931 (1).JPG',
        'IMG_9938 (1).JPG', 'IMG_9940 (1).JPG', 'IMG_9942 (1).JPG', 'IMG_9945 (1).JPG', 'IMG_9946 (1).JPG',
        'IMG_9952 (1).JPG', 'IMG_9953 (1).JPG', 'IMG_9954 (1).JPG', 'IMG_9956 (1).JPG', 'IMG_9958 (1).JPG',
        'IMG_9960 (1).JPG', 'IMG_9964 (1).JPG', 'IMG_9965 (1).JPG', 'IMG_9967 (1).JPG', 'IMG_9971.JPG',
        'IMG_9972.JPG', 'IMG_9973.JPG', 'IMG_9980.JPG', 'IMG_9981.JPG', 'IMG_9989.JPG', 'IMG_9990.JPG',
        'IMG_9995.JPG', 'IMG_9996.JPG', 'IMG_9998.JPG', 'IMG_9999.JPG'
    ];

    // M Beach Random 2 Photos - Folder kedua
    const mBeachRandom2Photos = [
        'IMG_0007.JPG', 'IMG_0009.JPG', 'IMG_0010.JPG', 'IMG_0015.JPG', 'IMG_0016.JPG', 'IMG_0017.JPG',
        'IMG_0018.JPG', 'IMG_0019.JPG', 'IMG_0021.JPG', 'IMG_0022.JPG', 'IMG_0023.JPG', 'IMG_0030.JPG',
        'IMG_0031.JPG', 'IMG_0038.JPG', 'IMG_0040.JPG', 'IMG_0042.JPG', 'IMG_0043.JPG', 'IMG_0047.JPG',
        'IMG_0052.JPG', 'IMG_0056.JPG', 'IMG_0057.JPG', 'IMG_0062.JPG', 'IMG_0064.JPG', 'IMG_0073.JPG',
        'IMG_0088.JPG', 'IMG_0092.JPG', 'IMG_0093.JPG', 'IMG_0094.JPG', 'IMG_0101.JPG', 'IMG_0105.JPG',
        'IMG_0107.JPG', 'IMG_0108.JPG', 'IMG_0109.JPG', 'IMG_9776.JPG', 'IMG_9777.JPG', 'IMG_9779.JPG',
        'IMG_9788.JPG', 'IMG_9789.JPG', 'IMG_9798.JPG', 'IMG_9806.JPG', 'IMG_9807 (1).JPG', 'IMG_9824 (1).JPG',
        'IMG_9874 (1).JPG', 'IMG_9932 (1).JPG', 'IMG_9932 (1)(1).JPG', 'IMG_9939 (1).JPG', 'IMG_9941 (1).JPG',
        'IMG_9943 (1).JPG', 'IMG_9944 (1).JPG', 'IMG_9947 (1).JPG', 'IMG_9948 (1).JPG', 'IMG_9949 (1).JPG',
        'IMG_9951 (1).JPG', 'IMG_9955 (1).JPG', 'IMG_9957 (1).JPG', 'IMG_9961 (1).JPG', 'IMG_9962 (1).JPG',
        'IMG_9963 (1).JPG', 'IMG_9966 (1).JPG', 'IMG_9968 (1).JPG', 'IMG_9969 (1).JPG', 'IMG_9970.JPG',
        'IMG_9974.JPG', 'IMG_9979.JPG', 'IMG_9982.JPG', 'IMG_9991.JPG', 'IMG_9992.JPG', 'IMG_9993.JPG',
        'IMG_9994.JPG', 'IMG_9997.JPG'
    ];

    let currentId = 7;
    
    // Add Study Tour photos
    studyTourPhotos.forEach((filename, index) => {
        samplePhotos.push({
            id: currentId++,
            title: `Study Tour M Beach - Foto ${index + 1}`,
            description: `Kegiatan study tour santri Al-Kahfi di M Beach`,
            category: 'studytour',
            src: `./formal/${filename}`,
            date: new Date().toISOString()
        });
    });

    // Add M Beach Random 1 photos from first folder
    mBeachRandom1Photos.forEach((filename, index) => {
        samplePhotos.push({
            id: currentId++,
            title: `M Beach Random - Foto ${index + 1}`,
            description: `Momen random santri di M Beach`,
            category: 'mbeachrandom1',
            src: `./M Beach Random 1/${filename}`,
            date: new Date().toISOString()
        });
    });

    // Add M Beach Random 2 photos from second folder
    mBeachRandom2Photos.forEach((filename, index) => {
        samplePhotos.push({
            id: currentId++,
            title: `M Beach Random - Foto ${mBeachRandom1Photos.length + index + 1}`,
            description: `Momen random santri di M Beach`,
            category: 'mbeachrandom2',
            src: `./M Beach Random 2/${filename}`,
            date: new Date().toISOString()
        });
    });

    // Hanya load sample photos jika belum ada photos di storage
    if (photos.length === 0) {
        photos = samplePhotos;
        savePhotosToStorage();
        renderPhotos();
        updatePhotoCount();
    }
}

function renderPhotos() {
    if (!photoGrid) return;
    
    // Gabungkan kedua kategori M Beach Random menjadi satu
    if (currentFilter === 'mbeachrandom') {
        filteredPhotos = photos.filter(photo => 
            photo.category === 'mbeachrandom1' || 
            photo.category === 'mbeachrandom2'
        );
    } else {
        filteredPhotos = photos.filter(photo => photo.category === currentFilter);
    }
    
    // Clear grid
    photoGrid.innerHTML = '';
    
    // Show loading if many photos
    if (filteredPhotos.length > MAX_PHOTOS_RENDER) {
        showPhotoLoadingMessage();
    }
    
    // Render photos with pagination for performance
    const photosToRender = filteredPhotos.slice(0, Math.min(MAX_PHOTOS_RENDER, filteredPhotos.length));
    
    photosToRender.forEach((photo, index) => {
        const photoElement = createPhotoElement(photo, index);
        photoGrid.appendChild(photoElement);
    });
    
    // Add load more button if there are more photos
    if (filteredPhotos.length > MAX_PHOTOS_RENDER) {
        addLoadMoreButton();
    }
    
    // Add animation with staggered delay
    setTimeout(() => {
        document.querySelectorAll('.photo-item').forEach((item, index) => {
            item.style.animation = `fadeInUp 0.6s ease ${Math.min(index * 0.05, 1)}s both`;
        });
    }, 100);
    
    // Update photo count display
    updatePhotoCountDisplay();
}

function showPhotoLoadingMessage() {
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'photo-loading-message';
    loadingDiv.innerHTML = `
        <div class="loading-content">
            <i class="fas fa-images"></i>
            <p>Memuat ${filteredPhotos.length} foto M Beach Random...</p>
            <small>Menampilkan ${Math.min(MAX_PHOTOS_RENDER, filteredPhotos.length)} foto pertama untuk loading yang cepat</small>
            <div class="loading-progress">
                <div class="progress-bar">
                    <div class="progress-fill"></div>
                </div>
                <small>Optimized untuk ${filteredPhotos.length} foto</small>
            </div>
        </div>
    `;
    photoGrid.appendChild(loadingDiv);
    
    // Animate progress bar
    setTimeout(() => {
        const progressFill = loadingDiv.querySelector('.progress-fill');
        if (progressFill) {
            progressFill.style.width = `${(MAX_PHOTOS_RENDER / filteredPhotos.length) * 100}%`;
        }
    }, 100);
}

function addLoadMoreButton() {
    const remainingPhotos = filteredPhotos.length - MAX_PHOTOS_RENDER;
    const nextBatchSize = Math.min(BATCH_SIZE, remainingPhotos);
    
    const loadMoreDiv = document.createElement('div');
    loadMoreDiv.className = 'load-more-container';
    loadMoreDiv.innerHTML = `
        <button class="load-more-btn" onclick="loadMorePhotos()">
            <i class="fas fa-plus-circle"></i>
            Muat ${nextBatchSize} Foto Lagi
            <small>(${remainingPhotos} tersisa dari ${filteredPhotos.length} total)</small>
        </button>
        <div class="load-progress-info">
            <div class="progress-indicator">
                <span class="loaded-count">${MAX_PHOTOS_RENDER}</span>
                <span class="separator">/</span>
                <span class="total-count">${filteredPhotos.length}</span>
            </div>
            <small>Loading bertahap untuk performa optimal</small>
        </div>
    `;
    photoGrid.appendChild(loadMoreDiv);
}

function loadMorePhotos() {
    if (isLoading) return;
    
    isLoading = true;
    const loadMoreBtn = document.querySelector('.load-more-btn');
    if (loadMoreBtn) {
        loadMoreBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memuat...';
    }
    
    // Ultra-fast loading with minimal delay
    setTimeout(() => {
        const currentRendered = document.querySelectorAll('.photo-item').length;
        const nextBatch = filteredPhotos.slice(currentRendered, currentRendered + BATCH_SIZE);
        
        // Remove loading message and load more button
        const loadingMessage = document.querySelector('.photo-loading-message');
        const loadMoreContainer = document.querySelector('.load-more-container');
        if (loadingMessage) loadingMessage.remove();
        if (loadMoreContainer) loadMoreContainer.remove();
        
        // Add new photos with optimized rendering
        const fragment = document.createDocumentFragment();
        nextBatch.forEach((photo, index) => {
            const photoElement = createPhotoElement(photo, currentRendered + index);
            fragment.appendChild(photoElement);
        });
        photoGrid.appendChild(fragment);
        
        // Add load more button again if needed
        const totalRendered = currentRendered + nextBatch.length;
        if (totalRendered < filteredPhotos.length) {
            addLoadMoreButton();
        } else {
            // Show completion message
            showLoadingComplete(totalRendered);
        }
        
        // Ultra-fast animation for better perceived performance
        setTimeout(() => {
            const newPhotos = Array.from(document.querySelectorAll('.photo-item')).slice(currentRendered);
            newPhotos.forEach((item, index) => {
                item.style.animation = `fadeInUp 0.3s ease ${index * 0.02}s both`;
            });
        }, 10);
        
        isLoading = false;
        updatePhotoCountDisplay();
    }, 100); // Reduced from 200ms to 100ms
}

function showLoadingComplete(totalLoaded) {
    const completeDiv = document.createElement('div');
    completeDiv.className = 'loading-complete';
    completeDiv.innerHTML = `
        <div class="complete-content">
            <i class="fas fa-check-circle"></i>
            <p>Semua ${totalLoaded} foto berhasil dimuat!</p>
            <small>M Beach Random - Koleksi lengkap</small>
        </div>
    `;
    photoGrid.appendChild(completeDiv);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        if (completeDiv.parentElement) {
            completeDiv.remove();
        }
    }, 3000);
}

function updatePhotoCountDisplay() {
    const renderedCount = document.querySelectorAll('.photo-item').length;
    const totalCount = filteredPhotos.length;
    
    // Update section title to show count
    const sectionTitle = document.querySelector('.gallery-section .section-title');
    if (sectionTitle && totalCount > 0) {
        const categoryName = getCategoryName(currentFilter);
        sectionTitle.textContent = `Galeri Foto - ${categoryName} (${renderedCount}/${totalCount})`;
    }
}

function createPhotoElement(photo, index = 0) {
    const photoDiv = document.createElement('div');
    photoDiv.className = 'photo-item';
    photoDiv.setAttribute('data-category', photo.category);
    photoDiv.setAttribute('data-index', index);
    
    // Ultra-aggressive lazy loading - only load first 6 images immediately
    const shouldLoadImmediately = index < 6;
    const imgSrc = shouldLoadImmediately ? photo.src : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkxvYWRpbmcuLi48L3RleHQ+PC9zdmc+';
    
    photoDiv.innerHTML = `
        <img src="${imgSrc}" 
             data-src="${photo.src}" 
             alt="${photo.title}" 
             loading="lazy"
             class="${!shouldLoadImmediately ? 'lazy-image' : ''}"
             style="opacity: ${shouldLoadImmediately ? '1' : '0'}; transition: opacity 0.3s ease;"
             onload="this.style.opacity=1">
        <div class="photo-overlay">
            <h3>${photo.title}</h3>
            <p>${photo.description}</p>
            <span class="category-tag">${getCategoryName(photo.category)}</span>
        </div>
    `;
    
    photoDiv.addEventListener('click', () => openModal(photo));
    
    // Setup aggressive lazy loading for images beyond the first 6
    if (!shouldLoadImmediately) {
        setupFastLazyLoading(photoDiv.querySelector('img'));
    }
    
    return photoDiv;
}

// Enhanced lazy loading with faster intersection
function setupFastLazyLoading(img) {
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('lazy-image');
                    img.classList.add('loaded');
                    img.style.opacity = '1';
                    imageObserver.unobserve(img);
                }
            });
        }, {
            rootMargin: '100px 0px', // Load images 100px before they come into view
            threshold: 0.1
        });
        
        imageObserver.observe(img);
    } else {
        // Fallback for older browsers
        img.src = img.dataset.src;
        img.classList.remove('lazy-image');
        img.style.opacity = '1';
    }
}

// Improved lazy loading
function setupLazyLoading(img) {
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('lazy-image');
                    img.classList.add('loaded');
                    imageObserver.unobserve(img);
                }
            });
        }, {
            rootMargin: '50px 0px' // Load images 50px before they come into view
        });
        
        imageObserver.observe(img);
    } else {
        // Fallback for older browsers
        img.src = img.dataset.src;
        img.classList.remove('lazy-image');
    }
}

function getCategoryName(category) {
    const categoryNames = {
        'kegiatan': 'Kegiatan',
        'peter': 'PETER',
        'acara': 'Acara',
        'studytour': 'Study Tour M Beach',
        'mbeachrandom': 'M Beach Random',
        'mbeachrandom1': 'M Beach Random',  // Akan ditampilkan sebagai M Beach Random
        'mbeachrandom2': 'M Beach Random',  // Akan ditampilkan sebagai M Beach Random
        'reorganisasipeter': 'Reorganisasi Peter'
    };
    return categoryNames[category] || category;
}

function filterPhotos() {
    renderPhotos();
}

function openModal(photo) {
    if (!modal) return;
    
    modalImage.src = photo.src;
    modalImage.alt = photo.title;
    modalTitle.textContent = photo.title;
    modalDescription.textContent = photo.description;
    modalCategory.textContent = getCategoryName(photo.category);
    modalCategory.className = `category-tag category-${photo.category}`;
    
    // Add photo metadata
    const photoDate = document.getElementById('photoDate');
    const photoId = document.getElementById('photoId');
    if (photoDate) {
        const date = new Date(photo.date);
        photoDate.textContent = `Diupload: ${date.toLocaleDateString('id-ID')}`;
    }
    if (photoId) {
        photoId.textContent = photo.id;
    }
    
    // Store current photo for deletion
    window.currentPhotoForDeletion = photo;
    
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    if (!modal) return;
    
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
    
    // Clear current photo reference
    window.currentPhotoForDeletion = null;
}

// Delete photo functions
function deleteCurrentPhoto() {
    if (!window.currentPhotoForDeletion) {
        showNotification('❌ Tidak ada foto yang dipilih untuk dihapus');
        return;
    }
    
    showDeleteConfirmation(window.currentPhotoForDeletion);
}

function showDeleteConfirmation(photo) {
    const confirmationDiv = document.createElement('div');
    confirmationDiv.className = 'delete-confirmation';
    confirmationDiv.innerHTML = `
        <h3><i class="fas fa-exclamation-triangle"></i> Konfirmasi Hapus</h3>
        <p>Apakah Anda yakin ingin menghapus foto "<strong>${photo.title}</strong>"?</p>
        <p><small>Tindakan ini tidak dapat dibatalkan.</small></p>
        <div class="confirmation-buttons">
            <button class="confirm-delete-btn" onclick="confirmDeletePhoto(${photo.id})">
                <i class="fas fa-trash-alt"></i> Ya, Hapus
            </button>
            <button class="cancel-delete-btn" onclick="cancelDeletePhoto()">
                <i class="fas fa-times"></i> Batal
            </button>
        </div>
    `;
    
    document.body.appendChild(confirmationDiv);
    
    // Add backdrop
    const backdrop = document.createElement('div');
    backdrop.className = 'delete-backdrop';
    backdrop.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        z-index: 2999;
    `;
    document.body.appendChild(backdrop);
    
    // Store references for cleanup
    window.deleteConfirmationElements = {
        confirmation: confirmationDiv,
        backdrop: backdrop
    };
}

function confirmDeletePhoto(photoId) {
    // Find and remove photo from array
    const photoIndex = photos.findIndex(photo => photo.id === photoId);
    
    if (photoIndex === -1) {
        showNotification('❌ Foto tidak ditemukan');
        cancelDeletePhoto();
        return;
    }
    
    const deletedPhoto = photos[photoIndex];
    photos.splice(photoIndex, 1);
    
    // Save updated photos to storage
    savePhotosToStorage();
    
    // Re-render photos
    renderPhotos();
    updatePhotoCount();
    
    // Close modal and cleanup
    closeModal();
    cancelDeletePhoto();
    
    // Show success notification
    showNotification(`✅ Foto "${deletedPhoto.title}" berhasil dihapus`);
    
    // Log deletion for debugging
    console.log(`Photo deleted: ${deletedPhoto.title} (ID: ${deletedPhoto.id})`);
}

function cancelDeletePhoto() {
    if (window.deleteConfirmationElements) {
        const { confirmation, backdrop } = window.deleteConfirmationElements;
        
        if (confirmation && confirmation.parentElement) {
            confirmation.remove();
        }
        if (backdrop && backdrop.parentElement) {
            backdrop.remove();
        }
        
        window.deleteConfirmationElements = null;
    }
}

// Enhanced photo management functions
function getPhotoById(photoId) {
    return photos.find(photo => photo.id === photoId);
}

function getPhotosByCategory(category) {
    if (category === 'mbeachrandom') {
        return photos.filter(photo => 
            photo.category === 'mbeachrandom1' || 
            photo.category === 'mbeachrandom2'
        );
    }
    return photos.filter(photo => photo.category === category);
}

function getTotalPhotoCount() {
    return photos.length;
}

function getPhotoCountByCategory() {
    const counts = {};
    photos.forEach(photo => {
        if (photo.category === 'mbeachrandom1' || photo.category === 'mbeachrandom2') {
            counts['mbeachrandom'] = (counts['mbeachrandom'] || 0) + 1;
        } else {
            counts[photo.category] = (counts[photo.category] || 0) + 1;
        }
    });
    return counts;
}

// File upload functions
function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    processFiles(files);
}

function handleDragOver(e) {
    e.preventDefault();
    uploadArea.classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    
    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length > 0) {
        processFiles(imageFiles);
    } else {
        alert('Harap pilih file gambar yang valid!');
    }
}

function processFiles(files) {
    files.forEach(file => {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                // Preview the image (you can add preview functionality here)
                console.log('File loaded:', file.name);
            };
            reader.readAsDataURL(file);
        }
    });
    
    // Show success message
    showNotification('File berhasil dipilih! Silakan isi informasi foto dan klik Upload.');
}

function uploadPhoto() {
    const category = document.getElementById('photoCategory').value;
    const description = document.getElementById('photoDescription').value.trim();
    const fileInput = document.getElementById('fileInput');
    const isBulkUpload = document.getElementById('bulkUpload').checked;
    
    if (!fileInput.files.length) {
        alert('Harap pilih file foto!');
        return;
    }
    
    if (isBulkUpload) {
        // Bulk upload
        const bulkPrefix = document.getElementById('bulkPrefix').value.trim() || 'Foto';
        const files = Array.from(fileInput.files);
        
        if (files.length === 0) {
            alert('Harap pilih foto untuk bulk upload!');
            return;
        }
        
        let uploadedCount = 0;
        const totalFiles = files.length;
        
        showNotification(`Memulai upload ${totalFiles} foto...`);
        
        files.forEach((file, index) => {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const newPhoto = {
                        id: Date.now() + index,
                        title: `${bulkPrefix} - Foto ${index + 1}`,
                        description: description || `${bulkPrefix} foto ke-${index + 1}`,
                        category: category,
                        src: e.target.result,
                        date: new Date().toISOString()
                    };
                    
                    photos.unshift(newPhoto);
                    uploadedCount++;
                    
                    // Update progress
                    if (uploadedCount === totalFiles) {
                        savePhotosToStorage();
                        renderPhotos();
                        updatePhotoCount();
                        
                        // Clear form
                        document.getElementById('bulkPrefix').value = '';
                        document.getElementById('photoDescription').value = '';
                        fileInput.value = '';
                        document.getElementById('bulkUpload').checked = false;
                        document.getElementById('bulkSettings').style.display = 'none';
                        document.getElementById('uploadBtnText').textContent = 'Upload';
                        document.getElementById('photoTitle').disabled = false;
                        document.getElementById('photoTitle').placeholder = 'Judul foto';
                        
                        showNotification(`Berhasil upload ${totalFiles} foto!`);
                        
                        setTimeout(() => {
                            document.getElementById('gallery').scrollIntoView({ behavior: 'smooth' });
                        }, 1000);
                    }
                };
                reader.readAsDataURL(file);
            }
        });
        
    } else {
        // Single upload
        const title = document.getElementById('photoTitle').value.trim();
        
        if (!title) {
            alert('Harap masukkan judul foto!');
            return;
        }
        
        const file = fileInput.files[0];
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const newPhoto = {
                id: Date.now(),
                title: title,
                description: description || 'Tidak ada deskripsi',
                category: category,
                src: e.target.result,
                date: new Date().toISOString()
            };
            
            photos.unshift(newPhoto);
            savePhotosToStorage();
            renderPhotos();
            updatePhotoCount();
            
            // Clear form
            document.getElementById('photoTitle').value = '';
            document.getElementById('photoDescription').value = '';
            fileInput.value = '';
            
            showNotification('Foto berhasil diupload!');
            
            setTimeout(() => {
                document.getElementById('gallery').scrollIntoView({ behavior: 'smooth' });
            }, 1000);
        };
        
        reader.readAsDataURL(file);
    }
}

function showNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: linear-gradient(135deg, #667eea, #764ba2);
        color: white;
        padding: 15px 25px;
        border-radius: 10px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        z-index: 3000;
        animation: slideInRight 0.3s ease;
        max-width: 300px;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Storage functions with size management
function savePhotosToStorage() {
    try {
        const dataString = JSON.stringify(photos);
        const sizeInMB = (new Blob([dataString]).size / 1024 / 1024).toFixed(2);
        
        // Check storage size
        if (sizeInMB > 8) { // Warning at 8MB (localStorage limit is ~10MB)
            showStorageWarning(sizeInMB);
        }
        
        localStorage.setItem('schoolAlbumPhotos', dataString);
        console.log(`Photos saved to storage. Size: ${sizeInMB}MB`);
    } catch (e) {
        if (e.name === 'QuotaExceededError') {
            showStorageFullError();
        } else {
            console.error('Error saving photos to storage:', e);
        }
    }
}

function showStorageWarning(sizeInMB) {
    const warningDiv = document.createElement('div');
    warningDiv.className = 'storage-warning';
    warningDiv.innerHTML = `
        <div class="warning-content">
            <i class="fas fa-exclamation-triangle"></i>
            <h3>Peringatan Kapasitas Storage</h3>
            <p>Data foto sudah mencapai ${sizeInMB}MB. Browser memiliki batas ~10MB.</p>
            <p><strong>Rekomendasi:</strong> Untuk 1000+ foto, gunakan server atau cloud storage.</p>
            <button onclick="this.parentElement.parentElement.remove()" class="warning-close">
                <i class="fas fa-times"></i> Tutup
            </button>
        </div>
    `;
    
    document.body.appendChild(warningDiv);
    
    setTimeout(() => {
        if (warningDiv.parentElement) {
            warningDiv.remove();
        }
    }, 10000);
}

function showStorageFullError() {
    alert(`❌ STORAGE PENUH!\n\nBrowser tidak dapat menyimpan lebih banyak foto.\n\nSolusi:\n1. Hapus beberapa foto lama\n2. Gunakan server/database untuk storage\n3. Kompres ukuran foto\n\nUntuk 1000+ foto, disarankan menggunakan backend server.`);
}

// Enhanced upload with compression
function compressImage(file, maxWidth = 1200, quality = 0.8) {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = () => {
            // Calculate new dimensions
            let { width, height } = img;
            if (width > maxWidth) {
                height = (height * maxWidth) / width;
                width = maxWidth;
            }
            
            canvas.width = width;
            canvas.height = height;
            
            // Draw and compress
            ctx.drawImage(img, 0, 0, width, height);
            canvas.toBlob(resolve, 'image/jpeg', quality);
        };
        
        img.src = URL.createObjectURL(file);
    });
}

// Storage functions with enhanced error handling
function savePhotosToStorage() {
    try {
        const dataString = JSON.stringify(photos);
        const sizeInMB = (new Blob([dataString]).size / 1024 / 1024).toFixed(2);
        
        if (sizeInMB > 8) {
            showStorageWarning(sizeInMB);
        }
        
        localStorage.setItem('schoolAlbumPhotos', dataString);
        console.log(`Photos saved successfully. Size: ${sizeInMB}MB`);
        return true;
    } catch (e) {
        if (e.name === 'QuotaExceededError') {
            showStorageFullError();
        } else {
            handleError(e, 'Storage Save');
            showErrorMessage('Gagal menyimpan foto. Data mungkin hilang saat refresh.');
        }
        return false;
    }
}

function loadPhotosFromStorage() {
    try {
        const savedPhotos = localStorage.getItem('schoolAlbumPhotos');
        if (!savedPhotos) {
            console.log('No saved photos found, loading sample photos');
            return false;
        }
        
        const parsedPhotos = JSON.parse(savedPhotos);
        if (!Array.isArray(parsedPhotos)) {
            throw new Error('Invalid photos data format');
        }
        
        // Filter and validate photos
        const filteredPhotos = parsedPhotos.filter(photo => {
            return photo && photo.id && photo.title && photo.category && photo.src;
        }).filter(photo => photo.category !== 'pembelajaran')
          .map(photo => {
              if (photo.category === 'tahfidz') {
                  photo.category = 'peter';
                  photo.title = photo.title.replace(/tahfidz|hafalan/gi, 'PETER');
                  photo.description = photo.description.replace(/tahfidz|hafalan/gi, 'PETER');
              }
              return photo;
          });
        
        // Validate required categories
        const hasMBeachRandom1 = filteredPhotos.some(photo => photo.category === 'mbeachrandom1');
        const hasMBeachRandom2 = filteredPhotos.some(photo => photo.category === 'mbeachrandom2');
        const hasOldMBeachRandom = filteredPhotos.some(photo => photo.category === 'mbeachrandom');
        
        if (!hasMBeachRandom1 || !hasMBeachRandom2 || hasOldMBeachRandom) {
            console.log('Photo structure outdated, reloading sample photos');
            localStorage.removeItem('schoolAlbumPhotos');
            return false;
        }
        
        photos = filteredPhotos;
        console.log(`Loaded ${photos.length} photos from storage`);
        return true;
        
    } catch (e) {
        handleError(e, 'Storage Load');
        console.error('Error loading photos from storage, using sample photos');
        localStorage.removeItem('schoolAlbumPhotos');
        return false;
    }
}

function updatePhotoCount() {
    if (totalPhotosElement) {
        totalPhotosElement.textContent = photos.length;
    }
}

// Advanced photo management functions
function clearAllPhotos() {
    if (photos.length === 0) {
        showNotification('📷 Tidak ada foto untuk dihapus');
        return;
    }
    
    const confirmationDiv = document.createElement('div');
    confirmationDiv.className = 'delete-confirmation';
    confirmationDiv.innerHTML = `
        <h3><i class="fas fa-exclamation-triangle"></i> Hapus Semua Foto</h3>
        <p>Apakah Anda yakin ingin menghapus <strong>SEMUA ${photos.length} foto</strong>?</p>
        <p><small><strong>PERINGATAN:</strong> Tindakan ini akan menghapus semua foto yang telah diupload dan tidak dapat dibatalkan!</small></p>
        <div class="confirmation-buttons">
            <button class="confirm-delete-btn" onclick="confirmClearAllPhotos()">
                <i class="fas fa-trash-alt"></i> Ya, Hapus Semua
            </button>
            <button class="cancel-delete-btn" onclick="cancelDeletePhoto()">
                <i class="fas fa-times"></i> Batal
            </button>
        </div>
    `;
    
    document.body.appendChild(confirmationDiv);
    
    // Add backdrop
    const backdrop = document.createElement('div');
    backdrop.className = 'delete-backdrop';
    backdrop.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        z-index: 2999;
    `;
    document.body.appendChild(backdrop);
    
    // Store references for cleanup
    window.deleteConfirmationElements = {
        confirmation: confirmationDiv,
        backdrop: backdrop
    };
}

function confirmClearAllPhotos() {
    const totalPhotos = photos.length;
    
    // Clear all photos
    photos = [];
    
    // Clear storage
    localStorage.removeItem('schoolAlbumPhotos');
    
    // Re-render
    renderPhotos();
    updatePhotoCount();
    
    // Cleanup confirmation
    cancelDeletePhoto();
    
    // Show success notification
    showNotification(`✅ Semua ${totalPhotos} foto berhasil dihapus`);
    
    console.log(`All photos cleared. Total deleted: ${totalPhotos}`);
}

function deletePhotosByCategory(category) {
    let photosToDelete;
    
    if (category === 'mbeachrandom') {
        photosToDelete = photos.filter(photo => 
            photo.category === 'mbeachrandom1' || 
            photo.category === 'mbeachrandom2'
        );
    } else {
        photosToDelete = photos.filter(photo => photo.category === category);
    }
    
    if (photosToDelete.length === 0) {
        showNotification(`📷 Tidak ada foto di kategori ${getCategoryName(category)}`);
        return;
    }
    
    const confirmationDiv = document.createElement('div');
    confirmationDiv.className = 'delete-confirmation';
    confirmationDiv.innerHTML = `
        <h3><i class="fas fa-exclamation-triangle"></i> Hapus Kategori</h3>
        <p>Apakah Anda yakin ingin menghapus <strong>${photosToDelete.length} foto</strong> dari kategori "<strong>${getCategoryName(category)}</strong>"?</p>
        <p><small>Tindakan ini tidak dapat dibatalkan.</small></p>
        <div class="confirmation-buttons">
            <button class="confirm-delete-btn" onclick="confirmDeleteCategory('${category}')">
                <i class="fas fa-trash-alt"></i> Ya, Hapus Kategori
            </button>
            <button class="cancel-delete-btn" onclick="cancelDeletePhoto()">
                <i class="fas fa-times"></i> Batal
            </button>
        </div>
    `;
    
    document.body.appendChild(confirmationDiv);
    
    // Add backdrop
    const backdrop = document.createElement('div');
    backdrop.className = 'delete-backdrop';
    backdrop.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        z-index: 2999;
    `;
    document.body.appendChild(backdrop);
    
    // Store references for cleanup
    window.deleteConfirmationElements = {
        confirmation: confirmationDiv,
        backdrop: backdrop
    };
}

function confirmDeleteCategory(category) {
    let deletedCount = 0;
    
    if (category === 'mbeachrandom') {
        photos = photos.filter(photo => {
            if (photo.category === 'mbeachrandom1' || photo.category === 'mbeachrandom2') {
                deletedCount++;
                return false;
            }
            return true;
        });
    } else {
        photos = photos.filter(photo => {
            if (photo.category === category) {
                deletedCount++;
                return false;
            }
            return true;
        });
    }
    
    // Save updated photos
    savePhotosToStorage();
    
    // Re-render
    renderPhotos();
    updatePhotoCount();
    
    // Cleanup confirmation
    cancelDeletePhoto();
    
    // Show success notification
    showNotification(`✅ ${deletedCount} foto dari kategori ${getCategoryName(category)} berhasil dihapus`);
    
    console.log(`Category deleted: ${category}, Photos removed: ${deletedCount}`);
}

// Utility function for development/admin
function exportPhotosData() {
    const dataStr = JSON.stringify(photos, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `al-kahfi-photos-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    showNotification('📁 Data foto berhasil diexport');
}
// Utility functions
function scrollToGallery() {
    document.getElementById('gallery').scrollIntoView({ behavior: 'smooth' });
}

// Function to clear localStorage and reload (for development)
function clearStorageAndReload() {
    localStorage.removeItem('schoolAlbumPhotos');
    location.reload();
}

// Function to force reload sample photos
function forceReloadSamplePhotos() {
    localStorage.removeItem('schoolAlbumPhotos');
    photos = [];
    loadSamplePhotos();
    console.log('Sample photos reloaded with M Beach Random!');
}

// Function to force reload M Beach Random photos specifically
function forceLoadMBeachRandom() {
    localStorage.removeItem('schoolAlbumPhotos');
    photos = [];
    loadSamplePhotos();
    renderPhotos();
    updatePhotoCount();
    console.log('M Beach Random photos loaded without pembelajaran category!');
    showNotification('Kategori pembelajaran dihapus, foto dimuat ulang!');
}

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Close modal with Escape key
    if (e.key === 'Escape' && modal.style.display === 'block') {
        closeModal();
    }
});

// Lazy loading for images
function setupLazyLoading() {
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('lazy');
                    imageObserver.unobserve(img);
                }
            });
        });

        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    }
}

// Performance optimization
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Search functionality (bonus feature)
function initializeSearch() {
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'Cari foto...';
    searchInput.style.cssText = `
        padding: 10px 15px;
        border: 2px solid #e9ecef;
        border-radius: 25px;
        font-size: 1rem;
        width: 300px;
        margin: 0 20px;
    `;
    
    const debouncedSearch = debounce((query) => {
        searchPhotos(query);
    }, 300);
    
    searchInput.addEventListener('input', (e) => {
        debouncedSearch(e.target.value);
    });
    
    // Add search input to filter buttons container
    const filterContainer = document.querySelector('.filter-buttons');
    if (filterContainer) {
        filterContainer.appendChild(searchInput);
    }
}

function searchPhotos(query) {
    if (!query.trim()) {
        renderPhotos();
        return;
    }
    
    const filteredPhotos = photos.filter(photo => 
        photo.title.toLowerCase().includes(query.toLowerCase()) ||
        photo.description.toLowerCase().includes(query.toLowerCase())
    );
    
    photoGrid.innerHTML = '';
    
    filteredPhotos.forEach(photo => {
        const photoElement = createPhotoElement(photo);
        photoGrid.appendChild(photoElement);
    });
}

// Initialize search when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(initializeSearch, 1000);
});