'use client';

import React, { useState, useEffect, useRef } from "react";
import { crearCelular, editarCelular } from "@/app/empresa/webapp/catalogo-web/catalogo-actions";
import SubmitButton from "./SubmitButton";
import { MARCAS, ALMACENAMIENTOS, RAMS } from "@/utils/constants";

const styles = {
  grid: "grid grid-cols-1 md:grid-cols-2 gap-6",
  inputGroup: "space-y-2",
  label: "text-sm font-medium text-slate-300 ml-1",
  input: "w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-secondary transition-all",
  tag: "inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-200 animate-in zoom-in-95 duration-200",
  tagRemove: "text-slate-500 hover:text-red-400 cursor-pointer material-symbols-outlined text-sm font-bold",
  uploadArea: "relative group border-2 border-dashed border-slate-800 hover:border-secondary/50 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 transition-all cursor-pointer overflow-hidden min-h-[160px] bg-slate-950/20",
  uploadPreview: "absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500",
  pill: "px-4 py-2 border rounded-xl text-sm font-semibold transition-all duration-300 cursor-pointer select-none",
};

interface CatalogoFormProps {
  celular?: any; // Objeto de celular a editar si aplica
  onSuccess?: () => void; // Callback al finalizar con éxito
}

export default function CatalogoForm({ celular, onSuccess }: CatalogoFormProps) {
  const isEditing = !!celular;
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados del Formulario
  const [marca, setMarca] = useState(celular?.marca || "");
  const [modelo, setModelo] = useState(celular?.modelo || "");
  const [descripcion, setDescripcion] = useState(celular?.descripcion || "");
  const [errorMsg, setErrorMsg] = useState("");
  
  // Estados para variantes
  const [colores, setColores] = useState<string[]>(celular?.colores || []);
  const [nuevoColor, setNuevoColor] = useState("");
  const [almacenamientos, setAlmacenamientos] = useState<string[]>(celular?.almacenamientos || []);
  const [rams, setRams] = useState<string[]>(celular?.rams || []);

  // Estados para Imagen
  const [imagePreview, setImagePreview] = useState<string>(celular?.imagen_url || "");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Reset del formulario al cambiar el celular en props
  useEffect(() => {
    if (celular) {
      setMarca(celular.marca || "");
      setModelo(celular.modelo || "");
      setDescripcion(celular.descripcion || "");
      setColores(celular.colores || []);
      setAlmacenamientos(celular.almacenamientos || []);
      setRams(celular.rams || []);
      setImagePreview(celular.imagen_url || "");
      setSelectedFile(null);
    } else {
      setMarca("");
      setModelo("");
      setDescripcion("");
      setColores([]);
      setAlmacenamientos([]);
      setRams([]);
      setImagePreview("");
      setSelectedFile(null);
    }
    setErrorMsg("");
  }, [celular]);

  // Manejo de Colores (Agregar etiqueta)
  const handleAddColor = (e: React.FormEvent) => {
    e.preventDefault();
    const colorTrimmed = nuevoColor.trim();
    if (!colorTrimmed) return;
    
    // Evitar duplicados
    if (colores.some(c => c.toLowerCase() === colorTrimmed.toLowerCase())) {
      setNuevoColor("");
      return;
    }

    setColores([...colores, colorTrimmed]);
    setNuevoColor("");
  };

  const handleRemoveColor = (colorToRemove: string) => {
    setColores(colores.filter(c => c !== colorToRemove));
  };

  // Manejo de Almacenamientos (Píldoras interactivas tipo Toggle)
  const handleToggleAlmacenamiento = (alm: string) => {
    if (almacenamientos.includes(alm)) {
      setAlmacenamientos(almacenamientos.filter(a => a !== alm));
    } else {
      setAlmacenamientos([...almacenamientos, alm]);
    }
  };

  // Manejo de RAMs (Píldoras interactivas tipo Toggle)
  const handleToggleRam = (ram: string) => {
    if (rams.includes(ram)) {
      setRams(rams.filter(r => r !== ram));
    } else {
      setRams([...rams, ram]);
    }
  };

// Función auxiliar para recortar márgenes transparentes e inyectar un padding uniforme (Ruta B)
function procesarImagenTransparente(file: File): Promise<File> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // 1. Crear canvas temporal para leer la información de píxeles
        const tempCanvas = document.createElement("canvas");
        const tempCtx = tempCanvas.getContext("2d");
        if (!tempCtx) {
          resolve(file); // Fallback en caso de error
          return;
        }

        tempCanvas.width = img.width;
        tempCanvas.height = img.height;
        tempCtx.drawImage(img, 0, 0);

        const imgData = tempCtx.getImageData(0, 0, img.width, img.height);
        const { data, width, height } = imgData;

        // Encontrar los bordes reales del contenido no transparente
        let minX = width;
        let minY = height;
        let maxX = 0;
        let maxY = 0;
        let foundContent = false;

        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const alphaIndex = (y * width + x) * 4 + 3;
            const alpha = data[alphaIndex];

            // Tolerancia de transparencia (alfa > 5 para ignorar ruidos muy tenues)
            if (alpha > 5) {
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
              foundContent = true;
            }
          }
        }

        // Si la imagen es completamente transparente, no recortar nada
        if (!foundContent) {
          resolve(file);
          return;
        }

        const cropWidth = (maxX - minX) + 1;
        const cropHeight = (maxY - minY) + 1;

        // 2. Crear el lienzo final normalizado (Un cuadrado de 800x800 para consistencia absoluta)
        const finalCanvas = document.createElement("canvas");
        const finalCtx = finalCanvas.getContext("2d");
        if (!finalCtx) {
          resolve(file);
          return;
        }

        const targetSize = 800;
        finalCanvas.width = targetSize;
        finalCanvas.height = targetSize;

        // Limpiar a transparente
        finalCtx.clearRect(0, 0, targetSize, targetSize);

        // 3. Escala proporcional respetando un 12% de padding (espacio libre en los bordes)
        const paddingRatio = 0.12; 
        const maxDrawSize = targetSize * (1 - paddingRatio * 2); // 608px libres

        const scale = Math.min(maxDrawSize / cropWidth, maxDrawSize / cropHeight);
        const drawWidth = cropWidth * scale;
        const drawHeight = cropHeight * scale;

        // Centrado absoluto
        const drawX = (targetSize - drawWidth) / 2;
        const drawY = (targetSize - drawHeight) / 2;

        // Dibujar el fragmento recortado del celular en el centro del nuevo lienzo
        finalCtx.drawImage(
          img,
          minX, minY, cropWidth, cropHeight, // Origen: Recorte ceñido al dispositivo
          drawX, drawY, drawWidth, drawHeight // Destino: Centrado con márgenes proporcionales
        );

        // 4. Exportar como un nuevo archivo WebP (Soporta transparencia y ahorra hasta un 70% de espacio)
        finalCanvas.toBlob((blob) => {
          if (blob) {
            const optimizedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + "_normalized.webp", {
              type: "image/webp",
              lastModified: Date.now()
            });
            resolve(optimizedFile);
          } else {
            resolve(file);
          }
        }, "image/webp", 0.85); // Calidad WebP del 85% (perfecta relación calidad/peso)
      };
      img.onerror = () => resolve(file);
      img.src = event.target?.result as string;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}

  // Manejo de subida y previsualización de imágenes
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      setErrorMsg("El archivo seleccionado debe ser una imagen.");
      return;
    }

    try {
      // Normalización inteligente B: Recortar bordes inútiles transparentes y centrar a escala uniforme
      const processedFile = await procesarImagenTransparente(file);
      setSelectedFile(processedFile);
      setImagePreview(URL.createObjectURL(processedFile));
    } catch (err) {
      // Fallback a comportamiento estándar si falla
      setSelectedFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
    setErrorMsg("");
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Acción del Formulario (Client-side Wrapper)
  const handleClientAction = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg("");

    if (!marca) {
      setErrorMsg("La marca es obligatoria.");
      return;
    }
    if (!modelo) {
      setErrorMsg("El modelo es obligatorio.");
      return;
    }
    if (colores.length === 0) {
      setErrorMsg("Debes agregar al menos un color.");
      return;
    }
    if (almacenamientos.length === 0) {
      setErrorMsg("Debes seleccionar al menos un almacenamiento.");
      return;
    }
    if (rams.length === 0) {
      setErrorMsg("Debes seleccionar al menos una opción de RAM.");
      return;
    }
    if (!imagePreview) {
      setErrorMsg("La imagen del celular es obligatoria.");
      return;
    }
    if (!descripcion) {
      setErrorMsg("La descripción es obligatoria.");
      return;
    }

    const formData = new FormData();
    if (isEditing) {
      formData.append("id", celular.id);
      formData.append("imagenUrlAnterior", celular.imagen_url);
    }
    formData.append("marca", marca);
    formData.append("modelo", modelo);
    formData.append("descripcion", descripcion);
    formData.append("colores", colores.join(","));
    formData.append("almacenamientos", almacenamientos.join(","));
    formData.append("rams", rams.join(","));
    
    if (selectedFile) {
      formData.append("imagen", selectedFile);
    }

    const result = isEditing 
      ? await editarCelular(formData) 
      : await crearCelular(formData);

    if (result?.error) {
      setErrorMsg(result.error);
    } else {
      // Limpiar formulario si no es edición
      if (!isEditing) {
        setMarca("");
        setModelo("");
        setDescripcion("");
        setColores([]);
        setAlmacenamientos([]);
        setRams([]);
        setImagePreview("");
        setSelectedFile(null);
      }
      if (onSuccess) {
        onSuccess();
      }
    }
  };

  return (
    <form onSubmit={handleClientAction} className="space-y-6">
      {errorMsg && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-semibold rounded-2xl animate-in fade-in duration-300 flex items-center gap-2">
          <span className="material-symbols-outlined text-base">error</span>
          {errorMsg}
        </div>
      )}

      <div className={styles.grid}>
        {/* Lado Izquierdo: Datos Básicos */}
        <div className="space-y-6">
          {/* Marca */}
          <div className={styles.inputGroup}>
            <label className={styles.label}>Marca</label>
            <div className="relative">
              <select 
                value={marca}
                onChange={(e) => setMarca(e.target.value)}
                required 
                className={`${styles.input} appearance-none cursor-pointer bg-slate-950`}
                style={{ colorScheme: 'dark' }}
              >
                <option value="" className="bg-slate-950 text-white">Seleccionar...</option>
                {MARCAS.map(m => <option key={m} value={m} className="bg-slate-950 text-white">{m}</option>)}
              </select>
              <span className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-500 pointer-events-none text-base">expand_more</span>
            </div>
          </div>

          {/* Modelo */}
          <div className={styles.inputGroup}>
            <label className={styles.label}>Modelo</label>
            <input 
              value={modelo}
              onChange={(e) => setModelo(e.target.value)}
              type="text" 
              placeholder="Ej: iPhone 13 Pro Max" 
              required 
              className={styles.input} 
            />
          </div>

          {/* Descripción Comercial */}
          <div className={styles.inputGroup}>
            <label className={styles.label}>Descripción Comercial</label>
            <textarea 
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Ej: Pantalla Super Retina XDR, Chip A15 Bionic y un sistema de cámaras Pro revolucionario." 
              required 
              rows={3}
              className={`${styles.input} resize-none`} 
            />
          </div>
        </div>

        {/* Lado Derecho: Imagen & Variantes */}
        <div className="space-y-6">
          {/* Carga de Imagen */}
          <div className={styles.inputGroup}>
            <label className={styles.label}>Imagen del Celular</label>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImageChange}
              accept="image/*"
              className="hidden" 
            />
            <div onClick={triggerFileInput} className={styles.uploadArea}>
              {imagePreview ? (
                <>
                  <img 
                    src={imagePreview} 
                    alt="Vista previa del celular" 
                    className={styles.uploadPreview} 
                  />
                  <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span className="material-symbols-outlined text-3xl text-white">photo_camera</span>
                    <span className="text-sm font-semibold text-white">Reemplazar Imagen</span>
                  </div>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-3xl text-slate-500 group-hover:text-secondary group-hover:scale-110 transition-all duration-300">cloud_upload</span>
                  <div className="text-center">
                    <span className="text-sm font-semibold text-slate-300 block">Sube una foto</span>
                    <span className="text-xs text-slate-500">Haz clic para seleccionar archivo</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Colores por Etiqueta */}
          <div className={styles.inputGroup}>
            <label className={styles.label}>Colores Disponibles</label>
            <div className="flex gap-2">
              <input 
                value={nuevoColor}
                onChange={(e) => setNuevoColor(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddColor(e);
                  }
                }}
                type="text" 
                placeholder="Escribe un color y presiona Enter" 
                className={`${styles.input} flex-1`} 
              />
              <button 
                type="button"
                onClick={handleAddColor}
                className="px-4 bg-slate-900 border border-slate-800 hover:border-secondary/30 rounded-xl text-secondary text-sm font-bold transition-all cursor-pointer"
              >
                Agregar
              </button>
            </div>
            
            {colores.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {colores.map(color => (
                  <span key={color} className={styles.tag}>
                    {color}
                    <span 
                      onClick={() => handleRemoveColor(color)} 
                      className={styles.tagRemove}
                      title="Eliminar color"
                    >
                      close
                    </span>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Almacenamiento (Píldoras Interactivas de Selección Múltiple) */}
      <div className={styles.inputGroup}>
        <label className={styles.label}>Capacidades de Almacenamiento Disponibles</label>
        <div className="flex flex-wrap gap-3 pt-2">
          {ALMACENAMIENTOS.map(alm => {
            const isSelected = almacenamientos.includes(alm);
            return (
              <div 
                key={alm}
                onClick={() => handleToggleAlmacenamiento(alm)}
                className={`${styles.pill} ${
                  isSelected 
                    ? "bg-secondary/10 border-secondary text-secondary" 
                    : "bg-slate-900/30 border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                {alm}
              </div>
            );
          })}
        </div>
      </div>

      {/* RAM (Píldoras Interactivas de Selección Múltiple) */}
      <div className={styles.inputGroup}>
        <label className={styles.label}>Memorias RAM Disponibles</label>
        <div className="flex flex-wrap gap-3 pt-2">
          {RAMS.map(ram => {
            const isSelected = rams.includes(ram);
            return (
              <div 
                key={ram}
                onClick={() => handleToggleRam(ram)}
                className={`${styles.pill} ${
                  isSelected 
                    ? "bg-secondary/10 border-secondary text-secondary" 
                    : "bg-slate-900/30 border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                {ram}
              </div>
            );
          })}
        </div>
      </div>

      {/* Botón de Envíos */}
      <div className="pt-4 flex justify-end">
        <SubmitButton 
          label={isEditing ? "Guardar Cambios" : "Publicar Celular"} 
          loadingLabel={isEditing ? "Guardando..." : "Publicando..."} 
        />
      </div>
    </form>
  );
}
