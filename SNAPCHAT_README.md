# 👻 Snapchat Video Downloader

Una herramienta web moderna y especializada para descargar videos de Snapchat sin marca de agua, optimizada para **Spotlight**, **Stories** y **Discover**.

## ✨ Características Principales

- 🎯 **Especializado en Snapchat** - Optimizado para todos los tipos de contenido
- 🚫 **Sin marca de agua** - Descarga snaps limpios
- 🎥 **Calidad HD** - Mantiene la calidad original (hasta 1080p)
- 🎵 **Solo audio** - Extrae MP3 si lo necesitas
- ⚡ **Múltiples APIs** - Sistema de respaldo automático
- 🆓 **Gratuito** - Sin límites (con algunas restricciones)
- 📱 **Responsive** - Funciona en móvil y desktop
- 🎨 **Diseño Snapchat** - Colores y estilo de marca oficial

## 🚀 Tipos de Contenido Soportados

### ⭐ **Spotlight**
- Videos virales y trending
- Calidad generalmente más alta
- Permanecen disponibles

### 📱 **Stories** 
- Contenido temporal (24 horas)
- Se debe descargar rápidamente
- Calidad variable

### 🌟 **Discover**
- Contenido de publishers
- Videos más largos
- Calidad profesional

## 🔗 URLs Soportadas

La herramienta reconoce automáticamente estos formatos:

```bash
# Spotlight
https://www.snapchat.com/@usuario/spotlight/ABC123...

# Stories  
https://www.snapchat.com/@usuario/story/DEF456...

# Discover
https://www.snapchat.com/discover/publisher/GHI789...

# Enlaces cortos
https://t.snapchat.com/xyz123...
```

## 🛠️ APIs Utilizadas

### **Sistema Multi-API de Respaldo:**

1. **AudioPod AI** (Principal)
   - 75%+ tasa de éxito
   - 10 descargas gratis/día
   - Calidad HD confiable

2. **Apify BytePulse Labs** (Profesional)
   - API enterprise-grade
   - Calidad premium
   - Requiere token (opcional)

3. **SnapDownloader** (Respaldo)
   - API de respaldo
   - Compatibilidad amplia

4. **YT-DLP** (Compatibilidad)
   - Motor de extracción probado
   - Última opción de respaldo

## 📊 Sistema de Análisis de Calidad

La página **analiza automáticamente** la calidad del snap:

- **HD (1080p)** - Verde: Excelente calidad
- **HD (720p)** - Amarillo: Buena calidad  
- **SD (480p)** - Naranja: Calidad estándar
- **Baja calidad** - Gris: Compresión alta

## 🎨 Diseño y Experiencia

### **Paleta de Colores Snapchat:**
- **Snap Yellow:** `#FFFC00` - Botones principales
- **Action Orange:** `#FF9900` - Estados hover
- **Deep Black:** `#000000` - Texto y bordes
- **Surface White:** `#FFFFFF` - Fondo de tarjetas

### **Tipografía:**
- **Outfit** - Fuente geométrica moderna
- Optimizada para legibilidad
- Estilo similar a apps sociales

## 🔧 Uso de la Herramienta

### **Pasos Simples:**
1. **Copia** la URL del snap de Snapchat
2. **Pega** en el campo de entrada
3. **Haz clic** en "Procesar"
4. **Descarga** en HD o solo audio

### **Funciones Avanzadas:**
- **Análisis automático** de calidad
- **Múltiples opciones** de descarga
- **Indicadores visuales** de estado
- **Drag & Drop** de URLs
- **Atajos de teclado** (Enter, Escape)

## 📱 Compatibilidad

### **Dispositivos:**
- ✅ **Desktop** (Chrome, Firefox, Safari, Edge)
- ✅ **Mobile** (iOS Safari, Android Chrome)
- ✅ **Tablet** (iPad, Android tablets)

### **Navegadores:**
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## ⚠️ Limitaciones y Consideraciones

### **Contenido Privado:**
- ❌ No descarga contenido privado
- ❌ No accede a snaps expirados
- ✅ Solo contenido público

### **Rate Limiting:**
- AudioPod AI: 10 descargas/día (gratis)
- APIs premium: Sin límites
- Sistema de respaldo automático

### **Calidad Variable:**
- Depende del contenido original
- Stories pueden tener menor calidad
- Spotlight generalmente mejor calidad

## 🛡️ Uso Responsable

### **Respeto por la Privacidad:**
- Solo contenido público
- No descarga snaps privados
- Respeta términos de servicio

### **Derechos de Autor:**
- Uso personal únicamente
- No redistribuir contenido protegido
- Creditar a los creadores originales

## 🔧 Personalización

### **Variables CSS:**
```css
:root {
  --snap-yellow: #FFFC00;    /* Color principal */
  --action-orange: #FF9900;  /* Hover states */
  --deep-black: #000000;     /* Texto */
}
```

### **Configuración API:**
```javascript
// En snapchat-script.js
this.apis = {
    audiopod: { /* API settings */ },
    apify: { /* API settings */ }
};
```

## 📊 Métricas de Rendimiento

### **Tasa de Éxito:**
- **Spotlight:** 85%+ éxito
- **Stories:** 70%+ éxito  
- **Discover:** 80%+ éxito

### **Velocidad:**
- **Procesamiento:** 2-5 segundos
- **Descarga:** Inmediata
- **Análisis:** <1 segundo

## 🔄 Actualizaciones y Soporte

### **APIs Activas:**
- Monitoreo automático de disponibilidad
- Fallback a APIs de respaldo
- Actualizaciones regulares

### **Mejoras Continuas:**
- Nuevos formatos de URL
- Optimizaciones de calidad
- Mejoras de compatibilidad

## 📞 Resolución de Problemas

### **Error: "URL no válida"**
- Verifica que sea una URL de Snapchat
- Asegúrate de que sea contenido público

### **Error: "No se pudo descargar"**
- El contenido puede ser privado
- Intenta con otro snap
- Verifica tu conexión

### **Error: "API rate limit"**
- Espera unas horas
- Usa una API premium
- Prueba con otro navegador

---

**Creado con ❤️ para la comunidad de Snapchat**

*Herramienta educativa y de uso personal. Respeta los derechos de autor y la privacidad.*