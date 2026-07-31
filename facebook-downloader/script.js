// Facebook Video Downloader - Enhanced JavaScript with Multiple APIs

class FacebookDownloader {
    constructor() {
        this.apis = {
            rapidapi: {
                name: "RapidAPI Facebook",
                url: "https://facebook-video-downloader.p.rapidapi.com/",
                method: "GET",
                format: "query",
                reliable: true,
                requiresKey: true
            },
            downtik: {
                name: "DownTik",
                url: "https://downtik.com/api/convert",
                method: "POST",
                format: "json",
                reliable: true
            },
            getvideo: {
                name: "GetVideo API",
                url: "https://api.getvideo.io/v1/facebook/",
                method: "POST",
                format: "json",
                reliable: false
            },
            savefrom: {
                name: "SaveFrom.net",
                url: "https://savefrom.net/api/convert",
                method: "POST",
                format: "json",
                reliable: false
            }
        };
        this.currentPostData = null;
        this.selectedQuality = 'source';
        this.init();
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        const urlInput = document.getElementById('facebookUrl');
        const processBtn = document.getElementById('processBtn');
        
        // Enter key support
        urlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.processPost();
            }
        });

        // Process button
        processBtn.addEventListener('click', () => {
            this.processPost();
        });

        // Download buttons
        document.getElementById('downloadVideo').addEventListener('click', () => {
            this.downloadMedia('video');
        });

        document.getElementById('downloadImage').addEventListener('click', () => {
            this.downloadMedia('image');
        });

        document.getElementById('downloadAlbum').addEventListener('click', () => {
            this.downloadAlbum();
        });

        // Quality buttons
        document.querySelectorAll('.quality-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.selectQuality(e.target.closest('.quality-btn'));
            });
        });
    }

    async processPost() {
        const urlInput = document.getElementById('facebookUrl');
        const processBtn = document.getElementById('processBtn');
        const errorMessage = document.getElementById('errorMessage');
        const resultsSection = document.getElementById('resultsSection');
        
        const url = urlInput.value.trim();
        
        // Reset states
        this.hideError();
        resultsSection.style.display = 'none';
        
        // Validate URL
        if (!this.isValidFacebookUrl(url)) {
            this.showError('Por favor, ingresa una URL válida de Facebook (video, post, story o reel)');
            return;
        }

        // Show loading state
        this.setLoadingState(true);
        
        try {
            // Detect content type
            const contentType = this.detectContentType(url);
            
            // Try multiple APIs for best quality
            const postData = await this.fetchWithBestQuality(url);
            
            if (!postData) {
                throw new Error('No se pudo obtener el post de ninguna API');
            }
            
            // Add content type to data
            postData.contentType = contentType;
            
            this.displayPostData(postData);
            this.showContentInfo(postData);
            this.updateDownloadOptions(postData);
            resultsSection.style.display = 'block';
            
            // Scroll to results
            resultsSection.scrollIntoView({ behavior: 'smooth' });
            
        } catch (error) {
            console.error('Error processing post:', error);
            this.showError('Error al procesar el post. Verifica que la URL sea correcta y el contenido sea público.');
        } finally {
            this.setLoadingState(false);
        }
    }

    // Detect content type from URL
    detectContentType(url) {
        if (url.includes('/watch/')) return 'video';
        if (url.includes('/videos/')) return 'video';
        if (url.includes('/posts/')) return 'post';
        if (url.includes('/story.php')) return 'story';
        if (url.includes('/reel/')) return 'reel';
        if (url.includes('/photos/')) return 'photo';
        if (url.includes('/album/')) return 'album';
        return 'post';
    }

    // Validate Facebook URL
    isValidFacebookUrl(url) {
        const patterns = [
            /^https?:\/\/(www\.)?facebook\.com\/.+/,
            /^https?:\/\/m\.facebook\.com\/.+/,
            /^https?:\/\/fb\.com\/.+/
        ];
        
        return patterns.some(pattern => pattern.test(url));
    }

    async fetchWithBestQuality(url) {
        const results = [];
        
        // Try each API in order of reliability
        for (const [apiKey, api] of Object.entries(this.apis)) {
            try {
                console.log(`Trying ${api.name}...`);
                const data = await this.fetchFromAPI(api, url);
                if (data && this.isValidResponse(data)) {
                    results.push({
                        api: api.name,
                        data: data,
                        quality: this.analyzeQuality(data)
                    });
                    console.log(`${api.name} succeeded:`, data.fileSize || 'No size info', 'bytes');
                }
            } catch (error) {
                console.log(`${api.name} failed:`, error.message);
            }
        }
        
        // Return the best quality result
        if (results.length === 0) {
            return null;
        }
        
        // Sort by quality score (file size, resolution info)
        results.sort((a, b) => b.quality.score - a.quality.score);
        
        console.log('Best quality API:', results[0].api, 'Score:', results[0].quality.score);
        return results[0].data;
    }

    async fetchFromAPI(api, url) {
        let requestOptions = {
            method: api.method,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        };

        let requestUrl = api.url;

        // Handle different API formats
        if (api.format === 'query') {
            if (apiKey === 'rapidapi') {
                // RapidAPI Facebook Downloader
                const apiKey = localStorage.getItem('rapidapi_key');
                if (!apiKey) {
                    throw new Error('RapidAPI key required');
                }
                requestUrl += `?url=${encodeURIComponent(url)}`;
                requestOptions.headers['X-RapidAPI-Key'] = apiKey;
                requestOptions.headers['X-RapidAPI-Host'] = 'facebook-video-downloader.p.rapidapi.com';
            } else {
                requestUrl += `?url=${encodeURIComponent(url)}`;
            }
        } else if (api.format === 'json') {
            requestOptions.headers['Content-Type'] = 'application/json';
            requestOptions.body = JSON.stringify({
                url: url,
                format: 'mp4'
            });
        }

        const response = await fetch(requestUrl, requestOptions);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        return this.normalizeApiResponse(data, api.name);
    }

    normalizeApiResponse(data, apiName) {
        // Normalize different API response formats
        if (apiName === 'RapidAPI Facebook') {
            return {
                mediaUrl: data.video_url || data.download_url || data.url,
                thumbnail: data.thumbnail || data.picture,
                title: data.title || 'Facebook Post',
                author: data.from?.name || data.author || 'Unknown',
                authorAvatar: data.from?.picture?.data?.url || data.author_avatar,
                description: data.description || data.message,
                reactions: data.reactions?.data?.length || data.like_count || 0,
                comments: data.comments?.data?.length || data.comments_count || 0,
                shares: data.shares?.count || data.shares_count || 0,
                uploadDate: data.created_time || data.upload_date,
                isVideo: data.is_video || data.media_type === 'video',
                fileSize: data.file_size,
                duration: data.video_duration || data.duration || 0,
                width: data.width,
                height: data.height,
                contentType: data.content_type || 'post'
            };
        } else if (apiName === 'DownTik') {
            return {
                mediaUrl: data.download_url,
                thumbnail: data.title: data.thumbnail,
                || 'Facebook Content',
                author: data.author || 'Unknown',
                isVideo: data.is_video || false,
                fileSize: data.file_size,
                duration: data.duration || 0
            };
        } else if (apiName === 'GetVideo API') {
            return {
                mediaUrl: data.url,
                thumbnail: data.thumbnail,
                title: data.title,
                author: data.author,
                isVideo: data.is_video || false,
                fileSize: data.filesize,
                duration: data.duration
            };
        } else if (apiName === 'SaveFrom.net') {
            return {
                mediaUrl: data.url,
                thumbnail: data.thumbnail,
                title: data.title,
                author: data.author,
                isVideo: data.is_video || false,
                fileSize: data.filesize
            };
        }
        
        // Fallback for unknown formats
        return data;
    }

    isValidResponse(data) {
        return data && (data.mediaUrl || data.video_url || data.url);
    }

    analyzeQuality(data) {
        let score = 0;
        let quality = 'Unknown';
        
        // Resolution analysis
        if (data.width && data.height) {
            const totalPixels = data.width * data.height;
            if (totalPixels >= 1920 * 1080) { // 1080p
                score += 90;
                quality = 'HD (1080p)';
            } else if (totalPixels >= 1280 * 720) { // 720p
                score += 70;
                quality = 'HD (720p)';
            } else if (totalPixels >= 854 * 480) { // 480p
                score += 50;
                quality = 'SD (480p)';
            } else {
                score += 30;
                quality = 'Low Quality';
            }
        }
        
        // File size analysis
        if (data.fileSize) {
            const mb = data.fileSize / (1024 * 1024);
            if (mb > 100) {
                score += 20;
            } else if (mb > 20) {
                score += 10;
            }
        }
        
        // Content type bonus
        if (data.contentType === 'video') {
            score += 15; // Videos are usually higher quality
        }
        
        // Engagement bonus
        if (data.reactions > 1000) {
            score += 10;
        } else if (data.reactions > 100) {
            score += 5;
        }
        
        return { score, quality };
    }

    showContentInfo(postData) {
        const quality = this.analyzeQuality(postData);
        
        document.getElementById('contentType').textContent = this.getTypeDisplay(postData.contentType);
        document.getElementById('contentQuality').textContent = quality.quality;
        document.getElementById('fileSize').textContent = this.formatFileSize(postData.fileSize);
        document.getElementById('contentDuration').textContent = this.formatDuration(postData.duration);
    }

    updateDownloadOptions(postData) {
        const isVideo = postData.isVideo || postData.contentType === 'video' || postData.contentType === 'reel';
        const isAlbum = postData.contentType === 'album';
        const isPhoto = postData.contentType === 'photo';
        
        // Update download buttons
        const downloadVideoBtn = document.getElementById('downloadVideo');
        const downloadImageBtn = document.getElementById('downloadImage');
        const downloadAlbumBtn = document.getElementById('downloadAlbum');
        const qualityButtons = document.getElementById('qualityButtons');
        
        if (isAlbum) {
            downloadVideoBtn.style.display = 'none';
            downloadImageBtn.style.display = 'none';
            downloadAlbumBtn.style.display = 'flex';
            qualityButtons.style.display = 'none';
        } else if (isVideo) {
            downloadVideoBtn.style.display = 'flex';
            downloadImageBtn.style.display = 'none';
            downloadAlbumBtn.style.display = 'none';
            qualityButtons.style.display = 'flex';
        } else if (isPhoto) {
            downloadVideoBtn.style.display = 'none';
            downloadImageBtn.style.display = 'flex';
            downloadAlbumBtn.style.display = 'none';
            qualityButtons.style.display = 'none';
        } else {
            // Default to video if unclear
            downloadVideoBtn.style.display = 'flex';
            downloadImageBtn.style.display = 'none';
            downloadAlbumBtn.style.display = 'none';
            qualityButtons.style.display = 'flex';
        }
    }

    displayPostData(data) {
        // Update thumbnail
        const postThumbnail = document.getElementById('postThumbnail');
        postThumbnail.src = data.thumbnail || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgdmlld0JveD0iMCAwIDMyMCAxODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjMyMCIgaGVpZ2h0PSIxODAiIGZpbGw9IiNGMEYyRjUiLz48dGV4dCB4PSIxNjAiIHk9IjkwIiBmb250LWZhbWlseT0iSW50ZXIiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM2NTY3NkIiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkNhcGFydHVyYSBkZSBGYWNlYm9vazwvdGV4dD48L3N2Zz4=';
        postThumbnail.alt = 'Post thumbnail';

        // Update post type badge
        const postTypeBadge = document.querySelector('.post-type-badge span');
        postTypeBadge.textContent = this.getTypeDisplay(data.contentType).toUpperCase();

        // Update title
        document.getElementById('postTitle').textContent = data.title || 'Facebook Post';

        // Update author info
        const authorAvatar = document.getElementById('authorAvatar');
        authorAvatar.src = data.authorAvatar || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyNCIgY3k9IjI0IiByPSIyNCIgZmlsbD0iI0RERkZEMiIvPjx0ZXh0IHg9IjI0IiB5PSIzMiIgZm9udC1mYW1pbHk9IkludGVyIiBmb250LXNpemU9IjE2IiBmaWxsPSIjNjU2NzZCIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5GPC90ZXh0Pjwvc3ZnPg==';
        
        document.getElementById('authorName').textContent = data.author || 'Usuario';

        // Update date
        document.getElementById('postDate').textContent = this.formatDate(data.uploadDate);

        // Update content
        const content = document.getElementById('postContent');
        content.textContent = data.description ? 
            (data.description.length > 200 ? data.description.substring(0, 200) + '...' : data.description) :
            'Sin descripción disponible';

        // Update stats
        document.getElementById('reactionsCount').textContent = this.formatNumber(data.reactions || 0);
        document.getElementById('commentsCount').textContent = this.formatNumber(data.comments || 0);
        document.getElementById('sharesCount').textContent = this.formatNumber(data.shares || 0);

        // Store data for downloads
        this.currentPostData = data;
    }

    getTypeDisplay(type) {
        const types = {
            'video': 'Video',
            'post': 'Post',
            'story': 'Story',
            'reel': 'Reel',
            'photo': 'Foto',
            'album': 'Álbum'
        };
        return types[type] || 'Post';
    }

    formatDuration(seconds) {
        if (!seconds || seconds === 0) return '--';
        const hours = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        
        if (hours > 0) {
            return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    formatNumber(num) {
        if (!num) return '0';
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }

    formatFileSize(bytes) {
        if (!bytes) return 'Unknown';
        const mb = bytes / (1024 * 1024);
        return mb < 1 ? `${(bytes / 1024).toFixed(1)} KB` : `${mb.toFixed(1)} MB`;
    }

    formatDate(dateString) {
        if (!dateString) return 'Fecha desconocida';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch {
            return 'Fecha desconocida';
        }
    }

    selectQuality(btn) {
        // Remove active class from all buttons
        document.querySelectorAll('.quality-btn').forEach(b => b.classList.remove('active'));
        
        // Add active class to clicked button
        btn.classList.add('active');
        
        // Update selected quality
        this.selectedQuality = btn.dataset.quality;
    }

    downloadMedia(type) {
        if (!this.currentPostData) {
            this.showError('No hay datos de post disponibles');
            return;
        }

        const url = this.currentPostData.mediaUrl;
        if (!url) {
            this.showError('No se encontró URL de media');
            return;
        }

        const extension = type === 'image' ? 'jpg' : 'mp4';
        const quality = this.selectedQuality === 'source' ? 'original' : this.selectedQuality;
        const filename = `facebook-${this.currentPostData.contentType}-${quality}-${Date.now()}.${extension}`;
        
        this.initiateDownload(url, filename);
    }

    downloadAlbum() {
        if (!this.currentPostData) {
            this.showError('No hay datos de álbum disponibles');
            return;
        }

        // For album downloads, we would typically zip multiple images
        // For now, show a message
        this.showError('La descarga de álbumes requiere procesamiento adicional. Intenta descargar las imágenes individualmente.');
    }

    initiateDownload(url, filename) {
        // Create temporary anchor element
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.target = '_blank';
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Show success message
        this.showSuccess(`Descargando ${filename}...`);
    }

    setLoadingState(isLoading) {
        const processBtn = document.getElementById('processBtn');
        const btnText = processBtn.querySelector('.btn-text');
        const spinner = processBtn.querySelector('.spinner');
        
        if (isLoading) {
            processBtn.disabled = true;
            btnText.style.display = 'none';
            spinner.style.display = 'block';
        } else {
            processBtn.disabled = false;
            btnText.style.display = 'block';
            spinner.style.display = 'none';
        }
    }

    showError(message) {
        const errorMessage = document.getElementById('errorMessage');
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            this.hideError();
        }, 5000);
    }

    hideError() {
        const errorMessage = document.getElementById('errorMessage');
        errorMessage.style.display = 'none';
    }

    showSuccess(message) {
        // Create success notification
        const notification = document.createElement('div');
        notification.className = 'success-notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #10B981;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            font-weight: 500;
            z-index: 1000;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            animation: slideInRight 0.3s ease-out;
        `;

        // Add animation keyframes if not exists
        if (!document.querySelector('#success-animation')) {
            const style = document.createElement('style');
            style.id = 'success-animation';
            style.textContent = `
                @keyframes slideInRight {
                    from {
                        opacity: 0;
                        transform: translateX(100%);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(notification);

        // Auto-remove after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new FacebookDownloader();
});

// Add useful utilities
window.FacebookUtils = {
    extractPostId: (url) => {
        const match = url.match(/\/(posts|videos|watch)\/(\d+)/);
        return match ? match[2] : null;
    },

    isValidUrl: (url) => {
        const patterns = [
            /^https?:\/\/(www\.)?facebook\.com\/.+/,
            /^https?:\/\/m\.facebook\.com\/.+/,
            /^https?:\/\/fb\.com\/.+/
        ];
        
        return patterns.some(pattern => pattern.test(url));
    },

    getErrorMessage: (error) => {
        const messages = {
            'Network request failed': 'Error de conexión. Verifica tu internet.',
            'Invalid URL': 'URL no válida. Asegúrate de copiar la URL completa.',
            'Private content': 'Este contenido es privado y no se puede descargar.',
            'Content not found': 'El contenido no se encontró o ha sido eliminado.',
            'Rate limit exceeded': 'Has alcanzado el límite de descargas. Intenta más tarde.',
            'API key required': 'Se requiere clave de API para acceder a este servicio.',
            'Video not available': 'El video no está disponible para descarga.'
        };
        return messages[error] || 'Error desconocido. Intenta nuevamente.';
    }
};

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        const input = document.getElementById('facebookUrl');
        if (document.activeElement === input) {
            // Let the browser handle paste normally
        }
    }
    
    if (e.key === 'Escape') {
        const errorMessage = document.getElementById('errorMessage');
        if (errorMessage.style.display !== 'none') {
            errorMessage.style.display = 'none';
        }
    }
});

// Add drag and drop support
document.addEventListener('dragover', (e) => {
    e.preventDefault();
});

document.addEventListener('drop', (e) => {
    e.preventDefault();
    const input = document.getElementById('facebookUrl');
    const text = e.dataTransfer.getData('text');
    if (text && text.includes('facebook.com')) {
        input.value = text;
        input.focus();
    }
});

console.log('📘 Enhanced Facebook Downloader loaded with multiple APIs!');
