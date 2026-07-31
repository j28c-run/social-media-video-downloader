// Instagram Video Downloader - Enhanced JavaScript with Multiple APIs

class InstagramDownloader {
    constructor() {
        this.apis = {
            rapidapi: {
                name: "RapidAPI Instagram",
                url: "https://instagram-downloader.p.rapidapi.com/ig/",
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
            instaapi: {
                name: "Instagram API",
                url: "https://www.instagram.com/",
                method: "GET",
                format: "scraper",
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
        this.init();
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        const urlInput = document.getElementById('instagramUrl');
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
        document.getElementById('downloadMedia').addEventListener('click', () => {
            this.downloadMedia();
        });

        document.getElementById('downloadStory').addEventListener('click', () => {
            this.downloadStory();
        });

        document.getElementById('downloadImage').addEventListener('click', () => {
            this.downloadFormat('image');
        });

        document.getElementById('downloadVideo').addEventListener('click', () => {
            this.downloadFormat('video');
        });
    }

    async processPost() {
        const urlInput = document.getElementById('instagramUrl');
        const processBtn = document.getElementById('processBtn');
        const errorMessage = document.getElementById('errorMessage');
        const resultsSection = document.getElementById('resultsSection');
        
        const url = urlInput.value.trim();
        
        // Reset states
        this.hideError();
        resultsSection.style.display = 'none';
        
        // Validate URL
        if (!this.isValidInstagramUrl(url)) {
            this.showError('Por favor, ingresa una URL válida de Instagram (post, story, reel o IGTV)');
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
        if (url.includes('/reel/')) return 'reel';
        if (url.includes('/p/')) return 'post';
        if (url.includes('/stories/')) return 'story';
        if (url.includes('/tv/') || url.includes('/igtv/')) return 'igtv';
        if (url.includes('/reels/')) return 'reel';
        return 'post';
    }

    // Validate Instagram URL
    isValidInstagramUrl(url) {
        const patterns = [
            /^https?:\/\/(www\.)?instagram\.com\/(p|reel|tv|stories)\/.+/,
            /^https?:\/\/instagram\.com\/(p|reel|tv|stories)\/.+/
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
                // RapidAPI Instagram Downloader
                const apiKey = localStorage.getItem('rapidapi_key');
                if (!apiKey) {
                    throw new Error('RapidAPI key required');
                }
                requestUrl += `?url=${encodeURIComponent(url)}`;
                requestOptions.headers['X-RapidAPI-Key'] = apiKey;
                requestOptions.headers['X-RapidAPI-Host'] = 'instagram-downloader.p.rapidapi.com';
            } else {
                requestUrl += `?url=${encodeURIComponent(url)}`;
            }
        } else if (api.format === 'json') {
            requestOptions.headers['Content-Type'] = 'application/json';
            requestOptions.body = JSON.stringify({
                url: url,
                format: 'mp4'
            });
        } else if (api.format === 'scraper') {
            // Web scraping approach (less reliable)
            requestUrl = url;
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
        if (apiName === 'RapidAPI Instagram') {
            return {
                mediaUrl: data.media_url || data.video_url || data.url,
                thumbnail: data.thumbnail_url || data.display_url,
                title: data.caption || 'Instagram Post',
                author: data.username || data.owner_username,
                likes: data.like_count || 0,
                comments: data.comments_count || 0,
                views: data.view_count || 0,
                isVideo: data.is_video || false,
                fileSize: data.file_size,
                duration: data.video_duration || 0,
                width: data.original_width,
                height: data.original_height,
                contentType: data.content_type || 'post'
            };
        } else if (apiName === 'DownTik') {
            return {
                mediaUrl: data.download_url,
                thumbnail: data title: data.title.thumbnail,
                || 'Instagram Content',
                author: data.author || 'Unknown',
                likes: data.likes || 0,
                comments: data.comments || 0,
                isVideo: data.is_video || false,
                fileSize: data.file_size,
                duration: data.duration || 0
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
            if (mb > 50) {
                score += 20;
            } else if (mb > 10) {
                score += 10;
            }
        }
        
        // Content type bonus
        if (data.contentType === 'reel') {
            score += 15; // Reels are usually higher quality
        } else if (data.contentType === 'igtv') {
            score += 10; // IGTV videos
        }
        
        // Engagement bonus
        if (data.likes > 10000) {
            score += 10;
        } else if (data.likes > 1000) {
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
        const isVideo = postData.isVideo || postData.mediaUrl?.includes('.mp4') || postData.contentType === 'reel' || postData.contentType === 'igtv';
        const isStory = postData.contentType === 'story';
        
        // Update download buttons
        const downloadMediaBtn = document.getElementById('downloadMedia');
        const downloadStoryBtn = document.getElementById('downloadStory');
        const downloadImageBtn = document.getElementById('downloadImage');
        const downloadVideoBtn = document.getElementById('downloadVideo');
        
        if (isStory) {
            downloadMediaBtn.style.display = 'none';
            downloadStoryBtn.style.display = 'flex';
        } else {
            downloadMediaBtn.style.display = 'flex';
            downloadStoryBtn.style.display = 'none';
        }
        
        // Show format options
        if (isVideo) {
            downloadVideoBtn.style.display = 'flex';
            downloadImageBtn.style.display = 'none';
        } else {
            downloadVideoBtn.style.display = 'none';
            downloadImageBtn.style.display = 'flex';
        }
    }

    displayPostData(data) {
        // Update thumbnail
        const postThumbnail = document.getElementById('postThumbnail');
        postThumbnail.src = data.thumbnail || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjgwIiBoZWlnaHQ9IjI4MCIgdmlld0JveD0iMCAwIDI4MCAyODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjI4MCIgaGVpZ2h0PSIyODAiIGZpbGw9IiMxODAxODEiLz48dGV4dCB4PSIxNDAiIHk9IjE0MCIgZm9udC1mYW1pbHk9IkludGVyIiBmb250LXNpemU9IjE0IiBmaWxsPSIjOEU4RTg1IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5DYXBhcnR1cmEgZGUgSU48L3RleHQ+PC9zdmc+';
        postThumbnail.alt = 'Post thumbnail';

        // Update post type badge
        const postTypeBadge = document.querySelector('.post-type-badge span');
        postTypeBadge.textContent = this.getTypeDisplay(data.contentType).toUpperCase();

        // Update title
        document.getElementById('postTitle').textContent = data.title || 'Instagram Post';

        // Update author info
        const authorAvatar = document.getElementById('authorAvatar');
        authorAvatar.src = data.author_avatar || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIxNiIgY3k9IjE2IiByPSIxNiIgZmlsbD0iI0RCREJEQiIvPjx0ZXh0IHg9IjE2IiB5PSIyMCIgZm9udC1mYW1pbHk9IkludGVyIiBmb250LXNpemU9IjEwIiBmaWxsPSIjOEU4RTg1IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5JPC90ZXh0Pjwvc3ZnPg==';
        
        document.getElementById('authorName').textContent = `@${data.author || 'usuario'}`;

        // Update meta info
        document.getElementById('likeCount').textContent = this.formatNumber(data.likes || 0) + ' likes';
        document.getElementById('viewCount').textContent = this.formatNumber(data.views || 0) + ' vistas';

        // Update caption
        const caption = document.getElementById('postCaption');
        caption.textContent = data.caption ? 
            (data.caption.length > 150 ? data.caption.substring(0, 150) + '...' : data.caption) :
            'Sin descripción disponible';

        // Update stats
        document.getElementById('likesCount').textContent = this.formatNumber(data.likes || 0);
        document.getElementById('commentsCount').textContent = this.formatNumber(data.comments || 0);

        // Store data for downloads
        this.currentPostData = data;
    }

    getTypeDisplay(type) {
        const types = {
            'post': 'Post',
            'reel': 'Reel',
            'story': 'Story',
            'igtv': 'IGTV',
            'tv': 'IGTV'
        };
        return types[type] || 'Post';
    }

    formatDuration(seconds) {
        if (!seconds || seconds === 0) return '--';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}s`;
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

    downloadMedia() {
        if (!this.currentPostData) {
            this.showError('No hay datos de post disponibles');
            return;
        }

        const url = this.currentPostData.mediaUrl;
        if (!url) {
            this.showError('No se encontró URL de media');
            return;
        }

        const isVideo = this.currentPostData.isVideo || url.includes('.mp4');
        const extension = isVideo ? 'mp4' : 'jpg';
        const filename = `instagram-${this.currentPostData.contentType}-${Date.now()}.${extension}`;
        
        this.initiateDownload(url, filename);
    }

    downloadStory() {
        this.downloadMedia(); // Same logic for stories
    }

    downloadFormat(format) {
        if (!this.currentPostData) {
            this.showError('No hay datos de post disponibles');
            return;
        }

        let url = this.currentPostData.mediaUrl;
        let extension = format === 'image' ? 'jpg' : 'mp4';
        
        // If requesting image from video, we'd need video-to-image conversion
        // For now, just download the original format
        if (format === 'image' && (this.currentPostData.isVideo || url.includes('.mp4'))) {
            this.showError('Para descargar como imagen, selecciona un post con foto');
            return;
        }

        const filename = `instagram-${this.currentPostData.contentType}-${format}-${Date.now()}.${extension}`;
        this.initiateDownload(url, filename);
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
            background: var(--ig-purple);
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
    new InstagramDownloader();
});

// Add useful utilities
window.InstagramUtils = {
    extractPostId: (url) => {
        const match = url.match(/\/(p|reel|tv)\/([^\/\?]+)/);
        return match ? match[2] : null;
    },

    isValidUrl: (url) => {
        const patterns = [
            /^https?:\/\/(www\.)?instagram\.com\/(p|reel|tv|stories)\/.+/,
            /^https?:\/\/instagram\.com\/(p|reel|tv|stories)\/.+/
        ];
        
        return patterns.some(pattern => pattern.test(url));
    },

    getErrorMessage: (error) => {
        const messages = {
            'Network request failed': 'Error de conexión. Verifica tu internet.',
            'Invalid URL': 'URL no válida. Asegúrate de copiar la URL completa.',
            'Private account': 'Esta cuenta es privada y no se puede acceder al contenido.',
            'Content not found': 'El contenido no se encontró o ha sido eliminado.',
            'Rate limit exceeded': 'Has alcanzado el límite de descargas. Intenta más tarde.',
            'API key required': 'Se requiere clave de API para acceder a este servicio.'
        };
        return messages[error] || 'Error desconocido. Intenta nuevamente.';
    }
};

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        const input = document.getElementById('instagramUrl');
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
    const input = document.getElementById('instagramUrl');
    const text = e.dataTransfer.getData('text');
    if (text && text.includes('instagram.com')) {
        input.value = text;
        input.focus();
    }
});

console.log('📸 Enhanced Instagram Downloader loaded with multiple APIs!');
