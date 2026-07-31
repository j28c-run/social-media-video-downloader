// YouTube Video Downloader - Enhanced JavaScript with Multiple APIs

class YouTubeDownloader {
    constructor() {
        this.apis = {
            ytdlp: {
                name: "YT-DLP API",
                url: "https://api.ytdlp.com/youtube",
                method: "GET",
                format: "query",
                reliable: true
            },
            youtubeapi: {
                name: "YouTube API",
                url: "https://www.googleapis.com/youtube/v3/videos",
                method: "GET",
                format: "query",
                reliable: true,
                requiresKey: true
            },
            saver: {
                name: "SaveFrom.net",
                url: "https://savefrom.net/api/convert",
                method: "POST",
                format: "json",
                reliable: true
            },
            y2mate: {
                name: "Y2Mate",
                url: "https://api.y2mate.com/convert",
                method: "POST",
                format: "json",
                reliable: false
            }
        };
        this.currentVideoData = null;
        this.init();
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        const urlInput = document.getElementById('youtubeUrl');
        const processBtn = document.getElementById('processBtn');
        
        // Enter key support
        urlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.processVideo();
            }
        });

        // Process button
        processBtn.addEventListener('click', () => {
            this.processVideo();
        });

        // Download buttons
        document.getElementById('download1080p').addEventListener('click', () => {
            this.downloadVideo('1080p');
        });

        document.getElementById('download720p').addEventListener('click', () => {
            this.downloadVideo('720p');
        });

        document.getElementById('download480p').addEventListener('click', () => {
            this.downloadVideo('480p');
        });

        document.getElementById('downloadMP3').addEventListener('click', () => {
            this.downloadAudio('mp3');
        });

        document.getElementById('downloadM4A').addEventListener('click', () => {
            this.downloadAudio('m4a');
        });
    }

    async processVideo() {
        const urlInput = document.getElementById('youtubeUrl');
        const processBtn = document.getElementById('processBtn');
        const errorMessage = document.getElementById('errorMessage');
        const resultsSection = document.getElementById('resultsSection');
        
        const url = urlInput.value.trim();
        
        // Reset states
        this.hideError();
        resultsSection.style.display = 'none';
        
        // Validate URL
        if (!this.isValidYouTubeUrl(url)) {
            this.showError('Por favor, ingresa una URL válida de YouTube (youtube.com, youtu.be, o youtu.be)');
            return;
        }

        // Show loading state
        this.setLoadingState(true);
        
        try {
            // Extract video ID
            const videoId = this.extractVideoId(url);
            if (!videoId) {
                throw new Error('No se pudo extraer el ID del video');
            }

            // Try multiple APIs for best quality
            const videoData = await this.fetchWithBestQuality(url);
            
            if (!videoData) {
                throw new Error('No se pudo obtener el video de ninguna API');
            }
            
            this.displayVideoData(videoData);
            this.showQualityInfo(videoData);
            resultsSection.style.display = 'block';
            
            // Scroll to results
            resultsSection.scrollIntoView({ behavior: 'smooth' });
            
        } catch (error) {
            console.error('Error processing video:', error);
            this.showError('Error al procesar el video. Verifica que la URL sea correcta y el video sea público.');
        } finally {
            this.setLoadingState(false);
        }
    }

    // Extract video ID from YouTube URL
    extractVideoId(url) {
        const patterns = [
            /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
            /youtube\.com\/v\/([^&\n?#]+)/,
            /youtube\.com\/watch\?.*v=([^&\n?#]+)/
        ];
        
        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match) {
                return match[1];
            }
        }
        return null;
    }

    // Validate YouTube URL
    isValidYouTubeUrl(url) {
        const patterns = [
            /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\/.+/,
            /^https?:\/\/m\.youtube\.com\/.+/
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
        
        // Sort by quality score (file size, quality info)
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
            if (apiKey === 'youtubeapi') {
                // YouTube Data API v3 (requires API key)
                const apiKey = localStorage.getItem('youtube_api_key');
                if (!apiKey) {
                    throw new Error('YouTube API key required');
                }
                const videoId = this.extractVideoId(url);
                requestUrl += `?part=snippet,statistics,contentDetails&id=${videoId}&key=${apiKey}`;
            } else {
                const videoId = this.extractVideoId(url);
                requestUrl += `?url=${encodeURIComponent(url)}&format=json`;
            }
        } else if (api.format === 'json') {
            requestOptions.headers['Content-Type'] = 'application/json';
            requestOptions.body = JSON.stringify({
                url: url,
                format: 'mp4',
                quality: 'best'
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
        if (apiName === 'YT-DLP API') {
            return {
                videoUrl: data.video_url || data.url,
                thumbnail: data.thumbnail,
                title: data.title || 'YouTube Video',
                author: data.uploader || data.channel,
                duration: this.parseDuration(data.duration),
                views: data.view_count || 0,
                uploadDate: data.upload_date,
                description: data.description,
                fileSize: data.filesize,
                quality: data.quality || 'Unknown'
            };
        } else if (apiName === 'YouTube API') {
            if (data.items && data.items.length > 0) {
                const item = data.items[0];
                return {
                    videoUrl: `https://www.youtube.com/watch?v=${item.id}`,
                    thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default.url,
                    title: item.snippet.title,
                    author: item.snippet.channelTitle,
                    duration: this.parseDurationFromISO8601(item.contentDetails.duration),
                    views: parseInt(item.statistics.viewCount || 0),
                    uploadDate: item.snippet.publishedAt,
                    description: item.snippet.description,
                    quality: 'Available in multiple formats'
                };
            }
        } else if (apiName === 'SaveFrom.net') {
            return {
                videoUrl: data.url,
                thumbnail: data.thumbnail,
                title: data.title,
                author: data.author,
                duration: data.duration,
                fileSize: data.filesize,
                quality: data.quality
            };
        }
        
        // Fallback for unknown formats
        return data;
    }

    parseDuration(seconds) {
        if (!seconds) return 0;
        return parseInt(seconds);
    }

    parseDurationFromISO8601(duration) {
        // Parse ISO 8601 duration (PT4M13S) to seconds
        const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
        if (!match) return 0;
        
        const hours = parseInt(match[1] || 0);
        const minutes = parseInt(match[2] || 0);
        const seconds = parseInt(match[3] || 0);
        
        return hours * 3600 + minutes * 60 + seconds;
    }

    isValidResponse(data) {
        return data && (data.videoUrl || data.url || data.title);
    }

    analyzeQuality(data) {
        let score = 0;
        let quality = 'Unknown';
        
        // File size analysis
        if (data.fileSize) {
            const mb = data.fileSize / (1024 * 1024);
            if (mb > 100) {
                score += 90;
                quality = 'HD (1080p)';
            } else if (mb > 50) {
                score += 70;
                quality = 'HD (720p)';
            } else if (mb > 20) {
                score += 50;
                quality = 'SD (480p)';
            } else {
                score += 30;
                quality = 'Low Quality';
            }
        }
        
        // Duration bonus (longer videos usually higher quality)
        if (data.duration > 600) { // > 10 minutes
            score += 20;
        }
        
        // Views bonus (popular videos often higher quality)
        if (data.views > 1000000) { // > 1M views
            score += 15;
        } else if (data.views > 100000) { // > 100K views
            score += 10;
        }
        
        return { score, quality };
    }

    showQualityInfo(videoData) {
        const quality = this.analyzeQuality(videoData);
        
        document.getElementById('videoQuality').textContent = quality.quality;
        document.getElementById('fileSize').textContent = this.formatFileSize(videoData.fileSize);
        document.getElementById('videoDurationInfo').textContent = this.formatDuration(videoData.duration);
    }

    displayVideoData(data) {
        // Update thumbnail
        const videoThumbnail = document.getElementById('videoThumbnail');
        videoThumbnail.src = data.thumbnail || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjgwIiBoZWlnaHQ9IjE1OCIgdmlld0JveD0iMCAwIDI4MCAxNTgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjI4MCIgaGVpZ2h0PSIxNTgiIGZpbGw9IiMxODAxODEiLz48dGV4dCB4PSIxNDAiIHk9IjgwIiBmb250LWZhbWlseT0iSW50ZXIiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiNBQUFBQUEiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkNhcGFydHVyYSBkZSB2aWRlbyDigKIgWU9VVE9VVEU8L3RleHQ+PC9zdmc+';
        videoThumbnail.alt = 'Video thumbnail';

        // Update duration
        document.getElementById('videoDuration').textContent = this.formatDuration(data.duration);

        // Update title
        document.getElementById('videoTitle').textContent = data.title || 'YouTube Video';

        // Update meta info
        document.getElementById('channelName').textContent = `@${data.author || 'canal'}`;
        document.getElementById('viewCount').textContent = this.formatNumber(data.views || 0) + ' vistas';
        document.getElementById('uploadDate').textContent = this.formatDate(data.uploadDate);

        // Update description
        const description = document.getElementById('videoDescription');
        description.textContent = data.description ? 
            (data.description.length > 200 ? data.description.substring(0, 200) + '...' : data.description) :
            'Sin descripción disponible';

        // Store data for downloads
        this.currentVideoData = data;
    }

    formatDuration(seconds) {
        if (!seconds) return '--:--';
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
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

    downloadVideo(quality = '720p') {
        if (!this.currentVideoData) {
            this.showError('No hay datos de video disponibles');
            return;
        }

        // In a real implementation, this would call an API to get the specific quality URL
        const url = this.currentVideoData.videoUrl;
        if (!url) {
            this.showError('No se encontró URL de video');
            return;
        }

        const filename = `youtube-${this.sanitizeFilename(this.currentVideoData.title)}-${quality}.mp4`;
        this.initiateDownload(url, filename);
    }

    downloadAudio(format = 'mp3') {
        if (!this.currentVideoData) {
            this.showError('No hay datos de video disponibles');
            return;
        }

        // In a real implementation, this would extract audio from the video
        const url = this.currentVideoData.videoUrl;
        if (!url) {
            this.showError('No se encontró URL de video');
            return;
        }

        const filename = `youtube-audio-${this.sanitizeFilename(this.currentVideoData.title)}.${format}`;
        this.initiateDownload(url, filename);
    }

    sanitizeFilename(filename) {
        return filename.replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-').toLowerCase();
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
    new YouTubeDownloader();
});

// Add useful utilities
window.YouTubeUtils = {
    extractVideoId: (url) => {
        const patterns = [
            /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
            /youtube\.com\/v\/([^&\n?#]+)/,
            /youtube\.com\/watch\?.*v=([^&\n?#]+)/
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
            /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\/.+/,
            /^https?:\/\/m\.youtube\.com\/.+/
        ];
        
        return patterns.some(pattern => pattern.test(url));
    },

    getErrorMessage: (error) => {
        const messages = {
            'Network request failed': 'Error de conexión. Verifica tu internet.',
            'Invalid URL': 'URL no válida. Asegúrate de copiar la URL completa.',
            'Private video': 'Este video es privado y no se puede descargar.',
            'Video unavailable': 'El video no está disponible o ha sido eliminado.',
            'Age restricted': 'Este video tiene restricciones de edad.',
            'API rate limit': 'Has alcanzado el límite de descargas. Intenta más tarde.'
        };
        return messages[error] || 'Error desconocido. Intenta nuevamente.';
    }
};

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        const input = document.getElementById('youtubeUrl');
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
    const input = document.getElementById('youtubeUrl');
    const text = e.dataTransfer.getData('text');
    if (text && (text.includes('youtube.com') || text.includes('youtu.be'))) {
        input.value = text;
        input.focus();
    }
});

console.log('▶️ Enhanced YouTube Video Downloader loaded with multiple APIs!');
