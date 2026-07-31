# 📱 Suite de Descargadores de Video y Media

Una colección completa de páginas web para descargar contenido multimedia de las principales plataformas sociales sin marca de agua.

![Vista principal de MediaHub](image.png)

## 🗂️ Estructura del Proyecto

```
/workspace/
├── tiktok-downloader/          # TikTok Downloader
│   ├── index.html
│   ├── script.js
│   └── styles.css
├── snapchat-downloader/        # Snapchat Downloader
│   ├── index.html
│   ├── script.js
│   └── styles.css
├── youtube-downloader/         # YouTube Downloader
│   ├── index.html
│   ├── script.js
│   └── styles.css
├── instagram-downloader/       # Instagram Downloader
│   ├── index.html
│   ├── script.js
│   └── styles.css
├── facebook-downloader/        # Facebook Downloader
│   ├── index.html
│   ├── script.js
│   └── styles.css
├── twitter-downloader/         # X (Twitter) Downloader
│   ├── index.html
│   ├── script.js
│   └── styles.css
└── reddit-downloader/          # Reddit Downloader
    ├── index.html
    ├── script.js
    └── styles.css
```

## 🌟 Características Principales

### ✅ **Características Comunes**
- **Interfaz moderna y responsive** - Se adapta a cualquier dispositivo
- **Descarga sin marca de agua** - Contenido limpio
- **Soporte para múltiples APIs** - Sistema de fallback automático
- **Análisis de calidad** - Información detallada del contenido
- **Validación de URLs** - Verificación automática de enlaces
- **Soporte de arrastrar y soltar** - Fácil uso
- **Atajos de teclado** - Navegación rápida
- **Notificaciones de éxito/error** - Feedback visual

### 🎨 **Diseño por Plataforma**

Cada página utiliza los **colores y estilo visual** específicos de su plataforma:

- **TikTok**: Negro, rosa y blanco
- **Snapchat**: Amarillo y negro 
- **YouTube**: Rojo, negro y blanco
- **Instagram**: Gradientes púrpura/rosa/naranja
- **Facebook**: Azul oficial de la marca
- **X (Twitter)**: Negro, gris y azul
- **Reddit**: Naranja/rojo oficial

## 🚀 **Cómo Usar**

### 1. **Acceder a una Plataforma**
Abre cualquiera de las carpetas y navega a `index.html`

### 2. **Copiar URL**
Ve a la plataforma correspondiente y copia la URL del contenido que deseas descargar

### 3. **Procesar**
- Pega la URL en el campo de entrada
- Haz clic en "Descargar" o presiona Enter
- Espera a que se procese el contenido

### 4. **Descargar**
Selecciona la calidad y formato deseados para la descarga

## 📋 **Plataformas Soportadas**

### 📱 **TikTok** (`tiktok-downloader/`)
- ✅ Videos de TikTok
- ✅ Sin marca de agua
- ✅ Múltiples calidades (HD, SD)
- ✅ Soporte para API de TikTok
- **URLs soportadas**: `tiktok.com/@user/video/ID`

### 👻 **Snapchat** (`snapchat-downloader/`)
- ✅ Spotlight videos
- ✅ Stories públicas
- ✅ Highlights
- ✅ Discover content
- ✅ Audio MP3
- **URLs soportadas**: `snapchat.com/@user/...`

### ▶️ **YouTube** (`youtube-downloader/`)
- ✅ Videos HD/4K
- ✅ Audio MP3/M4A
- ✅ Múltiples calidades
- ✅ Información de video detallada
- ✅ Soporte para playlists
- **URLs soportadas**: `youtube.com`, `youtu.be`

### 📸 **Instagram** (`instagram-downloader/`)
- ✅ Posts de imágenes
- ✅ Videos de posts
- ✅ Reels
- ✅ Stories
- ✅ IGTV
- ✅ Múltiples imágenes (carrusel)
- **URLs soportadas**: `instagram.com/p/...`, `instagram.com/reel/...`

### 📘 **Facebook** (`facebook-downloader/`)
- ✅ Videos públicos
- ✅ Fotos de posts
- ✅ Álbumes de fotos
- ✅ Stories
- ✅ Posts con contenido multimedia
- ✅ Múltiples calidades
- **URLs soportadas**: `facebook.com/.../videos/...`

### 🐦 **X (Twitter)** (`twitter-downloader/`)
- ✅ Videos de tweets
- ✅ GIFs animados
- ✅ Imágenes de tweets
- ✅ Carruseles de imágenes
- ✅ Threads
- ✅ Información de engagement
- **URLs soportadas**: `twitter.com/.../status/...`, `x.com/.../status/...`

### 🤖 **Reddit** (`reddit-downloader/`)
- ✅ Videos de posts
- ✅ Imágenes y galerías
- ✅ GIFs
- ✅ Posts con texto
- ✅ Enlaces externos
- ✅ Información de upvotes y comentarios
- **URLs soportadas**: `reddit.com/r/.../comments/...`, `redd.it/...`

## 🔧 **Funcionalidades Técnicas**

### **APIs Múltiples**
Cada plataforma incluye múltiples APIs de respaldo:
- APIs oficiales cuando están disponibles
- Servicios de terceros confiables
- Sistemas de scraping como fallback
- Selección automática de la mejor calidad

### **Análisis de Calidad**
- **Detección automática** de resolución
- **Análisis de tamaño** de archivo
- **Estimación de calidad** basada en múltiples factores
- **Información detallada** de metadatos

### **Validación y Errores**
- **Validación de URLs** específica por plataforma
- **Mensajes de error** informativos en español
- **Manejo de contenido privado** o eliminado
- **Límites de velocidad** y rate limiting

### **Interfaz Responsive**
- **Diseño mobile-first** para todos los dispositivos
- **Breakpoints** optimizados para tablets y desktop
- **Animaciones suaves** y transiciones
- **Iconografía consistente** con SVG

## ⚡ **Tecnologías Utilizadas**

- **HTML5** - Estructura semántica
- **CSS3** - Estilos modernos con variables CSS y Grid/Flexbox
- **JavaScript ES6+** - Lógica de aplicación
- **Fetch API** - Peticiones HTTP
- **Web APIs** - Clipboard, Drag & Drop, etc.

## 🔒 **Consideraciones de Seguridad**

- **No requiere instalación** - Solo archivos estáticos
- **No guarda datos** - Todo se procesa en el cliente
- **APIs externas** - Algunos servicios pueden requerir claves API
- **Contenido público únicamente** - Respeta la privacidad

## 🚨 **Limitaciones Conocidas**

1. **APIs externas** - Algunos servicios pueden tener limitaciones de rate
2. **Contenido privado** - No se puede acceder a contenido privado
3. **Formatos específicos** - No todos los formatos pueden estar disponibles
4. **Geolocalización** - Algunos servicios pueden estar restringidos por región

## 📝 **Uso Responsable**

- ⚖️ **Respeta los derechos de autor** - Solo descarga contenido para uso personal
- 🔒 **Privacidad** - No descargues contenido privado sin permiso
- 📢 **Attribution** - Considera dar crédito al creador original
- 🚫 **Prohibido uso comercial** - Sin fines comerciales

## 🛠️ **Desarrollo y Personalización**

Cada carpeta es independiente y puede ser:
- **Modificada** según necesidades específicas
- **Desplegada** en cualquier servidor web
- **Integrada** en sistemas existentes
- **Extendida** con nuevas funcionalidades

---

**Versión**: 1.0.0  
**Licencia**: Uso personal y educativo
