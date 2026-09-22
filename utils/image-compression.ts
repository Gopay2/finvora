/**
 * Utilidad para compresión y optimización de imágenes en el cliente (Browser).
 * Diseñado específicamente para dispositivos móviles con cámaras de alta resolución (12MP a 50MP)
 * y conexiones celulares inestables (3G/4G).
 */

export interface CompressionOptions {
  /** Dimensión máxima en píxeles (ancho o alto). Por defecto: 1600px */
  maxDimension?: number;
  /** Calidad de compresión entre 0 y 1. Por defecto: 0.82 */
  quality?: number;
  /** Formato de salida. Por defecto: 'image/webp' */
  outputType?: 'image/webp' | 'image/jpeg';
}

/**
 * Optimiza y comprime un archivo de imagen en el navegador mediante HTML5 Canvas.
 * - Si el archivo es un PDF, se devuelve sin alteraciones.
 * - Si es una imagen (JPG, PNG, WEBP, HEIC si el browser lo decodifica):
 *   la redimensiona proporcionalmente y la comprime a WebP.
 * - Reduce archivos de 4MB-12MB a ~150KB-300KB sin pérdida perceptible de legibilidad.
 */
export async function optimizarImagenParaSubida(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  const {
    maxDimension = 1600,
    quality = 0.82,
    outputType = 'image/webp'
  } = options;

  // Si es un PDF o no es imagen, se devuelve tal cual
  if (file.type === 'application/pdf' || !file.type.startsWith('image/')) {
    return file;
  }

  return new Promise((resolve) => {
    // Si no estamos en entorno de navegador (SSR), retornar original
    if (typeof window === 'undefined') {
      resolve(file);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      try {
        URL.revokeObjectURL(objectUrl);

        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        if (!width || !height) {
          resolve(file);
          return;
        }

        // Redimensionamiento proporcional respetando maxDimension
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }

        // Configuración de renderizado de alta calidad
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Dibujar en canvas con nuevas dimensiones
        ctx.drawImage(img, 0, 0, width, height);

        // Exportar a blob comprimido
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }

            // Sanitizar nombre de archivo y cambiar extensión a .webp
            const baseName = file.name.replace(/\.[^/.]+$/, '');
            const extension = outputType === 'image/webp' ? 'webp' : 'jpg';
            const optimizedFileName = `${baseName}.${extension}`;

            const optimizedFile = new File([blob], optimizedFileName, {
              type: outputType,
              lastModified: Date.now(),
            });

            // Si por alguna razón la compresión resultó más pesada que el original, mantenemos el menor
            if (optimizedFile.size < file.size) {
              resolve(optimizedFile);
            } else {
              resolve(file);
            }
          },
          outputType,
          quality
        );
      } catch (err) {
        console.warn('Error al comprimir imagen en canvas, usando archivo original:', err);
        resolve(file);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      console.warn('No se pudo cargar la imagen para compresión, usando archivo original.');
      resolve(file);
    };

    img.src = objectUrl;
  });
}
