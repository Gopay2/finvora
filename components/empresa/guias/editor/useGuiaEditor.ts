'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { subirImagenGuiaAction } from '@/app/empresa/webapp/guias/actions';
import { extractYouTubeId } from '../YouTubeEmbed';
import {
  MediaSize,
  MediaAlign,
  SIZE_STYLES_IMG,
  SIZE_STYLES_YT,
  createImageEmbedHtml,
  createYouTubeEmbedHtml,
  htmlToMarkdown,
  markdownToHtml,
} from './guiaEditorUtils';

/**
 * Custom Hook para gestionar el estado, selección y motor de edición de un editor WYSIWYG nativo contentEditable.
 */
export function useGuiaEditor() {
  // Estados de formato activo
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [currentFontSize, setCurrentFontSize] = useState('3'); // 3 = Normal (16px)
  const [fontSizeMenuOpen, setFontSizeMenuOpen] = useState(false);
  const [activeAlign, setActiveAlign] = useState<MediaAlign>('left');

  // Referencias al DOM y Selección
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const savedRangeRef = useRef<Range | null>(null);
  const selectedMediaRef = useRef<HTMLElement | null>(null);
  const isFormattingRef = useRef(false);

  // Mapa de imágenes locales pendientes de subir: Map<localBlobUrl, File>
  const pendingImagesRef = useRef<Map<string, File>>(new Map());

  /**
   * Limpia la memoria de imágenes blob pendientes al cerrar o resetear el editor
   */
  const cleanupPendingImages = useCallback(() => {
    pendingImagesRef.current.forEach((_, blobUrl) => {
      try {
        URL.revokeObjectURL(blobUrl);
      } catch (e) {}
    });
    pendingImagesRef.current.clear();
  }, []);

  /**
   * Deseleccionar o seleccionar elemento multimedia con borde de foco (ring)
   */
  const setSelectedMedia = useCallback((mediaEl: HTMLElement | null) => {
    if (selectedMediaRef.current && selectedMediaRef.current !== mediaEl) {
      const prevCard = selectedMediaRef.current.querySelector('.group\\/media') as HTMLElement | null;
      if (prevCard) {
        prevCard.classList.remove('ring-2', 'ring-secondary', 'border-secondary', 'shadow-secondary/30');
      }
    }

    selectedMediaRef.current = mediaEl;

    if (mediaEl) {
      const newCard = mediaEl.querySelector('.group\\/media') as HTMLElement | null;
      if (newCard) {
        newCard.classList.add('ring-2', 'ring-secondary', 'border-secondary', 'shadow-secondary/30');
      }
      const align = (mediaEl.dataset.align as MediaAlign) || 'center';
      setActiveAlign(align);
    }
  }, []);

  /**
   * Guardar posición exacta del cursor en el editor
   */
  const saveSelection = useCallback(() => {
    if (typeof window === 'undefined') return;
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && editorRef.current) {
      const range = sel.getRangeAt(0);
      if (editorRef.current.contains(range.commonAncestorContainer)) {
        savedRangeRef.current = range.cloneRange();
      }
    }
  }, []);

  /**
   * Restaurar posición del cursor guardada
   */
  const restoreSelection = useCallback(() => {
    if (typeof window === 'undefined' || !savedRangeRef.current) return;
    const sel = window.getSelection();
    if (sel) {
      sel.removeAllRanges();
      sel.addRange(savedRangeRef.current);
    }
  }, []);

  /**
   * Asegurar que el foco y la selección del editor permanezcan activos sin provocar scroll
   */
  const ensureEditorFocus = useCallback(() => {
    if (typeof window === 'undefined' || !editorRef.current) return;
    const sel = window.getSelection();
    const isSelectionInside =
      sel &&
      sel.rangeCount > 0 &&
      editorRef.current.contains(sel.getRangeAt(0).commonAncestorContainer);

    if (!isSelectionInside) {
      if (savedRangeRef.current) {
        sel?.removeAllRanges();
        sel?.addRange(savedRangeRef.current);
      } else {
        editorRef.current.focus({ preventScroll: true });
      }
    }
  }, []);

  /**
   * Ejecuta una acción de formato preservando estrictamente la posición del scroll
   * para evitar cualquier salto provocado por execCommand o focus en celulares y PC
   */
  const preserveScrollPosition = useCallback((action: () => void) => {
    isFormattingRef.current = true;
    const formEl = editorRef.current?.closest('form') || null;
    const targetScrollTop = formEl ? formEl.scrollTop : 0;
    const targetWindowY = typeof window !== 'undefined' ? window.scrollY : 0;

    action();

    // 1. Restaurar síncronamente
    if (formEl) {
      formEl.scrollTop = targetScrollTop;
    }
    if (typeof window !== 'undefined') {
      window.scrollTo(window.scrollX, targetWindowY);
    }

    // 2. Anular el scroll asíncrono que los navegadores móviles ejecutan en microtasks tras execCommand
    requestAnimationFrame(() => {
      if (formEl) formEl.scrollTop = targetScrollTop;
      if (typeof window !== 'undefined') window.scrollTo(window.scrollX, targetWindowY);
    });

    setTimeout(() => {
      if (formEl) formEl.scrollTop = targetScrollTop;
      if (typeof window !== 'undefined') window.scrollTo(window.scrollX, targetWindowY);
    }, 40);

    setTimeout(() => {
      if (formEl) formEl.scrollTop = targetScrollTop;
      if (typeof window !== 'undefined') window.scrollTo(window.scrollX, targetWindowY);
      isFormattingRef.current = false;
    }, 250);
  }, []);

  /**
   * Asegura que el cursor (caret) o elemento activo esté siempre visible por encima del teclado virtual en celulares
   */
  const keepCaretVisible = useCallback(() => {
    if (typeof window === 'undefined' || isFormattingRef.current) return;

    setTimeout(() => {
      if (isFormattingRef.current) return;
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0 || !editorRef.current) return;
      const range = sel.getRangeAt(0);

      if (!editorRef.current.contains(range.startContainer)) return;

      // Buscar el bloque o elemento contenedor del cursor
      let targetNode: Node | null = range.startContainer;
      if (targetNode.nodeType === Node.TEXT_NODE) {
        targetNode = targetNode.parentElement;
      }

      if (targetNode && targetNode instanceof HTMLElement && editorRef.current.contains(targetNode)) {
        // Centra suavemente la línea de escritura en el espacio visible sobre el teclado
        targetNode.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
      }
    }, 60);
  }, []);

  /**
   * Detectar y actualizar el estado activo de los botones de la barra de herramientas
   */
  const updateActiveFormatting = useCallback(() => {
    saveSelection();

    if (typeof document !== 'undefined') {
      try {
        setIsBold(document.queryCommandState('bold'));
        setIsItalic(document.queryCommandState('italic'));
        setIsUnderline(document.queryCommandState('underline'));

        // Detectar tamaño de fuente exacto desde el nodo o la selección
        const sel = window.getSelection();
        let detectedFontSize = '3';
        if (sel && sel.rangeCount > 0 && editorRef.current) {
          const range = sel.getRangeAt(0);
          let node: Node | null = range.startContainer;
          if (node.nodeType === Node.TEXT_NODE) node = node.parentNode;
          let curr: HTMLElement | null = node as HTMLElement;
          while (curr && curr !== editorRef.current) {
            if (curr.tagName === 'FONT') {
              const sz = curr.getAttribute('size');
              if (sz) {
                detectedFontSize = sz;
                break;
              }
            }
            curr = curr.parentElement;
          }
        }
        setCurrentFontSize(detectedFontSize);
      } catch (err) {}
    }

    // 1. Si hay una imagen o video seleccionado
    if (selectedMediaRef.current) {
      const align = (selectedMediaRef.current.dataset.align as MediaAlign) || 'center';
      setActiveAlign(align);
      return;
    }

    // 2. Si el usuario está sobre texto en el editor
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && editorRef.current) {
      const range = sel.getRangeAt(0);
      let node: Node | null = range.startContainer;
      if (node.nodeType === Node.TEXT_NODE) node = node.parentNode;

      let current: HTMLElement | null = node as HTMLElement;
      while (current && current !== editorRef.current) {
        if (current.dataset?.type === 'image' || current.dataset?.type === 'youtube') {
          setSelectedMedia(current);
          return;
        }

        const alignStyle = current.style.textAlign;
        if (alignStyle === 'center' || alignStyle === 'right' || alignStyle === 'left') {
          setActiveAlign(alignStyle as MediaAlign);
          return;
        }
        current = current.parentElement;
      }
    }

    setActiveAlign('left');
  }, [saveSelection, setSelectedMedia]);

  /**
   * Insertar HTML en la posición EXACTA del cursor dentro del documento
   */
  const insertHtmlAtSavedCursor = useCallback((htmlToInsert: string) => {
    if (!editorRef.current) return;
    editorRef.current.focus();

    restoreSelection();

    const sel = window.getSelection();
    if (
      sel &&
      sel.rangeCount > 0 &&
      editorRef.current.contains(sel.getRangeAt(0).commonAncestorContainer)
    ) {
      const range = sel.getRangeAt(0);

      // Si es un elemento multimedia (imagen o video), insertarlo como bloque independiente
      const isBlockMedia =
        htmlToInsert.includes('data-type="image"') || htmlToInsert.includes('data-type="youtube"');

      if (isBlockMedia) {
        let node: Node | null = range.startContainer;
        if (node.nodeType === Node.TEXT_NODE) node = node.parentNode;
        let block: HTMLElement | null = node as HTMLElement;
        while (block && block.parentElement !== editorRef.current && block !== editorRef.current) {
          block = block.parentElement;
        }

        const temp = document.createElement('div');
        temp.innerHTML = htmlToInsert;
        const mediaNode = temp.firstElementChild || temp;

        if (block && block !== editorRef.current) {
          if (!block.textContent?.trim()) {
            block.parentNode?.replaceChild(mediaNode, block);
          } else {
            block.parentNode?.insertBefore(mediaNode, block.nextSibling);
          }
        } else {
          editorRef.current.appendChild(mediaNode);
        }

        const newP = document.createElement('p');
        newP.className = 'my-2 leading-relaxed text-slate-100';
        newP.innerHTML = '<br>';
        mediaNode.parentNode?.insertBefore(newP, mediaNode.nextSibling);

        const newRange = document.createRange();
        newRange.setStart(newP, 0);
        newRange.collapse(true);
        sel.removeAllRanges();
        sel.addRange(newRange);
        savedRangeRef.current = newRange.cloneRange();
        return;
      }

      range.deleteContents();

      const el = document.createElement('div');
      el.innerHTML = htmlToInsert;

      const frag = document.createDocumentFragment();
      let node, lastNode;
      while ((node = el.firstChild)) {
        lastNode = frag.appendChild(node);
      }
      range.insertNode(frag);

      if (lastNode) {
        const newRange = document.createRange();
        newRange.setStartAfter(lastNode);
        newRange.collapse(true);
        sel.removeAllRanges();
        sel.addRange(newRange);
        savedRangeRef.current = newRange.cloneRange();
      }
    } else {
      const el = document.createElement('div');
      el.innerHTML = htmlToInsert;
      editorRef.current.appendChild(el);
    }
  }, [restoreSelection]);

  // ─── Comandos de Formato de Texto ──────────────────────────────────────────

  const handleToggleBold = useCallback(() => {
    preserveScrollPosition(() => {
      ensureEditorFocus();
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0 && editorRef.current) {
        const range = sel.getRangeAt(0);
        if (range.collapsed) {
          let node: Node | null = range.startContainer;
          if (node.nodeType === Node.TEXT_NODE) node = node.parentNode;
          let bTag: HTMLElement | null = null;
          let curr: HTMLElement | null = node as HTMLElement;
          while (curr && curr !== editorRef.current) {
            if (curr.tagName === 'B' || curr.tagName === 'STRONG') {
              bTag = curr;
              break;
            }
            curr = curr.parentElement;
          }
          if (bTag) {
            const parent = bTag.parentNode;
            if (parent) {
              while (bTag.firstChild) {
                parent.insertBefore(bTag.firstChild, bTag);
              }
              parent.removeChild(bTag);
              setIsBold(false);
              saveSelection();
              updateActiveFormatting();
              return;
            }
          }
        }
      }

      document.execCommand('bold', false);
      saveSelection();
      updateActiveFormatting();
    });
  }, [ensureEditorFocus, saveSelection, updateActiveFormatting, preserveScrollPosition]);

  const handleToggleItalic = useCallback(() => {
    preserveScrollPosition(() => {
      ensureEditorFocus();
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0 && editorRef.current) {
        const range = sel.getRangeAt(0);
        if (range.collapsed) {
          let node: Node | null = range.startContainer;
          if (node.nodeType === Node.TEXT_NODE) node = node.parentNode;
          let iTag: HTMLElement | null = null;
          let curr: HTMLElement | null = node as HTMLElement;
          while (curr && curr !== editorRef.current) {
            if (curr.tagName === 'I' || curr.tagName === 'EM') {
              iTag = curr;
              break;
            }
            curr = curr.parentElement;
          }
          if (iTag) {
            const parent = iTag.parentNode;
            if (parent) {
              while (iTag.firstChild) {
                parent.insertBefore(iTag.firstChild, iTag);
              }
              parent.removeChild(iTag);
              setIsItalic(false);
              saveSelection();
              updateActiveFormatting();
              return;
            }
          }
        }
      }

      document.execCommand('italic', false);
      saveSelection();
      updateActiveFormatting();
    });
  }, [ensureEditorFocus, saveSelection, updateActiveFormatting, preserveScrollPosition]);

  const handleToggleUnderline = useCallback(() => {
    preserveScrollPosition(() => {
      ensureEditorFocus();
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0 && editorRef.current) {
        const range = sel.getRangeAt(0);
        if (range.collapsed) {
          let node: Node | null = range.startContainer;
          if (node.nodeType === Node.TEXT_NODE) node = node.parentNode;
          let uTag: HTMLElement | null = null;
          let curr: HTMLElement | null = node as HTMLElement;
          while (curr && curr !== editorRef.current) {
            if (curr.tagName === 'U') {
              uTag = curr;
              break;
            }
            curr = curr.parentElement;
          }
          if (uTag) {
            const parent = uTag.parentNode;
            if (parent) {
              while (uTag.firstChild) {
                parent.insertBefore(uTag.firstChild, uTag);
              }
              parent.removeChild(uTag);
              setIsUnderline(false);
              saveSelection();
              updateActiveFormatting();
              return;
            }
          }
        }
      }

      document.execCommand('underline', false);
      saveSelection();
      updateActiveFormatting();
    });
  }, [ensureEditorFocus, saveSelection, updateActiveFormatting, preserveScrollPosition]);

  const handleChangeFontSize = useCallback((sizeVal: string) => {
    preserveScrollPosition(() => {
      ensureEditorFocus();
      setCurrentFontSize(sizeVal);

      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0 && editorRef.current) {
        const range = sel.getRangeAt(0);
        if (range.collapsed) {
          let node: Node | null = range.startContainer;
          if (node.nodeType === Node.TEXT_NODE) node = node.parentNode;
          let fontTag: HTMLElement | null = null;
          let curr: HTMLElement | null = node as HTMLElement;
          while (curr && curr !== editorRef.current) {
            if (curr.tagName === 'FONT') {
              fontTag = curr;
              break;
            }
            curr = curr.parentElement;
          }

          if (fontTag) {
            fontTag.setAttribute('size', sizeVal);
            saveSelection();
            return;
          } else {
            // Insertar contenedor font directamente para que el DOM lo tenga al instante
            const fontEl = document.createElement('font');
            fontEl.setAttribute('size', sizeVal);
            fontEl.innerHTML = '&#8203;';
            range.insertNode(fontEl);

            const newRange = document.createRange();
            newRange.setStart(fontEl.firstChild || fontEl, 1);
            newRange.collapse(true);
            sel.removeAllRanges();
            sel.addRange(newRange);
            savedRangeRef.current = newRange.cloneRange();
            return;
          }
        }
      }

      document.execCommand('fontSize', false, sizeVal);
      saveSelection();
    });
  }, [ensureEditorFocus, saveSelection, preserveScrollPosition]);

  // ─── Manejo de Teclado, Alineación y Multimedia ────────────────────────────

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0 || !editorRef.current) return;
      const range = sel.getRangeAt(0);

      if (range.collapsed) {
        let node: Node | null = range.startContainer;
        if (node.nodeType === Node.TEXT_NODE) node = node.parentNode;

        let block: HTMLElement | null = node as HTMLElement;
        while (block && block.parentElement !== editorRef.current && block !== editorRef.current) {
          block = block.parentElement;
        }

        if (block && block !== editorRef.current) {
          e.preventDefault();

          const targetFontSize = currentFontSize;
          const targetAlign = block.style.textAlign || activeAlign || 'left';

          const newP = document.createElement('p');
          newP.className = 'my-2 leading-relaxed text-slate-100';
          newP.style.textAlign = targetAlign;

          let targetNode: Node = newP;
          if (targetFontSize && targetFontSize !== '3') {
            const fontEl = document.createElement('font');
            fontEl.setAttribute('size', targetFontSize);
            fontEl.innerHTML = '<br>';
            newP.appendChild(fontEl);
            targetNode = fontEl;
          } else {
            newP.innerHTML = '<br>';
          }

          if (block.nextSibling) {
            block.parentNode?.insertBefore(newP, block.nextSibling);
          } else {
            block.parentNode?.appendChild(newP);
          }

          const newRange = document.createRange();
          newRange.setStart(targetNode, 0);
          newRange.collapse(true);
          sel.removeAllRanges();
          sel.addRange(newRange);
          savedRangeRef.current = newRange.cloneRange();

          // Scroll automático para que el nuevo renglón quede 100% visible en el centro
          setTimeout(() => {
            newP.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' });
            updateActiveFormatting();
          }, 10);
        }
      }
    }
  }, [currentFontSize, activeAlign, updateActiveFormatting]);

  const handleApplyAlignment = useCallback((align: MediaAlign) => {
    setActiveAlign(align);

    // Si hay una imagen o video seleccionado, lo alineamos de inmediato
    if (selectedMediaRef.current) {
      selectedMediaRef.current.dataset.align = align;
      const justifyStyle = align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center';
      selectedMediaRef.current.style.display = 'flex';
      selectedMediaRef.current.style.justifyContent = justifyStyle;
      selectedMediaRef.current.style.width = '100%';
      selectedMediaRef.current.style.textAlign = align;

      const currentUrl = selectedMediaRef.current.dataset.url || '';
      const currentSize = selectedMediaRef.current.dataset.size || 'medium';
      const cleanUrl = currentUrl.split('#')[0];
      selectedMediaRef.current.dataset.url = `${cleanUrl}#size=${currentSize}&align=${align}`;
      return;
    }

    // Si no hay multimedia seleccionada, alinea el bloque de texto activo
    restoreSelection();

    if (!editorRef.current) return;

    const sel = window.getSelection();
    let targetElement: HTMLElement | null = null;

    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      let node: Node | null = range.startContainer;
      if (node.nodeType === Node.TEXT_NODE) {
        node = node.parentNode;
      }
      targetElement = node as HTMLElement;
    }

    let current: HTMLElement | null = targetElement;
    let textBlockContainer: HTMLElement | null = null;

    while (current && current !== editorRef.current) {
      if (current.dataset?.type === 'image' || current.dataset?.type === 'youtube') {
        setSelectedMedia(current);
        handleApplyAlignment(align);
        return;
      }
      if (['P', 'H1', 'H2', 'H3', 'BLOCKQUOTE', 'DIV'].includes(current.tagName)) {
        textBlockContainer = current;
        break;
      }
      current = current.parentElement;
    }

    if (textBlockContainer) {
      textBlockContainer.style.textAlign = align;
    } else {
      document.execCommand(
        align === 'left' ? 'justifyLeft' : align === 'right' ? 'justifyRight' : 'justifyCenter',
        false
      );
    }
  }, [restoreSelection, setSelectedMedia]);

  const handleOpenImagePicker = useCallback(() => {
    saveSelection();
    fileInputRef.current?.click();
  }, [saveSelection]);

  const handleAddLocalImageFile = useCallback((file: File) => {
    if (!file || !file.type.startsWith('image/')) return;

    // 1. Generar URL local en memoria para vista previa inmediata
    const localBlobUrl = URL.createObjectURL(file);
    pendingImagesRef.current.set(localBlobUrl, file);

    const cleanName = file.name.replace(/\.[^/.]+$/, '');
    insertHtmlAtSavedCursor(createImageEmbedHtml(localBlobUrl, cleanName, 'medium', 'center'));

    // 2. Seleccionar la imagen recién insertada para alinearla de inmediato
    setTimeout(() => {
      if (editorRef.current) {
        const allImages = editorRef.current.querySelectorAll('[data-type="image"]');
        if (allImages.length > 0) {
          const lastImg = allImages[allImages.length - 1] as HTMLElement;
          setSelectedMedia(lastImg);
        }
      }
    }, 50);
  }, [insertHtmlAtSavedCursor, setSelectedMedia]);

  const handleImageFileSelected = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleAddLocalImageFile(e.target.files[0]);
      e.target.value = '';
    }
  }, [handleAddLocalImageFile]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    saveSelection();

    // 1. Verificar si pegó una imagen desde el portapapeles
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          handleAddLocalImageFile(file);
          return;
        }
      }
    }

    // 2. Verificar si pegó un enlace de YouTube directamente en el texto
    const pastedText = e.clipboardData.getData('text/plain')?.trim();
    if (pastedText) {
      const ytId = extractYouTubeId(pastedText);
      if (ytId && (pastedText.includes('youtube.com') || pastedText.includes('youtu.be'))) {
        e.preventDefault();
        insertHtmlAtSavedCursor(createYouTubeEmbedHtml(pastedText, ytId, 'medium', 'center'));
        setTimeout(() => {
          if (editorRef.current) {
            const allVideos = editorRef.current.querySelectorAll('[data-type="youtube"]');
            if (allVideos.length > 0) {
              const lastVideo = allVideos[allVideos.length - 1] as HTMLElement;
              setSelectedMedia(lastVideo);
            }
          }
        }, 50);
        return;
      }
    }
  }, [saveSelection, handleAddLocalImageFile, insertHtmlAtSavedCursor, setSelectedMedia]);

  const handleInputOrKeyUp = useCallback(() => {
    updateActiveFormatting();
    if (!isFormattingRef.current) {
      keepCaretVisible();
    }

    if (!editorRef.current) return;

    const walker = document.createTreeWalker(
      editorRef.current,
      NodeFilter.SHOW_TEXT,
      null
    );

    let node: Node | null;
    const nodesToTransform: { textNode: Node; url: string; ytId: string }[] = [];

    while ((node = walker.nextNode())) {
      const text = node.textContent?.trim() || '';
      if (
        (text.startsWith('http://') || text.startsWith('https://')) &&
        (text.includes('youtube.com') || text.includes('youtu.be')) &&
        !text.includes(' ')
      ) {
        const ytId = extractYouTubeId(text);
        if (ytId) {
          nodesToTransform.push({ textNode: node, url: text, ytId });
        }
      }
    }

    nodesToTransform.forEach(({ textNode, url, ytId }) => {
      const parent = textNode.parentNode;
      if (parent && parent !== editorRef.current) {
        const container = document.createElement('div');
        container.innerHTML = createYouTubeEmbedHtml(url, ytId, 'medium', 'center');
        parent.parentNode?.insertBefore(container.firstElementChild || container, parent);
        parent.parentNode?.removeChild(parent);
      }
    });
  }, [updateActiveFormatting]);

  const handleEditorClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;

    // Buscar si hizo clic sobre una tarjeta de imagen o video
    const mediaContainer = target.closest('[data-type="image"], [data-type="youtube"]') as HTMLElement | null;

    // Comprobar si hizo clic en un botón de acción interno (S, M, L o Eliminar)
    const button = target.closest('button[data-action]') as HTMLButtonElement | null;
    if (button && mediaContainer) {
      e.preventDefault();
      e.stopPropagation();

      const action = button.dataset.action;
      const value = button.dataset.value as MediaSize | undefined;

      if (action === 'delete') {
        if (selectedMediaRef.current === mediaContainer) {
          setSelectedMedia(null);
        }
        // Si era una imagen blob local, liberar memoria
        const img = mediaContainer.querySelector('img');
        if (img && img.src && pendingImagesRef.current.has(img.src)) {
          try {
            URL.revokeObjectURL(img.src);
          } catch (e) {}
          pendingImagesRef.current.delete(img.src);
        }
        mediaContainer.remove();
        return;
      }

      if (action === 'size' && value) {
        mediaContainer.dataset.size = value;
        const isYt = mediaContainer.dataset.type === 'youtube';
        const innerCard = mediaContainer.querySelector('.group\\/media') as HTMLElement;
        if (innerCard) {
          const sizeConfig = isYt ? SIZE_STYLES_YT[value] : SIZE_STYLES_IMG[value];
          innerCard.style.width = sizeConfig.width;
          innerCard.style.maxWidth = sizeConfig.maxWidth;
          innerCard.style.minWidth = sizeConfig.minWidth;
        }

        const sizeButtons = mediaContainer.querySelectorAll('button[data-action="size"]');
        sizeButtons.forEach((btn) => {
          const b = btn as HTMLElement;
          if (b.dataset.value === value) {
            b.className =
              'w-7 h-7 flex items-center justify-center text-xs font-bold rounded-lg transition-colors cursor-pointer text-secondary bg-slate-800 shadow-xs';
          } else {
            b.className =
              'w-7 h-7 flex items-center justify-center text-xs font-bold rounded-lg transition-colors cursor-pointer text-slate-400 hover:text-white hover:bg-slate-800';
          }
        });
        return;
      }
    }

    if (mediaContainer) {
      setSelectedMedia(mediaContainer);
    } else {
      setSelectedMedia(null);
      if (!isFormattingRef.current) {
        keepCaretVisible();
      }
    }

    updateActiveFormatting();
  }, [setSelectedMedia, updateActiveFormatting, keepCaretVisible]);

  /**
   * Resetea el contenido e inicializa el editor a su estado limpio o con markdown inicial
   */
  const resetEditor = useCallback((initialMarkdown?: string) => {
    cleanupPendingImages();
    if (editorRef.current) {
      editorRef.current.innerHTML = initialMarkdown
        ? markdownToHtml(initialMarkdown)
        : '<p>Escribe aquí el contenido de la guía...</p>';
    }
    savedRangeRef.current = null;
    selectedMediaRef.current = null;
    setActiveAlign('left');
    setIsBold(false);
    setIsItalic(false);
    setIsUnderline(false);
    setCurrentFontSize('3');
    setFontSizeMenuOpen(false);
  }, [cleanupPendingImages]);

  /**
   * Procesa la subida diferida de imágenes a Supabase y retorna el markdown final para la BD
   */
  const processPendingImagesAndGetMarkdown = useCallback(async (): Promise<{ markdown?: string; error?: string }> => {
    if (!editorRef.current) {
      return { error: 'El editor no está disponible.' };
    }

    try {
      const figures = Array.from(editorRef.current.querySelectorAll('figure[data-type="image"]'));

      for (const fig of figures) {
        const img = fig.querySelector('img');
        if (!img) continue;

        const src = img.getAttribute('src') || '';
        const pendingFile = pendingImagesRef.current.get(src);

        if (pendingFile) {
          const formData = new FormData();
          formData.append('file', pendingFile);

          const uploadRes = await subirImagenGuiaAction(formData);
          if (uploadRes.error || !uploadRes.url) {
            return { error: uploadRes.error || 'Error al subir una de las imágenes.' };
          }

          // Reemplazar URL local blob por URL pública permanente de Supabase
          img.src = uploadRes.url;
          img.setAttribute('src', uploadRes.url);

          const size = (fig as HTMLElement).dataset.size || 'medium';
          const align = (fig as HTMLElement).dataset.align || 'center';
          (fig as HTMLElement).dataset.url = `${uploadRes.url}#size=${size}&align=${align}`;

          try {
            URL.revokeObjectURL(src);
          } catch (e) {}
          pendingImagesRef.current.delete(src);
        }
      }

      const rawHtml = editorRef.current.innerHTML || '';
      const markdown = htmlToMarkdown(rawHtml);

      return { markdown };
    } catch (err: any) {
      console.error('Error al procesar contenido multimedia:', err);
      return { error: 'Ocurrió un error inesperado al procesar las imágenes del documento.' };
    }
  }, []);

  return {
    // Referencias
    editorRef,
    fileInputRef,
    // Estados de Formato
    isBold,
    isItalic,
    isUnderline,
    currentFontSize,
    fontSizeMenuOpen,
    setFontSizeMenuOpen,
    activeAlign,
    // Acciones de Formato
    handleToggleBold,
    handleToggleItalic,
    handleToggleUnderline,
    handleChangeFontSize,
    handleApplyAlignment,
    handleOpenImagePicker,
    handleImageFileSelected,
    ensureEditorFocus,
    // Eventos del Editor
    handleKeyDown,
    handlePaste,
    handleInputOrKeyUp,
    handleEditorClick,
    updateActiveFormatting,
    keepCaretVisible,
    // Ciclo de Vida y Persistencia
    resetEditor,
    cleanupPendingImages,
    processPendingImagesAndGetMarkdown,
  };
}
