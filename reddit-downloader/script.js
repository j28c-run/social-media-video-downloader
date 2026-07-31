// Reddit Video Downloader - Enhanced JavaScript with Multiple APIs

class RedditDownloader {
    constructor() {
        this.apis = {
            redditapi: {
                name: "Reddit API",
                url: "https://www.reddit.com",
                method: "GET",
                format: "query",
                reliable: true
            },
            redlib: {
                name: "Redlib",
                url: "https://redlib.net",
                method: "GET",
                format: "scraper",
                reliable: true
            },
            rapidapi: {
                name: "RapidAPI Reddit",
                url: "https://reddit-api8.p.rapidapi.com/",
                method: "GET",
                format: "query",
                reliable: true,
                requiresKey: true
            },
            nitter: {
                name: "Nitter Scraper",
                url: "https://nitter.net",
                method: "GET",
                format: "scraper",
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
        const urlInput = document.getElementById('redditUrl');
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

    async processPost() {
        const urlInput = document.getElementById('redditUrl');
        const processBtn = document.getElementById('processBtn');
        const errorMessage = document.getElementById('errorMessage');
        const resultsSection = document.getElementById('resultsSection');
        
        const url = urlInput.value.trim();
        
        // Reset states
        this.hideError();
        resultsSection.style.display = 'none';
        
        // Validate URL
        if (!this.isValidRedditUrl(url)) {
            this.showError('Por favor, ingresa una URL válida de Reddit (post, comentario o perfil)');
            return;
        }

        // Show loading state
        this.setLoadingState(true);
        
        try {
            // Extract post ID
            const postId = this.extractPostId(url);
            if (!postId) {
                throw new Error('No se pudo extraer el ID del post');
            }

            // Try multiple APIs for best quality
            const postData = await this.fetchWithBestQuality(url);
            
            if (!postData) {
                throw new Error('No se pudo obtener el post de ninguna API');
            }
            
            // Add post ID to data
            postData.postId = postId;
            
            this.displayPostData(postData);
            this.showContentInfo(postData);
            this.updateDownloadOptions(postData);
            resultsSection.style.display = 'block';
            
            // Scroll to results
            resultsSection.scrollIntoView({ behavior: 'smooth' });
            
        } catch (error) {
            console.error('Error processing post:', error);
            this.showError('Error al procesar el post. Verifica que la URL sea correcta y el post sea público.');
        } finally {
            this.setLoadingState(false);
        }
    }

    // Extract post ID from Reddit URL
    extractPostId(url) {
        const patterns = [
            /\/comments\/([a-zA-Z0-9]+)/,
            /\/r\/[^\/]+\/comments\/([a-zA-Z0-9]+)/,
            /redd\.it\/([a-zA-Z0-9]+)/
        ];
        
        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match) {
                return match[1];
            }
        }
        return null;
    }

    // Validate Reddit URL
    isValidRedditUrl(url) {
        const patterns = [
            /^https?:\/\/(www\.)?reddit\.com\/r\/.+\/comments\/.+/,
            /^https?:\/\/(www\.)?reddit\.com\/comments\/.+/,
            /^https?:\/\/(www\.)?old\.reddit\.com\/r\/.+\/comments\/.+/,
            /^https?:\/\/redd\.it\/[a-zA-Z0-9]+/
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
                // RapidAPI Reddit
                const apiKey = localStorage.getItem('rapidapi_key');
                if (!apiKey) {
                    throw new Error('RapidAPI key required');
                }
                const postId = this.extractPostId(url);
                requestUrl += `v1/posts/${postId}`;
                requestOptions.headers['X-RapidAPI-Key'] = apiKey;
                requestOptions.headers['X-RapidAPI-Host'] = 'reddit-api8.p.rapidapi.com';
            } else {
                // Direct Reddit API
                const postId = this.extractPostId(url);
                const subreddit = url.match(/\/r\/([^\/]+)\//)?.[1] || '';
                requestUrl += `/r/${subreddit}/comments/${postId}.json`;
            }
        } else if (api.format === 'scraper') {
            // Web scraping approach using Redlib or Nitter
            requestUrl = url.replace('reddit.com', 'redlib.net').replace('www.reddit.com', 'redlib.net');
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
        if (apiName === 'Reddit API' || apiName === 'RapidAPI Reddit') {
            // Handle Reddit JSON API response
            if (Array.isArray(data) && data.length >= 2) {
                const postData = data[0].data.children[0].data;
                
                return {
                    title: postData.title,
                    text: postData.selftext,
                    author: postData.author,
                    subreddit: postData.subreddit,
                    createdAt: new Date(postData.created_utc * 1000).toISOString(),
                    url: postData.url,
                    permalink: postData.permalink,
                    upvotes: postData.ups,
                    numComments: postData.num_comments,
                    isVideo: postData.is_video,
                    media: this.extractMediaFromRedditData(postData),
                    isGallery: postData.is_gallery,
                    postHint: postData.post_hint,
                    externalUrl: postData.url_overridden_by_dest,
                    contentType: this.detectContentType(postData)
                };
            }
        } else if (apiName === 'Redlib') {
            // Redlib returns HTML that would need parsing
            return {
                title: data.title || 'Reddit Post',
                text: data.text || '',
                author: data.author || 'Usuario',
                subreddit: data.subreddit || 'unknown',
                media: data.media || [],
                isVideo: data.is_video || false
            };
        }
        
        // Fallback for unknown formats
        return data;
    }

    extractMediaFromRedditData(postData) {
        const media = [];
        
        // Handle video posts
        if (postData.is_video) {
            media.push({
                type: 'video',
                url: postData.media?.reddit_video?.fallback_url || postData.url,
                thumbnail: postData.thumbnail,
                duration: postData.media?.reddit_video?.duration || 0,
                width: postData.media?.reddit_video?.width,
                height: postData.media?.reddit_video?.height
            });
        }
        
        // Handle image posts
        if (postData.post_hint === 'image') {
            media.push({
                type: 'image',
                url: postData.url,
                width: postData.preview?.images[0]?.source?.width,
                height: postData.preview?.images[0]?.source?.height
            });
        }
        
        // Handle GIF posts
        if (postData.post_hint === 'gif') {
            media.push({
                type: 'gif',
                url: postData.url,
                width: postData.preview?.images[0]?.source?.width,
                height: postData.preview?.images[0]?.source?.height
            });
        }
        
        // Handle gallery posts
        if (postData.is_gallery && postData.media_metadata) {
            Object.values(postData.media_metadata).forEach(item => {
                if (item.status === 'valid') {
                    media.push({
                        type: item.m === 'image' ? 'image' : 'gif',
                        url: item.s.u.replace(/&amp;/g, '&'),
                        width: item.x,
                        height: item.y
                    });
                }
            });
        }
        
        // Handle external links
        if (postData.url_overridden_by_dest && !postData.is_video && postData.post_hint !== 'image' && postData.post_hint !== 'gif') {
            media.push({
                type: 'link',
                url: postData.url_overridden_by_dest,
                display: postData.domain
            });
        }
        
        return media;
    }

    detectContentType(postData) {
        if (postData.is_video) return 'video';
        if (postData.is_gallery) return 'gallery';
        if (postData.post_hint === 'image') return 'image';
        if (postData.post_hint === 'gif') return 'gif';
        if (postData.url_overridden_by_dest && !postData.is_self) return 'link';
        if (postData.is_self) return 'text';
        return 'unknown';
    }

    isValidResponse(data) {
        return data && (data.title || data.media || data.url);
    }

    analyzeQuality(data) {
        let score = 0;
        let quality = 'Unknown';
        
        // Media analysis
        if (data.media && data.media.length > 0) {
            const video = data.media.find(m => m.type === 'video');
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
            } else {
                const image = data.media.find(m => m.type === 'image');
                if (image && image.width && image.height) {
                    const totalPixels = image.width * image.height;
                    if (totalPixels >= 1920 * 1080) {
                        score += 80;
                        quality = 'HD Image';
                    } else if (totalPixels >= 1280 * 720) {
                        score += 60;
                        quality = 'SD Image';
                    } else {
                        score += 40;
                        quality = 'Low Res Image';
                    }
                }
            }
        }
        
        // Engagement bonus
        if (data.upvotes > 1000) {
            score += 10;
        } else if (data.upvotes > 100) {
            score += 5;
        }
        
        // Subreddit bonus
        if (data.subreddit) {
            score += 5; // Valid subreddit posts are more reliable
        }
        
        return { score, quality };
    }

    showContentInfo(postData) {
        const quality = this.analyzeQuality(postData);
        
        document.getElementById('contentType').textContent = this.getTypeDisplay(postData.contentType);
        document.getElementById('contentQuality').textContent = quality.quality;
        
        // Calculate total file size if available
        const totalSize = postData.media?.reduce((sum, m) => sum + (m.fileSize || 0), 0) || 0;
        document.getElementById('fileSize').textContent = this.formatFileSize(totalSize);
        
        // Calculate total duration for videos
        const totalDuration = postData.media?.reduce((sum, m) => sum + (m.duration || 0), 0) || 0;
        document.getElementById('contentDuration').textContent = this.formatDuration(totalDuration);
    }

    updateDownloadOptions(postData) {
        const hasVideo = postData.media?.some(m => m.type === 'video');
        const hasImages = postData.media?.some(m => m.type === 'image');
        const hasGIF = postData.media?.some(m => m.type === 'gif');
        const hasLink = postData.media?.some(m => m.type === 'link');
        const mediaCount = postData.media?.length || 0;
        
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

    displayPostData(data) {
        // Update header info
        document.getElementById('subredditName').textContent = `r/${data.subreddit || 'subreddit'}`;
        document.getElementById('authorName').textContent = `u/${data.author || 'usuario'}`;
        document.getElementById('postDate').textContent = this.formatDate(data.createdAt);
        
        // Update title and flair
        document.getElementById('postTitle').textContent = data.title || 'Reddit Post';
        
        const postFlair = document.getElementById('postFlair');
        if (data.link_flair_text) {
            postFlair.textContent = data.link_flair_text;
            postFlair.style.display = 'inline-block';
        } else {
            postFlair.style.display = 'none';
        }
        
        // Update post content
        const postText = document.getElementById('postText');
        if (data.text) {
            postText.textContent = data.text.length > 300 ? data.text.substring(0, 300) + '...' : data.text;
            postText.style.display = 'block';
        } else {
            postText.style.display = 'none';
        }
        
        // Display media if present
        if (data.media && data.media.length > 0) {
            this.displayMedia(data.media);
        }
        
        // Display external link if present
        if (data.externalUrl && !data.is_video && !data.is_gallery && data.post_hint !== 'image') {
            this.displayExternalLink(data.externalUrl, data.display || data.domain);
        }
        
        // Update stats
        document.getElementById('upvotesCount').textContent = this.formatNumber(data.upvotes || 0);
        document.getElementById('commentsCount').textContent = this.formatNumber(data.numComments || 0);
        
        // Store data for downloads
        this.currentPostData = data;
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
            
            if (item.type === 'video') {
                mediaItem.innerHTML = `
                    <video src="${item.url}" poster="${item.thumbnail}" preload="metadata"></video>
                    <div class="media-type">VIDEO</div>
                `;
            } else if (item.type === 'gif') {
                mediaItem.innerHTML = `
                    <img src="${item.url}" alt="GIF ${index + 1}" loading="lazy">
                    <div class="media-type">GIF</div>
                `;
            } else if (item.type === 'image') {
                mediaItem.innerHTML = `
                    <img src="${item.url}" alt="Image ${index + 1}" loading="lazy">
                    <div class="media-type">FOTO</div>
                `;
            }
            
            mediaGrid.appendChild(mediaItem);
        });
    }

    displayExternalLink(url, display) {
        const externalLinkContainer = document.getElementById('externalLink');
        const externalUrl = document.getElementById('externalUrl');
        const externalLinkText = document.getElementById('externalLinkText');
        
        externalUrl.href = url;
        externalLinkText.textContent = display || url;
        externalLinkContainer.style.display = 'block';
    }

    getTypeDisplay(type) {
        const types = {
            'video': 'Video',
            'image': 'Imagen',
            'gif': 'GIF',
            'gallery': 'Galería',
            'link': 'Enlace',
            'text': 'Texto'
        };
        return types[type] || 'Post';
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
        if (!this.currentPostData || !this.currentPostData.media) {
            this.showError('No hay media disponible para descargar');
            return;
        }

        const media = this.currentPostData.media.filter(m => {
            if (type === 'video') return m.type === 'video';
            if (type === 'gif') return m.type === 'gif';
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
        const filename = `reddit-${type}-${quality}-${Date.now()}.${extension}`;
        
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
    new RedditDownloader();
});

// Add useful utilities
window.RedditUtils = {
    extractPostId: (url) => {
        const patterns = [
            /\/comments\/([a-zA-Z0-9]+)/,
            /\/r\/[^\/]+\/comments\/([a-zA-Z0-9]+)/,
            /redd\.it\/([a-zA-Z0-9]+)/
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
            /^https?:\/\/(www\.)?reddit\.com\/r\/.+\/comments\/.+/,
            /^https?:\/\/(www\.)?reddit\.com\/comments\/.+/,
            /^https?:\/\/(www\.)?old\.reddit\.com\/r\/.+\/comments\/.+/,
            /^https?:\/\/redd\.it\/[a-zA-Z0-9]+/
        ];
        
        return patterns.some(pattern => pattern.test(url));
    },

    getErrorMessage: (error) => {
        const messages = {
            'Network request failed': 'Error de conexión. Verifica tu internet.',
            'Invalid URL': 'URL no válida. Asegúrate de copiar la URL completa.',
            'Private post': 'Este post es privado y no se puede acceder.',
            'Post not found': 'El post no se encontró o ha sido eliminado.',
            'Rate limit exceeded': 'Has alcanzado el límite de descargas. Intenta más tarde.',
            'API key required': 'Se requiere clave de API para acceder a este servicio.',
            'Media not available': 'El media no está disponible para descarga.',
            'Removed post': 'Este post ha sido eliminado por el moderador.'
        };
        return messages[error] || 'Error desconocido. Intenta nuevamente.';
    }
};

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        const input = document.getElementById('redditUrl');
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
    const input = document.getElementById('redditUrl');
    const text = e.dataTransfer.getData('text');
    if (text && (text.includes('reddit.com') || text.includes('redd.it'))) {
        input.value = text;
        input.focus();
    }
});

console.log('🤖 Enhanced Reddit Downloader loaded with multiple APIs!');
