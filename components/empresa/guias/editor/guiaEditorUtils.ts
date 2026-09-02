import { extractYouTubeId } from '../YouTubeEmbed';

// ─── Tipos del Editor ────────────────────────────────────────────────────────
export type MediaSize = 'small' | 'medium' | 'large';
export type MediaAlign = 'left' | 'center' | 'right';

export interface FontSizeOption {
  value: string;
  label: string;
}

// ─── Constantes de Configuración de Tamaños Responsivos ───────────────────────
export const SIZE_STYLES_IMG: Record<MediaSize, { width: string; maxWidth: string; minWidth: string }> = {
  small: { width: '60%', maxWidth: '380px', minWidth: '185px' },
  medium: { width: '85%', maxWidth: '580px', minWidth: '220px' },
  large: { width: '100%', maxWidth: '896px', minWidth: '260px' },
};

export const SIZE_STYLES_YT: Record<MediaSize, { width: string; maxWidth: string; minWidth: string }> = {
  small: { width: '65%', maxWidth: '420px', minWidth: '200px' },
  medium: { width: '85%', maxWidth: '640px', minWidth: '240px' },
  large: { width: '100%', maxWidth: '896px', minWidth: '260px' },
};

export const FONT_SIZE_OPTIONS: FontSizeOption[] = [
  { value: '2', label: '13px - Pequeño' },
  { value: '3', label: '16px - Normal' },
  { value: '4', label: '18px - Mediano' },
  { value: '5', label: '22px - Grande' },
  { value: '6', label: '26px - Título' },
];

/**
 * Genera el HTML de la barra de controles flotante en la multimedia (Solo Tamaños S, M, L y Eliminar)
 */
export function createMediaToolbarHtml(
  type: 'image' | 'youtube',
  currentSize: MediaSize = 'medium'
): string {
  return `
    <div class="media-toolbar absolute top-2 right-2 flex items-center gap-1.5 bg-slate-950/95 border border-slate-700/90 rounded-xl p-1 shadow-2xl backdrop-blur-md z-30 select-none opacity-95 hover:opacity-100 transition-opacity">
      <!-- Tamaños: S, M, L -->
      <button type="button" data-action="size" data-value="small" class="w-7 h-7 flex items-center justify-center text-xs font-bold rounded-lg transition-colors cursor-pointer ${
        currentSize === 'small' ? 'text-secondary bg-slate-800 shadow-xs' : 'text-slate-400 hover:text-white hover:bg-slate-800'
      }" title="Tamaño Pequeño (S)">
        S
      </button>
      <button type="button" data-action="size" data-value="medium" class="w-7 h-7 flex items-center justify-center text-xs font-bold rounded-lg transition-colors cursor-pointer ${
        currentSize === 'medium' ? 'text-secondary bg-slate-800 shadow-xs' : 'text-slate-400 hover:text-white hover:bg-slate-800'
      }" title="Tamaño Mediano (M)">
        M
      </button>
      <button type="button" data-action="size" data-value="large" class="w-7 h-7 flex items-center justify-center text-xs font-bold rounded-lg transition-colors cursor-pointer ${
        currentSize === 'large' ? 'text-secondary bg-slate-800 shadow-xs' : 'text-slate-400 hover:text-white hover:bg-slate-800'
      }" title="Tamaño Grande (L)">
        L
      </button>

      <div class="h-4 w-px bg-slate-700 mx-0.5"></div>

      <!-- Eliminar -->
      <button type="button" data-action="delete" class="w-7 h-7 flex items-center justify-center text-red-400 hover:text-red-300 rounded-lg hover:bg-red-500/20 transition-colors cursor-pointer" title="Eliminar">
        <span class="material-symbols-outlined text-base pointer-events-none">close</span>
      </button>
    </div>
  `;
}

/**
 * Genera el HTML para incrustar un video de YouTube dentro del editor continuo.
 */
export function createYouTubeEmbedHtml(
  url: string,
  ytId: string,
  size: MediaSize = 'medium',
  align: MediaAlign = 'center'
): string {
  const cleanUrl = url.split('#')[0];
  const fullUrl = `${cleanUrl}#size=${size}&align=${align}`;
  const justifyStyle = align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center';
  const sizeConfig = SIZE_STYLES_YT[size];

  return `
    <div data-type="youtube" data-url="${fullUrl}" data-size="${size}" data-align="${align}" style="display: flex; justify-content: ${justifyStyle}; width: 100%; text-align: ${align};" class="my-5 w-full select-none cursor-pointer transition-all" contenteditable="false">
      <div style="width: ${sizeConfig.width}; max-width: ${sizeConfig.maxWidth}; min-width: ${sizeConfig.minWidth};" class="relative rounded-xl border border-slate-800 bg-slate-950 shadow-2xl group/media transition-all">
        ${createMediaToolbarHtml('youtube', size)}
        <div class="relative w-full aspect-video bg-black rounded-xl overflow-hidden flex items-center justify-center">
          <img src="https://img.youtube.com/vi/${ytId}/hqdefault.jpg" alt="Portada de video" class="absolute inset-0 w-full h-full object-cover opacity-80" />
          <div class="absolute inset-0 bg-black/40 flex items-center justify-center">
            <div class="w-14 h-10 md:w-16 md:h-12 bg-red-600 rounded-xl flex items-center justify-center shadow-2xl text-white">
              <span class="material-symbols-outlined text-3xl">play_arrow</span>
            </div>
          </div>
        </div>
      </div>
    </div><p><br></p>
  `;
}

/**
 * Genera el HTML para incrustar una imagen dentro del editor continuo (usa URL local o permanente).
 */
export function createImageEmbedHtml(
  url: string,
  cleanName: string,
  size: MediaSize = 'medium',
  align: MediaAlign = 'center'
): string {
  const cleanUrl = url.split('#')[0];
  const fullUrl = `${cleanUrl}#size=${size}&align=${align}`;
  const justifyStyle = align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center';
  const sizeConfig = SIZE_STYLES_IMG[size];

  return `
    <figure data-type="image" data-url="${fullUrl}" data-size="${size}" data-align="${align}" style="display: flex; justify-content: ${justifyStyle}; width: 100%; text-align: ${align};" class="my-5 w-full select-none cursor-pointer transition-all" contenteditable="false">
      <div style="width: ${sizeConfig.width}; max-width: ${sizeConfig.maxWidth}; min-width: ${sizeConfig.minWidth};" class="relative rounded-xl border border-slate-800 bg-slate-950 shadow-2xl group/media flex items-center justify-center transition-all">
        ${createMediaToolbarHtml('image', size)}
        <img src="${cleanUrl}" alt="${cleanName}" class="w-full h-auto object-contain rounded-xl" />
      </div>
    </figure><p><br></p>
  `;
}

/**
 * Serializa de forma recursiva los nodos HTML del editor continuo a markdown limpio.
 */
export function nodeToMarkdown(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent || '';
  }

  if (node.nodeType === Node.ELEMENT_NODE) {
    const element = node as HTMLElement;
    const tag = element.tagName.toLowerCase();

    // Imagen con tamaño y alineación
    if (tag === 'figure' && element.dataset.type === 'image') {
      const img = element.querySelector('img');
      const size = (element.dataset.size as MediaSize) || 'medium';
      const align = (element.dataset.align as MediaAlign) || 'center';
      if (img && img.src) {
        const cleanSrc = img.src.split('#')[0];
        const fullSrc = `${cleanSrc}#size=${size}&align=${align}`;
        return `\n\n![imagen](${fullSrc})\n\n`;
      }
    }

    // Video YouTube con tamaño y alineación
    if (element.dataset.type === 'youtube' && element.dataset.url) {
      const size = (element.dataset.size as MediaSize) || 'medium';
      const align = (element.dataset.align as MediaAlign) || 'center';
      const cleanUrl = element.dataset.url.split('#')[0];
      return `\n\n${cleanUrl}#size=${size}&align=${align}\n\n`;
    }

    // Recorrer nodos hijos recursivamente
    let innerText = '';
    for (let i = 0; i < element.childNodes.length; i++) {
      innerText += nodeToMarkdown(element.childNodes[i]);
    }

    if (!innerText.trim() && tag !== 'br') {
      return '';
    }

    if (tag === 'b' || tag === 'strong') {
      if (innerText.includes('![') || innerText.includes('#size=') || innerText.includes('\n\n')) {
        return innerText;
      }
      return `**${innerText}**`;
    }
    if (tag === 'i' || tag === 'em') {
      if (innerText.includes('![') || innerText.includes('#size=') || innerText.includes('\n\n')) {
        return innerText;
      }
      return `*${innerText}*`;
    }
    if (tag === 'u') {
      if (innerText.includes('![') || innerText.includes('#size=') || innerText.includes('\n\n')) {
        return innerText;
      }
      return `<u>${innerText}</u>`;
    }
    if (tag === 'font') {
      const size = element.getAttribute('size');
      // Tamaño 3 es texto base normal, no emitir tag
      if (!size || size === '3') {
        return innerText;
      }
      // Si contiene imágenes o bloques multimedia, no envolverlos en bloque
      if (innerText.includes('![') || innerText.includes('#size=') || innerText.includes('\n\n')) {
        return innerText
          .split('\n\n')
          .map((chunk) => {
            const trimmedChunk = chunk.trim();
            if (!trimmedChunk) return '';
            if (trimmedChunk.startsWith('![') || trimmedChunk.includes('#size=') || trimmedChunk.startsWith('<div')) {
              return trimmedChunk;
            }
            return `<font size="${size}">${trimmedChunk}</font>`;
          })
          .filter(Boolean)
          .join('\n\n');
      }
      return `<font size="${size}">${innerText}</font>`;
    }
    if (tag === 'h1' || tag === 'h2' || tag === 'h3') {
      const align = element.style.textAlign || element.getAttribute('align') || '';
      const prefix = tag === 'h1' ? '# ' : tag === 'h2' ? '## ' : '### ';
      if (align === 'center' || align === 'right') {
        return `\n\n<div align="${align}">${prefix}${innerText.trim()}</div>\n\n`;
      }
      return `\n\n${prefix}${innerText.trim()}\n\n`;
    }

    if (tag === 'p' || tag === 'div' || tag === 'center') {
      const align = element.style.textAlign || element.getAttribute('align') || (tag === 'center' ? 'center' : '');
      if (align === 'center' || align === 'right') {
        return `\n\n<div align="${align}">${innerText}</div>\n\n`;
      }
      return `\n\n${innerText}\n\n`;
    }

    return innerText;
  }

  return '';
}

/**
 * Convierte el HTML del editor unificado a markdown estándar para la base de datos.
 */
export function htmlToMarkdown(html: string): string {
  if (typeof window === 'undefined') return html;

  const temp = document.createElement('div');
  temp.innerHTML = html;

  let result = '';
  for (let i = 0; i < temp.childNodes.length; i++) {
    result += nodeToMarkdown(temp.childNodes[i]);
  }

  return result
    .split('\n')
    .map((line) => line.trim())
    .filter((line, i, arr) => line !== '' || (i > 0 && arr[i - 1] !== ''))
    .join('\n');
}

/**
 * Convierte markdown plano a HTML interactivo para el editor unificado.
 */
export function markdownToHtml(markdown: string): string {
  if (!markdown || !markdown.trim()) {
    return '<p>Escribe aquí el contenido de la guía...</p>';
  }

  const lines = markdown.split('\n');
  const htmlParts: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) continue;

    // Imagen: ![alt](url#size=...&align=...)
    const imgMatch = trimmed.match(/^!\[(.*?)\]\((https?:\/\/[^\s\)]+)\)$/);
    if (imgMatch) {
      const rawAlt = imgMatch[1];
      const rawUrl = imgMatch[2];
      const sizeMatch = rawUrl.match(/size=(small|medium|large)/i);
      const alignMatch = rawUrl.match(/align=(left|center|right)/i);
      const size = (sizeMatch ? sizeMatch[1].toLowerCase() : 'medium') as MediaSize;
      const align = (alignMatch ? alignMatch[1].toLowerCase() : 'center') as MediaAlign;

      htmlParts.push(createImageEmbedHtml(rawUrl.split('#')[0], rawAlt || 'imagen', size, align));
      continue;
    }

    // Video YouTube: url#size=...&align=...
    const ytId = extractYouTubeId(trimmed);
    if (ytId && (trimmed.includes('youtube.com') || trimmed.includes('youtu.be'))) {
      const sizeMatch = trimmed.match(/size=(small|medium|large)/i);
      const alignMatch = trimmed.match(/align=(left|center|right)/i);
      const size = (sizeMatch ? sizeMatch[1].toLowerCase() : 'medium') as MediaSize;
      const align = (alignMatch ? alignMatch[1].toLowerCase() : 'center') as MediaAlign;

      htmlParts.push(createYouTubeEmbedHtml(trimmed.split('#')[0], ytId, size, align));
      continue;
    }

    // Bloque alineado: <div align="center|right|left">...</div>
    const alignBlockMatch = trimmed.match(/^<div align="(center|right|left)">([\s\S]*?)<\/div>$/i);
    if (alignBlockMatch) {
      const align = alignBlockMatch[1].toLowerCase();
      let inner = alignBlockMatch[2].trim();
      inner = inner.replace(/\*\*\*([\s\S]+?)\*\*\*/g, '<b><i>$1</i></b>');
      inner = inner.replace(/___([\s\S]+?)___/g, '<b><i>$1</i></b>');
      inner = inner.replace(/\*\*([\s\S]+?)\*\*/g, '<b>$1</b>');
      inner = inner.replace(/__([\s\S]+?)__/g, '<b>$1</b>');
      inner = inner.replace(/\*([^\*\s][^\*]*?)\*/g, '<i>$1</i>');
      inner = inner.replace(/_([^_\s][^_]*?)_/g, '<i>$1</i>');

      htmlParts.push(`<p class="my-2 leading-relaxed text-slate-100" style="text-align: ${align};">${inner}</p>`);
      continue;
    }

    // Conversión de formato inline completo y anidado
    let formattedText = trimmed;
    formattedText = formattedText.replace(/\*\*\*([\s\S]+?)\*\*\*/g, '<b><i>$1</i></b>');
    formattedText = formattedText.replace(/___([\s\S]+?)___/g, '<b><i>$1</i></b>');
    formattedText = formattedText.replace(/\*\*([\s\S]+?)\*\*/g, '<b>$1</b>');
    formattedText = formattedText.replace(/__([\s\S]+?)__/g, '<b>$1</b>');
    formattedText = formattedText.replace(/\*([^\*\s][^\*]*?)\*/g, '<i>$1</i>');
    formattedText = formattedText.replace(/_([^_\s][^_]*?)_/g, '<i>$1</i>');

    htmlParts.push(`<p class="my-2 leading-relaxed text-slate-100">${formattedText}</p>`);
  }

  return htmlParts.join('');
}
