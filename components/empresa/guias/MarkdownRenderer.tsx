'use client';

import React from 'react';
import YouTubeEmbed, { extractYouTubeId } from './YouTubeEmbed';

interface MarkdownRendererProps {
  content: string;
  onImageClick?: (imageUrl: string) => void;
}

type TextAlignment = 'left' | 'center' | 'right';

export default function MarkdownRenderer({ content, onImageClick }: MarkdownRendererProps) {
  if (!content) return null;

  // Parser ligero y robusto para renderizar markdown con diseño nativo Finvora
  const renderFormattedLine = (line: string, index: number) => {
    const trimmed = line.trim();

    // 0. Detección de Video de YouTube en línea independiente con soporte de tamaño y alineación
    const ytId = extractYouTubeId(trimmed);
    if (ytId && (trimmed.includes('youtube.com') || trimmed.includes('youtu.be'))) {
      const sizeMatch = trimmed.match(/size=(small|medium|large)/i);
      const alignMatch = trimmed.match(/align=(left|center|right)/i);

      const size = sizeMatch ? sizeMatch[1].toLowerCase() : 'medium';
      const align: TextAlignment = (alignMatch ? alignMatch[1].toLowerCase() : 'center') as TextAlignment;

      const justifyStyle = align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center';
      const sizeConfig =
        size === 'small'
          ? { width: '65%', maxWidth: '420px', minWidth: '200px' }
          : size === 'large'
          ? { width: '100%', maxWidth: '896px', minWidth: '260px' }
          : { width: '85%', maxWidth: '640px', minWidth: '240px' };

      return (
        <div key={index} className="my-6 w-full" style={{ display: 'flex', justifyContent: justifyStyle, textAlign: align }}>
          <div style={{ width: sizeConfig.width, maxWidth: sizeConfig.maxWidth, minWidth: sizeConfig.minWidth }} className="shadow-2xl rounded-2xl overflow-hidden">
            <YouTubeEmbed url={trimmed} />
          </div>
        </div>
      );
    }

    // 0.1 Detección de Imagen Markdown ![alt](url) en línea independiente con tamaño y alineación
    const imgMatch = trimmed.match(/^!\[(.*?)\]\((https?:\/\/[^\s\)]+)\)$/);
    if (imgMatch) {
      const rawAlt = imgMatch[1];
      const rawUrl = imgMatch[2];

      const sizeMatch = rawUrl.match(/size=(small|medium|large)/i) || rawAlt.match(/size:(small|medium|large)/i);
      const alignMatch = rawUrl.match(/align=(left|center|right)/i) || rawAlt.match(/align:(left|center|right)/i);

      const size = sizeMatch ? sizeMatch[1].toLowerCase() : 'medium';
      const align: TextAlignment = (alignMatch ? alignMatch[1].toLowerCase() : 'center') as TextAlignment;

      const cleanAlt = rawAlt.replace(/\|?size:(small|medium|large)/gi, '').replace(/\|?align:(left|center|right)/gi, '').trim();

      const justifyStyle = align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center';
      const sizeConfig =
        size === 'small'
          ? { width: '60%', maxWidth: '380px', minWidth: '185px' }
          : size === 'large'
          ? { width: '100%', maxWidth: '896px', minWidth: '260px' }
          : { width: '85%', maxWidth: '580px', minWidth: '220px' };

      return (
        <figure key={index} className="my-6 w-full flex flex-col" style={{ display: 'flex', alignItems: justifyStyle, textAlign: align }}>
          <div style={{ width: sizeConfig.width, maxWidth: sizeConfig.maxWidth, minWidth: sizeConfig.minWidth }}>
            <div
              onClick={() => onImageClick?.(rawUrl.split('#')[0])}
              className="group relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-xl cursor-pointer hover:border-secondary/50 transition-all flex items-center justify-center"
            >
              <img
                src={rawUrl.split('#')[0]}
                alt={cleanAlt || 'Imagen explicativa'}
                className="w-full h-auto object-contain group-hover:scale-[1.01] transition-transform duration-300 rounded-2xl"
              />
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white gap-2">
                <span className="p-2 rounded-xl bg-slate-900/80 border border-slate-700 text-xs font-semibold flex items-center gap-1 shadow-lg">
                  <span className="material-symbols-outlined text-base text-secondary">zoom_in</span>
                  <span>Ampliar imagen</span>
                </span>
              </div>
            </div>
          </div>
        </figure>
      );
    }

    // 0.2 Detección de Bloque con Alineación <div align="center|right|left">...</div>
    const divAlignMatch = trimmed.match(/^<div align="(center|right|left)">([\s\S]*?)<\/div>$/i);
    if (divAlignMatch) {
      const align: TextAlignment = divAlignMatch[1].toLowerCase() as TextAlignment;
      const inner = divAlignMatch[2].trim();
      const justifyStyle = align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center';

      // Si dentro hay un título (# , ## , ###)
      if (inner.startsWith('# ')) {
        return (
          <h1 key={index} className="text-2xl md:text-3xl font-extrabold text-white mt-8 mb-4 tracking-tight flex items-center gap-2 border-b border-slate-800 pb-3" style={{ justifyContent: justifyStyle, textAlign: align }}>
            {formatInlineText(inner.replace(/^#\s+/, ''))}
          </h1>
        );
      }
      if (inner.startsWith('## ')) {
        return (
          <h2 key={index} className="text-xl md:text-2xl font-bold text-slate-100 mt-6 mb-3 tracking-tight flex items-center gap-2" style={{ justifyContent: justifyStyle, textAlign: align }}>
            {formatInlineText(inner.replace(/^##\s+/, ''))}
          </h2>
        );
      }
      if (inner.startsWith('### ')) {
        return (
          <h3 key={index} className="text-lg md:text-xl font-semibold text-secondary mt-5 mb-2 flex items-center gap-2" style={{ justifyContent: justifyStyle, textAlign: align }}>
            {formatInlineText(inner.replace(/^###\s+/, ''))}
          </h3>
        );
      }

      return (
        <div key={index} className="text-sm md:text-base text-slate-300 leading-relaxed my-2 w-full" style={{ textAlign: align }}>
          {formatInlineText(inner)}
        </div>
      );
    }

    // 0.3 Detección de etiqueta <center>...</center>
    const centerMatch = trimmed.match(/^<center>([\s\S]*?)<\/center>$/i);
    if (centerMatch) {
      const inner = centerMatch[1].trim();
      return (
        <div key={index} className="text-sm md:text-base text-slate-300 leading-relaxed my-2 w-full text-center" style={{ textAlign: 'center' }}>
          {formatInlineText(inner)}
        </div>
      );
    }

    // 1. Título H1 (# )
    if (trimmed.startsWith('# ')) {
      return (
        <h1 key={index} className="text-2xl md:text-3xl font-extrabold text-white mt-8 mb-4 tracking-tight flex items-center gap-2 border-b border-slate-800 pb-3">
          <span className="w-2 h-7 bg-secondary rounded-full inline-block shrink-0" />
          {formatInlineText(trimmed.replace(/^#\s+/, ''))}
        </h1>
      );
    }

    // 2. Título H2 (## )
    if (trimmed.startsWith('## ')) {
      return (
        <h2 key={index} className="text-xl md:text-2xl font-bold text-slate-100 mt-6 mb-3 tracking-tight flex items-center gap-2">
          <span className="material-symbols-outlined text-secondary text-xl">label_important</span>
          {formatInlineText(trimmed.replace(/^##\s+/, ''))}
        </h2>
      );
    }

    // 3. Título H3 (### )
    if (trimmed.startsWith('### ')) {
      return (
        <h3 key={index} className="text-lg md:text-xl font-semibold text-secondary mt-5 mb-2 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-secondary shrink-0" />
          {formatInlineText(trimmed.replace(/^###\s+/, ''))}
        </h3>
      );
    }

    // 4. Lista numerada (1. , 2. )
    const numberedMatch = trimmed.match(/^(\d+)\.\s+(.+)$/);
    if (numberedMatch) {
      const number = numberedMatch[1];
      const text = numberedMatch[2];
      return (
        <div key={index} className="flex items-start gap-3 my-2 pl-1">
          <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-slate-900 border border-slate-700 text-secondary text-xs font-bold shrink-0 mt-0.5 shadow-inner">
            {number}
          </span>
          <span className="text-sm md:text-base text-slate-300 leading-relaxed">
            {formatInlineText(text)}
          </span>
        </div>
      );
    }

    // 5. Lista con viñeta (- o *)
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const text = trimmed.replace(/^[-*]\s+/, '');
      return (
        <div key={index} className="flex items-start gap-3 my-2 pl-2">
          <span className="w-2 h-2 rounded-full bg-secondary/80 shrink-0 mt-2" />
          <span className="text-sm md:text-base text-slate-300 leading-relaxed">
            {formatInlineText(text)}
          </span>
        </div>
      );
    }

    // 6. Cita / Blockquote (> )
    if (trimmed.startsWith('> ')) {
      const text = trimmed.replace(/^>\s+/, '');
      return (
        <blockquote key={index} className="my-4 pl-4 border-l-4 border-slate-700 italic text-slate-400 text-sm md:text-base bg-slate-900/30 py-2 rounded-r-xl">
          {formatInlineText(text)}
        </blockquote>
      );
    }

    // 7. Divisor horizontal (--- o ***)
    if (/^[-*_]{3,}$/.test(trimmed)) {
      return <hr key={index} className="my-6 border-slate-800" />;
    }

    // 8. Línea vacía o etiquetas huérfanas (<font size="..."> o </font>)
    if (!trimmed || /^<font\s+[^>]*>$/i.test(trimmed) || /^<\/font>$/i.test(trimmed)) {
      return null;
    }

    // 9. Párrafo normal
    return (
      <p key={index} className="text-sm md:text-base text-slate-300 leading-relaxed my-2">
        {formatInlineText(line)}
      </p>
    );
  };

  /**
   * Procesa formato en línea: **negrita**, *cursiva*, <u>subrayado</u>, <font size="...">, `código` y [enlaces](url) de forma recursiva.
   */
  const formatInlineText = (text: string): React.ReactNode => {
    if (!text) return null;

    // Limpiar etiquetas huérfanas o tamaño 3 estándar redundante
    const cleanedText = text
      .replace(/^<font\s+[^>]*>$/gi, '')
      .replace(/^<\/font>$/gi, '')
      .replace(/<font size="3">([\s\S]*?)<\/font>/gi, '$1');

    const tokenRegex = /(<font size="(?:\d+)">[\s\S]*?<\/font>|<u>[\s\S]*?<\/u>|\[[\s\S]*?\]\([\s\S]*?\)|\*\*\*[\s\S]*?\*\*\*|___[\s\S]*?___|\*\*[\s\S]*?\*\*|__[\s\S]*?__|\*[\s\S]*?\*|_[\s\S]*?_|`[\s\S]*?`)/g;
    const parts = cleanedText.split(tokenRegex);

    if (parts.length === 1) {
      return cleanedText;
    }

    return parts.map((part, i) => {
      if (!part) return null;

      // Subrayado <u>texto</u>
      const uMatch = part.match(/^<u>([\s\S]*?)<\/u>$/);
      if (uMatch) {
        return (
          <u key={i} className="underline underline-offset-4 decoration-secondary/60">
            {formatInlineText(uMatch[1])}
          </u>
        );
      }

      // Tamaño de fuente <font size="X">texto</font>
      const fontMatch = part.match(/^<font size="(\d+)">([\s\S]*?)<\/font>$/);
      if (fontMatch) {
        const sizeVal = fontMatch[1];
        const inner = fontMatch[2];
        const sizeClass =
          sizeVal === '2'
            ? 'text-xs text-slate-400'
            : sizeVal === '4'
            ? 'text-lg text-slate-100 font-medium'
            : sizeVal === '5'
            ? 'text-xl text-white font-semibold'
            : sizeVal === '6'
            ? 'text-2xl text-white font-bold'
            : 'text-sm md:text-base text-slate-300';
        return (
          <span key={i} className={sizeClass}>
            {formatInlineText(inner)}
          </span>
        );
      }

      // Enlace [texto](url)
      const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/);
      if (linkMatch) {
        return (
          <a
            key={i}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-secondary underline underline-offset-4 hover:text-white transition-colors inline-flex items-center gap-0.5 font-medium"
          >
            {linkMatch[1]}
            <span className="material-symbols-outlined text-xs inline">arrow_outward</span>
          </a>
        );
      }

      // Negrita + Cursiva combinadas ***texto*** o ___texto___
      const boldItalicMatch = part.match(/^(\*\*\*|___)([\s\S]+?)(\*\*\*|___)$/);
      if (boldItalicMatch) {
        return (
          <strong key={i} className="font-bold text-white">
            <em className="italic text-slate-100">
              {formatInlineText(boldItalicMatch[2])}
            </em>
          </strong>
        );
      }

      // Negrita **texto** o __texto__
      const boldMatch = part.match(/^(\*\*|__)([\s\S]+?)(\*\*|__)$/);
      if (boldMatch) {
        return (
          <strong key={i} className="font-bold text-white">
            {formatInlineText(boldMatch[2])}
          </strong>
        );
      }

      // Cursiva *texto* o _texto_
      const italicMatch = part.match(/^(\*|_)([\s\S]+?)(\*|_)$/);
      if (italicMatch) {
        return (
          <em key={i} className="italic text-slate-200">
            {formatInlineText(italicMatch[2])}
          </em>
        );
      }

      // Código en línea `codigo`
      const codeMatch = part.match(/^`([\s\S]+?)`$/);
      if (codeMatch) {
        return (
          <code key={i} className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-secondary text-xs md:text-sm font-mono">
            {codeMatch[1]}
          </code>
        );
      }

      return <span key={i}>{part}</span>;
    });
  };

  const lines = content.split('\n');

  return (
    <div className="space-y-1 font-[family-name:var(--font-roboto)]">
      {lines.map((line, idx) => renderFormattedLine(line, idx))}
    </div>
  );
}
