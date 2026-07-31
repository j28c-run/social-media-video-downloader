// TikTok Video Downloader - Enhanced JavaScript with Multiple APIs

class TikTokDownloader {
    constructor() {
        this.apis = {
            tikwm: {
                name: "TikWM",
                url: "https://tikwm.com/api/",
                method: "POST",
                format: "form",
                reliable: true
            },
            rawtik: {
                name: "RawTik", 
                url: "https://rawtik.com/api/v2/",
                method: "GET",
                format: "query",
                reliable: true
            },
            musicaldown: {
                name: "MusicalDown",
                url: "https://musicaldown.com/api/",
                method: "POST", 
                format: "form",
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
        const urlInput = document.getElementById('tiktokUrl');
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
        document.getElementById('downloadVideoBtn').addEventListener('click', () => {
            this.downloadVideo(false); // false = no watermark
        });

        document.getElementById('downloadWatermarkedBtn').addEventListener('click', () => {
            this.downloadVideo(true); // true = with watermark
        });

        document.getElementById('downloadAudioBtn').addEventListener('click', () => {
            this.downloadAudio();
        });

        // Quality selection
        document.getElementById('qualitySelect').addEventListener('change', (e) => {
            this.changeQuality(e.target.value);
        });
    }

    async processVideo() {
        const urlInput = document.getElementById('tiktokUrl');
        const processBtn = document.getElementById('processBtn');
        const errorMessage = document.getElementById('errorMessage');
        const resultsSection = document.getElementById('resultsSection');
        
        const url = urlInput.value.trim();
        
        // Reset states
        this.hideError();
        resultsSection.style.display = 'none';
        
        // Validate URL
        if (!this.isValidTikTokUrl(url)) {
            this.showError('Por favor, ingresa una URL válida de TikTok');
            return;
        }

        // Show loading state
        this.setLoadingState(true);
        
        try {
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
            this.showError('Error al procesar el video. Verifica que la URL sea correcta.');
        } finally {
            this.setLoadingState(false);
        }
    }

    isValidTikTokUrl(url) {
        const tiktokPatterns = [
            /^https?:\/\/(www\.)?tiktok\.com\/@.+\/video\/\d+/,
            /^https?:\/\/vm\.tiktok\.com\/.+/,
            /^https?:\/\/vt\.tiktok\.com\/.+/
        ];
        
        return tiktokPatterns.some(pattern => pattern.test(url));
    }

    async fetchWithBestQuality(url) {
        const results = [];
        
        // Try each API in order of reliability
        for (const [apiKey, api] of Object.entries(this.apis)) {
            try {
                console.log(`Trying ${api.name}...`);
                const data = await this.fetchFromAPI(api, url);
                if (data && data.code === 0) {
                    results.push({
                        api: api.name,
                        data: data.data,
                        quality: this.analyzeQuality(data.data)
                    });
                    console.log(`${api.name} succeeded:`, data.data.size, 'bytes');
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

    async fetchFromAPI(api, url) {
        let requestUrl, requestBody;
        
        if (api.format === 'form') {
            requestUrl = api.url;
            requestBody = `url=${encodeURIComponent(url)}`;
        } else if (api.format === 'query') {
            requestUrl = `${api.url}?url=${encodeURIComponent(url)}`;
            requestBody = null;
        }
        
        const options = {
            method: api.method,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        };
        
        if (requestBody) {
            options.body = requestBody;
        }
        
        const response = await fetch(requestUrl, options);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        return await response.json();
    }

    analyzeQuality(data) {
        let score = 0;
        let quality = 'Unknown';
        
        // File size analysis
        if (data.size) {
            // Estimate quality based on file size and duration
            const bytesPerSecond = data.size / data.duration;
            
            if (bytesPerSecond > 100000) { // >100KB/s
                score += 90;
                quality = 'HD (1080p)';
            } else if (bytesPerSecond > 50000) { // >50KB/s  
                score += 70;
                quality = 'HD (720p)';
            } else if (bytesPerSecond > 25000) { // >25KB/s
                score += 50;
                quality = 'SD (576p)';
            } else {
                score += 20;
                quality = 'Low Quality';
            }
        }
        
        return { score, quality, bytesPerSecond: data.size / data.duration };
    }

    showQualityInfo(videoData) {
        const qualityInfo = document.getElementById('qualityInfo');
        const qualityText = document.getElementById('qualityText');
        const sizeText = document.getElementById('sizeText');
        
        const quality = this.analyzeQuality(videoData);
        
        qualityText.textContent = quality.quality;
        sizeText.textContent = this.formatFileSize(videoData.size);
        
        // Update quality indicator color
        const indicator = qualityInfo.querySelector('.quality-indicator');
        if (quality.score >= 80) {
            indicator.style.background = 'var(--success-color)';
        } else if (quality.score >= 60) {
            indicator.style.background = 'var(--primary-cyan)';
        } else {
            indicator.style.background = 'var(--accent-pink)';
        }
    }

    displayVideoData(data) {
        // Update cover image
        const videoCover = document.getElementById('videoCover');
        videoCover.src = data.cover || data.origin_cover;
        videoCover.alt = 'Video cover';

        // Update duration
        const videoDuration = document.getElementById('videoDuration');
        videoDuration.textContent = this.formatDuration(data.duration);

        // Update title
        const videoTitle = document.getElementById('videoTitle');
        videoTitle.textContent = data.title || 'Video sin título';

        // Update author info
        const authorAvatar = document.getElementById('authorAvatar');
        const authorName = document.getElementById('authorName');
        authorAvatar.src = data.author?.avatar || '';
        authorName.textContent = `@${data.author?.unique_id || 'usuario'}`;

        // Update stats
        document.getElementById('playCount').textContent = this.formatNumber(data.play_count);
        document.getElementById('likeCount').textContent = this.formatNumber(data.digg_count);
        document.getElementById('commentCount').textContent = this.formatNumber(data.comment_count);

        // Store data for downloads
        this.currentVideoData = data;
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

    downloadVideo(withWatermark = false) {
        if (!this.currentVideoData) {
            this.showError('No hay datos de video disponibles');
            return;
        }

        const url = withWatermark ? this.currentVideoData.wmplay : this.currentVideoData.play;
        const filename = `tiktok-${this.currentVideoData.id}${withWatermark ? '-watermark' : ''}.mp4`;

        this.initiateDownload(url, filename);
    }

    downloadAudio() {
        if (!this.currentVideoData) {
            this.showError('No hay datos de video disponibles');
            return;
        }

        const url = this.currentVideoData.music;
        const filename = `tiktok-audio-${this.currentVideoData.id}.mp3`;

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
            background: var(--success-color);
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
        // This would be implemented if we had multiple quality URLs
        console.log('Quality changed to:', quality);
        this.showSuccess(`Calidad cambiada a: ${quality}`);
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TikTokDownloader();
});

// Add some useful utilities
window.TikTokUtils = {
    // Function to extract video ID from TikTok URL
    extractVideoId: (url) => {
        const match = url.match(/\/video\/(\d+)/);
        return match ? match[1] : null;
    },

    // Function to validate multiple URL formats
    isValidUrl: (url) => {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    },

    // Function to get user-friendly error messages
    getErrorMessage: (error) => {
        const messages = {
            'Network request failed': 'Error de conexión. Verifica tu internet.',
            'Invalid URL': 'URL no válida. Asegúrate de copiar la URL completa.',
            'Video not found': 'Video no encontrado. Verifica que el enlace sea correcto.',
            'Private video': 'Este video es privado y no se puede descargar.'
        };
        return messages[error] || 'Error desconocido. Intenta nuevamente.';
    }
};

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + V to paste in input
    if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        const input = document.getElementById('tiktokUrl');
        if (document.activeElement === input) {
            // Let the browser handle paste normally
        }
    }
    
    // Escape to clear error
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
    const input = document.getElementById('tiktokUrl');
    const text = e.dataTransfer.getData('text');
    if (text && text.includes('tiktok.com')) {
        input.value = text;
        input.focus();
    }
});

console.log('🎥 Enhanced TikTok Video Downloader loaded with multiple APIs!');