// X (Twitter) Video Downloader - Enhanced JavaScript with Multiple APIs

class TwitterDownloader {
    constructor() {
        this.apis = {
            twitdown: {
                name: "TwitDown API",
                url: "https://twitdown.com/api/",
                method: "POST",
                format: "json",
                reliable: true
            },
            rapidapi: {
                name: "RapidAPI Twitter",
                url: "https://twitter-api-v2.p.rapidapi.com/tweets/",
                method: "GET",
                format: "query",
                reliable: true,
                requiresKey: true
            },
            nitter: {
                name: "Nitter Scraper",
                url: "https://nitter.net/",
                method: "GET",
                format: "scraper",
                reliable: false
            },
            tweetdownload: {
                name: "TweetDownload",
                url: "https://tweetdownload.net/api/",
                method: "POST",
                format: "json",
                reliable: false
            }
        };
        this.currentTweetData = null;
        this.selectedQuality = 'source';
        this.init();
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        const urlInput = document.getElementById('twitterUrl');
        const processBtn = document.getElementById('processBtn');
        
        // Enter key support
        urlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.processTweet();
            }
        });

        // Process button
        processBtn.addEventListener('click', () => {
            this.processTweet();
        });

        // Download buttons
        document.getElementById('downloadVideo').addEventListener('click', () => {
            this.downloadMedia('video');
        });

        document.getElementById('downloadImages').addEventListener('click', () => {
            this.downloadMedia('image');
        });

        document.getElementById('downloadGIF').addEventListener('click', () => {
            this.downloadMedia('gif');
        });

        // Quality buttons
        document.querySelectorAll('.quality-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.selectQuality(e.target.closest('.quality-btn'));
            });
        });
    }

    async processTweet() {
        const urlInput = document.getElementById('twitterUrl');
        const processBtn = document.getElementById('processBtn');
        const errorMessage = document.getElementById('errorMessage');
        const resultsSection = document.getElementById('resultsSection');
        
        const url = urlInput.value.trim();
        
        // Reset states
        this.hideError();
        resultsSection.style.display = 'none';
        
        // Validate URL
        if (!this.isValidTwitterUrl(url)) {
            this.showError('Por favor, ingresa una URL válida de X/Twitter (tweet, thread o perfil)');
            return;
        }

        // Show loading state
        this.setLoadingState(true);
        
        try {
            // Extract tweet ID
            const tweetId = this.extractTweetId(url);
            if (!tweetId) {
                throw new Error('No se pudo extraer el ID del tweet');
            }

            // Try multiple APIs for best quality
            const tweetData = await this.fetchWithBestQuality(url);
            
            if (!tweetData) {
                throw new Error('No se pudo obtener el tweet de ninguna API');
            }
            
            // Add tweet ID to data
            tweetData.tweetId = tweetId;
            
            this.displayTweetData(tweetData);
            this.showContentInfo(tweetData);
            this.updateDownloadOptions(tweetData);
            resultsSection.style.display = 'block';
            
            // Scroll to results
            resultsSection.scrollIntoView({ behavior: 'smooth' });
            
        } catch (error) {
            console.error('Error processing tweet:', error);
            this.showError('Error al procesar el tweet. Verifica que la URL sea correcta y el tweet sea público.');
        } finally {
            this.setLoadingState(false);
        }
    }

    // Extract tweet ID from Twitter URL
    extractTweetId(url) {
        const patterns = [
            /\/status\/(\d+)/,
            /\/i\/status\/(\d+)/,
            /\/status\/(\d+)\//
        ];
        
        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match) {
                return match[1];
            }
        }
        return null;
    }

    // Validate Twitter URL
    isValidTwitterUrl(url) {
        const patterns = [
            /^https?:\/\/(twitter\.com|x\.com|nitter\.net)\/.+\/status\/\d+/,
            /^https?:\/\/(twitter\.com|x\.com)\/i\/status\/\d+/
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
                // RapidAPI Twitter v2
                const apiKey = localStorage.getItem('rapidapi_key');
                if (!apiKey) {
                    throw new Error('RapidAPI key required');
                }
                const tweetId = this.extractTweetId(url);
                requestUrl += `${tweetId}?tweet.fields=public_metrics,created_at,attachments&expansions=author_id&user.fields=name,username,profile_image_url,verified`;
                requestOptions.headers['Authorization'] = `Bearer ${apiKey}`;
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
            // Web scraping approach using Nitter
            const tweetId = this.extractTweetId(url);
            const username = url.match(/\/(?:twitter|x)\.com\/([^/]+)\//)?.[1] || '';
            requestUrl = `https://nitter.net/${username}/status/${tweetId}`;
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
        if (apiName === 'RapidAPI Twitter') {
            return {
                text: data.data?.text || data.text || 'Tweet sin texto',
                author: {
                    name: data.includes?.users?.[0]?.name || data.user_name || 'Usuario',
                    username: data.includes?.users?.[0]?.username || data.username || 'usuario',
                    avatar: data.includes?.users?.[0]?.profile_image_url || data.user_avatar,
                    verified: data.includes?.users?.[0]?.verified || false
                },
                createdAt: data.data?.created_at || data.created_at,
                publicMetrics: {
                    likeCount: data.data?.public_metrics?.like_count || data.likes || 0,
                    retweetCount: data.data?.public_metrics?.retweet_count || data.retweets || 0,
                    replyCount: data.data?.public_metrics?.reply_count || data.replies || 0,
                    viewCount: data.data?.public_metrics?.impression_count || data.views || 0
                },
                media: this.extractMediaFromTwitterData(data),
                isVideo: this.hasVideo(data),
                contentType: this.detectContentType(data)
            };
        } else if (apiName === 'TwitDown API') {
            return {
                text: data.title || 'Tweet content',
                author: {
                    name: data.author || 'Usuario',
                    username: data.username || 'usuario',
                    avatar: data.author_avatar,
                    verified: data.verified || false
                },
                createdAt: data.created_at,
                media: data.media || [],
                isVideo: data.is_video || false,
                fileSize: data.file_size,
                duration: data.video_duration || 0
            };
        } else if (apiName === 'Nitter Scraper') {
            // Parsed HTML data would go here
            return {
                text: data.text || 'Tweet content',
                author: data.author || {},
                createdAt: data.created_at,
                media: data.media || [],
                isVideo: data.is_video || false
            };
        } else if (apiName === 'TweetDownload') {
            return {
                text: data.title || 'Tweet content',
                author: data.author || 'Usuario',
                media: data.download_urls || [],
                isVideo: data.is_video || false,
                fileSize: data.file_size
            };
        }
        
        // Fallback for unknown formats
        return data;
    }

    extractMediaFromTwitterData(data) {
        const media = [];
        
        if (data.includes?.media) {
            data.includes.media.forEach(item => {
                if (item.type === 'photo') {
                    media.push({
                        type: 'image',
                        url: item.url,
                        width: item.width,
                        height: item.height
                    });
                } else if (item.type === 'video' || item.type === 'animated_gif') {
                    media.push({
                        type: item.type,
                        url: item.variants?.[0]?.url,
                        thumbnail: item.preview_image_url,
                        width: item.width,
                        height: item.height,
                        duration: item.duration_ms ? Math.round(item.duration_ms / 1000) : 0
                    });
                }
            });
        }
        
        return media;
    }

    hasVideo(data) {
        if (data.includes?.media) {
            return data.includes.media.some(item => 
                item.type === 'video' || item.type === 'animated_gif'
            );
        }
        return false;
    }

    detectContentType(data) {
        if (this.hasVideo(data)) return 'video';
        if (data.includes?.media && data.includes.media.length > 1) return 'carousel';
        if (data.includes?.media && data.includes.media.length === 1) return 'single';
        return 'text';
    }

    isValidResponse(data) {
        return data && (data.text || data.media || data.download_urls);
    }

    analyzeQuality(data) {
        let score = 0;
        let quality = 'Unknown';
        
        // Media analysis
        if (data.media && data.media.length > 0) {
            const video = data.media.find(m => m.type === 'video' || m.type === 'animated_gif');
            if (video) {
                if (video.width >= 1920 || video.height >= 1080) {
                    score += 90;
                    quality = 'HD (1080p)';
                } else if (video.width >= 1280 || video.height >= 720) {
                    score += 70;
                    quality = 'HD (720p)';
                } else if (video.width >= 854 || video.height >= 480) {
                    score += 50;
                    quality = 'SD (480p)';
                } else {
                    score += 30;
                    quality = 'Low Quality';
                }
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
        
        // Engagement bonus
        if (data.publicMetrics?.likeCount > 1000) {
            score += 10;
        } else if (data.publicMetrics?.likeCount > 100) {
            score += 5;
        }
        
        return { score, quality };
    }

    showContentInfo(tweetData) {
        const quality = this.analyzeQuality(tweetData);
        
        document.getElementById('contentType').textContent = this.getTypeDisplay(tweetData.contentType);
        document.getElementById('contentQuality').textContent = quality.quality;
        document.getElementById('fileSize').textContent = this.formatFileSize(tweetData.fileSize);
        
        // Calculate total duration for videos
        const totalDuration = tweetData.media?.reduce((sum, m) => sum + (m.duration || 0), 0) || 0;
        document.getElementById('contentDuration').textContent = this.formatDuration(totalDuration);
    }

    updateDownloadOptions(tweetData) {
        const hasVideo = tweetData.media?.some(m => m.type === 'video');
        const hasImages = tweetData.media?.some(m => m.type === 'image');
        const hasGIF = tweetData.media?.some(m => m.type === 'animated_gif');
        const mediaCount = tweetData.media?.length || 0;
        
        // Update download buttons
        const downloadVideoBtn = document.getElementById('downloadVideo');
        const downloadImagesBtn = document.getElementById('downloadImages');
        const downloadGIFBtn = document.getElementById('downloadGIF');
        const qualityButtons = document.getElementById('qualityButtons');
        
        downloadVideoBtn.style.display = hasVideo ? 'flex' : 'none';
        downloadGIFBtn.style.display = hasGIF ? 'flex' : 'none';
        downloadImagesBtn.style.display = hasImages ? 'flex' : 'none';
        qualityButtons.style.display = (hasVideo || hasGIF) ? 'flex' : 'none';
    }

    displayTweetData(data) {
        // Update author info
        const authorAvatar = document.getElementById('authorAvatar');
        authorAvatar.src = data.author?.avatar || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyNCIgY3k9IjI0IiByPSIyNCIgZmlsbD0iI0VGQUMzRjQiLz48dGV4dCB4PSIyNCIgeT0iMzIiIGZvbnQtZmFtaWx5PSJJbnRlciIgZm9udC1zaXplPSIxNiIgZmlsbD0iIzVCRDQwNCIgdGV4dC1hbmNob3I9Im1pZGRsZSI+WDwvdGV4dD48L3N2Zz4=';
        
        document.getElementById('authorName').textContent = data.author?.name || 'Usuario';
        document.getElementById('authorHandle').textContent = `@${data.author?.username || 'usuario'}`;
        
        // Update verified badge
        const verifiedBadge = document.getElementById('verifiedBadge');
        verifiedBadge.style.display = data.author?.verified ? 'flex' : 'none';
        
        // Update date
        document.getElementById('tweetDate').textContent = this.formatDate(data.createdAt);
        
        // Update tweet text
        document.getElementById('tweetText').textContent = data.text || 'Tweet sin texto';
        
        // Update stats
        document.getElementById('likesCount').textContent = this.formatNumber(data.publicMetrics?.likeCount || 0);
        document.getElementById('retweetsCount').textContent = this.formatNumber(data.publicMetrics?.retweetCount || 0);
        document.getElementById('repliesCount').textContent = this.formatNumber(data.publicMetrics?.replyCount || 0);
        document.getElementById('viewsCount').textContent = this.formatNumber(data.publicMetrics?.viewCount || 0);
        
        // Display media if present
        if (data.media && data.media.length > 0) {
            this.displayMedia(data.media);
        }
        
        // Store data for downloads
        this.currentTweetData = data;
    }

    displayMedia(media) {
        const mediaContainer = document.getElementById('mediaContainer');
        const mediaGrid = document.getElementById('mediaGrid');
        
        mediaContainer.style.display = 'block';
        mediaGrid.innerHTML = '';
        
        // Set grid layout based on number of media items
        if (media.length === 1) {
            mediaGrid.className = 'media-grid single';
        } else if (media.length === 2) {
            mediaGrid.className = 'media-grid double';
        } else {
            mediaGrid.className = 'media-grid triple';
        }
        
        media.forEach((item, index) => {
            const mediaItem = document.createElement('div');
            mediaItem.className = 'media-item';
            
            if (item.type === 'video' || item.type === 'animated_gif') {
                mediaItem.innerHTML = `
                    <video src="${item.url}" poster="${item.thumbnail}" preload="metadata"></video>
                    <div class="media-type">${item.type === 'video' ? 'VIDEO' : 'GIF'}</div>
                `;
            } else {
                mediaItem.innerHTML = `
                    <img src="${item.url}" alt="Media ${index + 1}" loading="lazy">
                    <div class="media-type">FOTO</div>
                `;
            }
            
            mediaGrid.appendChild(mediaItem);
        });
    }

    getTypeDisplay(type) {
        const types = {
            'video': 'Video',
            'image': 'Foto',
            'animated_gif': 'GIF',
            'carousel': 'Carrusel',
            'single': 'Single',
            'text': 'Texto'
        };
        return types[type] || 'Tweet';
    }

    formatDuration(seconds) {
        if (!seconds || seconds === 0) return '--';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
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
                month: 'short',
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
        if (!this.currentTweetData || !this.currentTweetData.media) {
            this.showError('No hay media disponible para descargar');
            return;
        }

        const media = this.currentTweetData.media.filter(m => {
            if (type === 'video') return m.type === 'video';
            if (type === 'gif') return m.type === 'animated_gif';
            if (type === 'image') return m.type === 'image';
            return false;
        });

        if (media.length === 0) {
            this.showError(`No se encontró media de tipo ${type}`);
            return;
        }

        // Download first media item for simplicity
        // In a real implementation, you might want to download all items
        const item = media[0];
        const extension = type === 'image' ? 'jpg' : (type === 'gif' ? 'gif' : 'mp4');
        const quality = this.selectedQuality === 'source' ? 'original' : this.selectedQuality;
        const filename = `twitter-${type}-${quality}-${Date.now()}.${extension}`;
        
        this.initiateDownload(item.url, filename);
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
    new TwitterDownloader();
});

// Add useful utilities
window.TwitterUtils = {
    extractTweetId: (url) => {
        const patterns = [
            /\/status\/(\d+)/,
            /\/i\/status\/(\d+)/,
            /\/status\/(\d+)\//
        ];
        
        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match) {
                return match[1];
            }
        }
        return null;
    },

    isValidUrl: (url) => {
        const patterns = [
            /^https?:\/\/(twitter\.com|x\.com|nitter\.net)\/.+\/status\/\d+/,
            /^https?:\/\/(twitter\.com|x\.com)\/i\/status\/\d+/
        ];
        
        return patterns.some(pattern => pattern.test(url));
    },

    getErrorMessage: (error) => {
        const messages = {
            'Network request failed': 'Error de conexión. Verifica tu internet.',
            'Invalid URL': 'URL no válida. Asegúrate de copiar la URL completa.',
            'Protected tweet': 'Este tweet está protegido y no se puede acceder.',
            'Tweet not found': 'El tweet no se encontró o ha sido eliminado.',
            'Rate limit exceeded': 'Has alcanzado el límite de descargas. Intenta más tarde.',
            'API key required': 'Se requiere clave de API para acceder a este servicio.',
            'Media not available': 'El media no está disponible para descarga.'
        };
        return messages[error] || 'Error desconocido. Intenta nuevamente.';
    }
};

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        const input = document.getElementById('twitterUrl');
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
    const input = document.getElementById('twitterUrl');
    const text = e.dataTransfer.getData('text');
    if (text && (text.includes('twitter.com') || text.includes('x.com') || text.includes('nitter.net'))) {
        input.value = text;
        input.focus();
    }
});

console.log('🐦 Enhanced X (Twitter) Downloader loaded with multiple APIs!');
