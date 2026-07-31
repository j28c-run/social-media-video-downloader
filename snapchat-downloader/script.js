// Snapchat Video Downloader - Enhanced JavaScript with Multiple APIs

class SnapchatDownloader {
    constructor() {
        this.apis = {
            audiopod: {
                name: "AudioPod AI",
                url: "https://audiopod.ai/api/snapchat",
                method: "POST",
                format: "json",
                reliable: true,
                rateLimit: 10 // 10 downloads per day free
            },
            apify: {
                name: "Apify BytePulse",
                url: "https://api.apify.com/v2/acts/bytepulselabs~snapchat-video-downloader/run-sync-get-dataset-items",
                method: "POST",
                format: "json",
                reliable: true,
                requiresToken: true
            },
            snapdownloader: {
                name: "SnapDownloader",
                url: "https://api.snapdownloader.com/v2/download",
                method: "POST",
                format: "form",
                reliable: false
            },
            ytdlp: {
                name: "YT-DLP",
                url: "https://api.ytdlp.com/snapchat",
                method: "GET",
                format: "query",
                reliable: true
            }
        };
        this.currentSnapData = null;
        this.init();
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        const urlInput = document.getElementById('snapchatUrl');
        const processBtn = document.getElementById('processBtn');
        
        // Enter key support
        urlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.processSnap();
            }
        });

        // Process button
        processBtn.addEventListener('click', () => {
            this.processSnap();
        });

        // Download buttons
        document.getElementById('downloadVideoBtn').addEventListener('click', () => {
            this.downloadVideo('hd');
        });

        document.getElementById('downloadAudioBtn').addEventListener('click', () => {
            this.downloadAudio();
        });

        document.getElementById('downloadLowQualityBtn').addEventListener('click', () => {
            this.downloadVideo('sd');
        });

        // Quality selection (future feature)
        document.getElementById('qualitySelect').addEventListener('change', (e) => {
            this.changeQuality(e.target.value);
        });
    }

    async processSnap() {
        const urlInput = document.getElementById('snapchatUrl');
        const processBtn = document.getElementById('processBtn');
        const errorMessage = document.getElementById('errorMessage');
        const resultsSection = document.getElementById('resultsSection');
        
        const url = urlInput.value.trim();
        
        // Reset states
        this.hideError();
        resultsSection.style.display = 'none';
        
        // Validate URL - Simple and working validation
        if (!this.isValidSnapchatUrl(url)) {
            this.showError('Por favor, ingresa una URL válida de Snapchat (Spotlight, Story, Highlight o Discover)');
            return;
        }

        // Show loading state
        this.setLoadingState(true);
        
        try {
            // Try multiple APIs for best quality
            const snapData = await this.fetchWithBestQuality(url);
            
            if (!snapData) {
                throw new Error('No se pudo obtener el snap de ninguna API');
            }
            
            this.displaySnapData(snapData);
            this.showQualityInfo(snapData);
            resultsSection.style.display = 'block';
            
            // Scroll to results
            resultsSection.scrollIntoView({ behavior: 'smooth' });
            
        } catch (error) {
            console.error('Error processing snap:', error);
            this.showError('Error al procesar el snap. Verifica que la URL sea correcta y el contenido sea público.');
        } finally {
            this.setLoadingState(false);
        }
    }

    // Simple and reliable URL validation
    isValidSnapchatUrl(url) {
        // Basic checks
        if (!url || typeof url !== 'string') {
            return false;
        }
        
        // Must be a Snapchat URL
        if (!url.includes('snapchat.com')) {
            return false;
        }
        
        // Must contain a username (@) or content type
        const hasUser = url.includes('@');
        const hasContentType = url.includes('spotlight') || 
                              url.includes('story') || 
                              url.includes('highlight') || 
                              url.includes('discover');
        
        // Must be a valid URL format
        try {
            new URL(url);
            return hasUser || hasContentType;
        } catch (e) {
            return false;
        }
    }

    detectContentType(url) {
        if (url.includes('/spotlight/')) return 'spotlight';
        if (url.includes('/story/')) return 'story';
        if (url.includes('/highlight/')) return 'highlight';
        if (url.includes('/discover/')) return 'discover';
        if (url.includes('t.snapchat.com/')) return 'shortlink';
        // Check for custom story patterns
        if (/@[a-zA-Z0-9_]+\/[a-zA-Z0-9_-]+/.test(url)) {
            return 'story';
        }
        return 'unknown';
    }

    async fetchWithBestQuality(url) {
        const results = [];
        
        // Determine content type
        const contentType = this.detectContentType(url);
        
        // Try each API in order of reliability
        for (const [apiKey, api] of Object.entries(this.apis)) {
            try {
                console.log(`Trying ${api.name}...`);
                const data = await this.fetchFromAPI(api, url, contentType);
                if (data && this.isValidResponse(data)) {
                    results.push({
                        api: api.name,
                        data: data,
                        quality: this.analyzeQuality(data)
                    });
                    console.log(`${api.name} succeeded:`, data.size || 'No size info', 'bytes');
                }
            } catch (error) {
                console.log(`${api.name} failed:`, error.message);
            }
        }
        
        // Return the best quality result
        if (results.length === 0) {
            return null;
        }
        
        // Sort by quality score (size, resolution info)
        results.sort((a, b) => b.quality.score - a.quality.score);
        
        console.log('Best quality API:', results[0].api, 'Score:', results[0].quality.score);
        return results[0].data;
    }

    async fetchFromAPI(api, url, contentType) {
        let requestOptions = {
            method: api.method,
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        };

        let requestUrl = api.url;

        // Handle different API formats
        if (api.format === 'json') {
            if (apiKey === 'audiopod') {
                requestOptions.body = JSON.stringify({
                    url: url,
                    format: 'mp4',
                    quality: 'hd'
                });
            } else if (apiKey === 'apify') {
                // Apify requires API token (this would need user input in real implementation)
                const apiToken = localStorage.getItem('apify_token');
                if (!apiToken) {
                    throw new Error('Apify token required');
                }
                requestUrl += `?token=${apiToken}`;
                requestOptions.body = JSON.stringify({
                    urls: [{ url: url }],
                    quality: '720',
                    proxy: { useApifyProxy: false }
                });
            }
        } else if (api.format === 'query') {
            requestUrl += `?url=${encodeURIComponent(url)}&format=mp4`;
        } else if (api.format === 'form') {
            requestOptions.headers['Content-Type'] = 'application/x-www-form-urlencoded';
            requestOptions.body = `url=${encodeURIComponent(url)}&format=mp4&quality=hd`;
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
        if (apiName === 'audiopod') {
            return {
                videoUrl: data.download_url,
                thumbnail: data.thumbnail,
                title: data.title || 'Snap Video',
                author: data.author || 'Unknown',
                duration: data.duration || 0,
                size: data.file_size,
                type: data.type || 'spotlight'
            };
        } else if (apiName === 'apify') {
            if (data.items && data.items.length > 0) {
                const item = data.items[0];
                return {
                    videoUrl: item.video_url || item.url,
                    thumbnail: item.thumbnail,
                    title: item.title || 'Snap Video',
                    author: item.creator || 'Unknown',
                    duration: item.duration || 0,
                    size: item.file_size,
                    type: item.content_type || 'spotlight'
                };
            }
        }
        
        // Fallback for unknown formats
        return data;
    }

    isValidResponse(data) {
        return data && (data.videoUrl || data.download_url || data.url);
    }

    analyzeQuality(data) {
        let score = 0;
        let quality = 'Unknown';
        
        // File size analysis
        if (data.size) {
            // Estimate quality based on file size and duration
            const bytesPerSecond = data.size / Math.max(data.duration, 1);
            
            if (bytesPerSecond > 120000) { // >120KB/s
                score += 90;
                quality = 'HD (1080p)';
            } else if (bytesPerSecond > 80000) { // >80KB/s  
                score += 70;
                quality = 'HD (720p)';
            } else if (bytesPerSecond > 40000) { // >40KB/s
                score += 50;
                quality = 'SD (480p)';
            } else {
                score += 20;
                quality = 'Low Quality';
            }
        }
        
        // Content type bonus
        if (data.type === 'spotlight') {
            score += 10; // Spotlight videos are usually higher quality
        }
        
        return { score, quality, bytesPerSecond: data.size / Math.max(data.duration, 1) };
    }

    showQualityInfo(snapData) {
        const qualityInfo = document.getElementById('qualityInfo');
        const qualityText = document.getElementById('qualityText');
        const sizeText = document.getElementById('sizeText');
        
        const quality = this.analyzeQuality(snapData);
        
        qualityText.textContent = quality.quality;
        sizeText.textContent = this.formatFileSize(snapData.size);
        
        // Update quality indicator color
        const indicator = qualityInfo.querySelector('.quality-indicator');
        if (quality.score >= 80) {
            indicator.style.background = 'var(--success-green)';
        } else if (quality.score >= 60) {
            indicator.style.background = 'var(--snap-yellow)';
        } else {
            indicator.style.background = 'var(--action-orange)';
        }
    }

    displaySnapData(data) {
        // Update cover image
        const snapCover = document.getElementById('snapCover');
        snapCover.src = data.thumbnail || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTgwIiBoZWlnaHQ9IjI1MCIgdmlld0JveD0iMCAwIDE4MCAyNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjE4MCIgaGVpZ2h0PSIyNTAiIGZpbGw9IiNGMkY0RjYiLz48L3N2Zz4=';
        snapCover.alt = 'Snap cover';

        // Update duration
        const snapDuration = document.getElementById('snapDuration');
        snapDuration.textContent = this.formatDuration(data.duration);

        // Update type
        const snapType = document.getElementById('snapType');
        snapType.textContent = this.getTypeDisplay(data.type);

        // Update title
        const snapTitle = document.getElementById('snapTitle');
        snapTitle.textContent = data.title || 'Snap Video';

        // Update author info
        const authorAvatar = document.getElementById('authorAvatar');
        const authorName = document.getElementById('authorName');
        authorAvatar.src = data.author_avatar || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIyMCIgZmlsbD0iI0ZGQ0MwMCIvPjx0ZXh0IHg9IjIwIiB5PSIyNSIgZm9udC1mYW1pbHk9Ik91dGZpdCIgZm9udC1zaXplPSIxNCIgZmlsbD0iI0ZGRkZGRiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkE8L3RleHQ+PC9zdmc+';
        authorName.textContent = `@${data.author || 'usuario'}`;

        // Update stats
        document.getElementById('viewCount').textContent = this.formatNumber(data.views || 0);
        document.getElementById('likeCount').textContent = this.formatNumber(data.likes || 0);

        // Store data for downloads
        this.currentSnapData = data;
    }

    getTypeDisplay(type) {
        const types = {
            'spotlight': 'Spotlight',
            'story': 'Story',
            'highlight': 'Highlight',
            'discover': 'Discover',
            'shortlink': 'Snap',
            'unknown': 'Snap'
        };
        return types[type] || 'Snap';
    }

    formatDuration(seconds) {
        if (!seconds) return '--';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
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

    downloadVideo(quality = 'hd') {
        if (!this.currentSnapData) {
            this.showError('No hay datos de snap disponibles');
            return;
        }

        const url = this.currentSnapData.videoUrl || this.currentSnapData.download_url;
        if (!url) {
            this.showError('No se encontró URL de video');
            return;
        }

        const filename = `snapchat-${this.getContentType()}-${Date.now()}.mp4`;

        this.initiateDownload(url, filename);
    }

    downloadAudio() {
        if (!this.currentSnapData) {
            this.showError('No hay datos de snap disponibles');
            return;
        }

        const url = this.currentSnapData.audioUrl || this.currentSnapData.videoUrl;
        if (!url) {
            this.showError('No se encontró URL de audio');
            return;
        }

        const filename = `snapchat-audio-${this.getContentType()}-${Date.now()}.mp3`;

        this.initiateDownload(url, filename);
    }

    getContentType() {
        return this.currentSnapData?.type || 'snap';
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
            background: var(--success-green);
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            font-weight: 500;
            z-index: 1000;
            box-shadow: var(--shadow-card);
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

    changeQuality(quality) {
        console.log('Quality changed to:', quality);
        this.showSuccess(`Calidad cambiada a: ${quality}`);
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SnapchatDownloader();
});

// Add useful utilities
window.SnapchatUtils = {
    extractSnapId: (url) => {
        const match = url.match(/\/(spotlight|story)\/([^\/\?]+)/);
        return match ? match[2] : null;
    },

    isValidUrl: (url) => {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    },

    getErrorMessage: (error) => {
        const messages = {
            'Network request failed': 'Error de conexión. Verifica tu internet.',
            'Invalid URL': 'URL no válida. Asegúrate de copiar la URL completa.',
            'Private content': 'Este contenido es privado y no se puede descargar.',
            'Content expired': 'El contenido ha expirado (Stories expiran en 24 horas).',
            'API rate limit': 'Has alcanzado el límite de descargas. Intenta más tarde.'
        };
        return messages[error] || 'Error desconocido. Intenta nuevamente.';
    }
};

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        const input = document.getElementById('snapchatUrl');
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
    const input = document.getElementById('snapchatUrl');
    const text = e.dataTransfer.getData('text');
    if (text && text.includes('snapchat.com')) {
        input.value = text;
        input.focus();
    }
});

console.log('👻 Enhanced Snapchat Video Downloader loaded with multiple APIs!');