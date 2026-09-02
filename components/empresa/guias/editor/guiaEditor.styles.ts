// ─── Estilos Centralizados para el Módulo de Guías y Editor ──────────────────

export const guiaModalStyles = {
  // Contenedores del Modal
  backdrop: "fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200",
  modalContainer: "relative w-full max-w-4xl max-h-[94dvh] sm:max-h-[92vh] flex flex-col bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-auto",
  
  // Cabecera
  header: "flex items-center justify-between px-6 py-5 border-b border-slate-800 bg-slate-900/50",
  headerIconWrapper: "w-10 h-10 rounded-xl bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary",
  headerTitle: "text-xl font-bold text-white",
  closeButton: "p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50",
  
  // Formulario y Scrollbar
  form: "flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 [scrollbar-width:thin] [scrollbar-color:#334155_#020617] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-slate-950 [&::-webkit-scrollbar-thumb]:bg-slate-700 hover:[&::-webkit-scrollbar-thumb]:bg-secondary scroll-smooth",
  
  // Mensaje de Error
  errorMessage: "p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm flex items-center gap-3",
  
  // Campos del Formulario
  label: "block text-left text-xs font-bold uppercase tracking-wider text-slate-300",
  input: "w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-secondary transition-all text-base sm:text-sm text-left",
  select: "w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-secondary transition-all appearance-none cursor-pointer pr-10 text-base sm:text-sm",
  
  // Botón Pin Destacado
  pinButtonActive: "w-[62px] sm:w-[56px] shrink-0 self-stretch flex items-center justify-center rounded-xl transition-all cursor-pointer border bg-amber-500/20 text-amber-400 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]",
  pinButtonInactive: "w-[62px] sm:w-[56px] shrink-0 self-stretch flex items-center justify-center rounded-xl transition-all cursor-pointer border bg-slate-950 text-slate-400 hover:text-slate-200 border-slate-800 hover:border-slate-700",
  
  // Botones del Pie de Modal
  footer: "flex items-center justify-end gap-3 pt-4 border-t border-slate-800",
  cancelButton: "px-5 py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm transition-colors cursor-pointer disabled:opacity-50",
  submitButton: "px-6 py-2.5 rounded-xl bg-secondary hover:bg-secondary-fixed text-slate-950 font-bold text-sm shadow-lg shadow-secondary/20 hover:shadow-secondary/30 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50",
};

export const guiaToolbarStyles = {
  // Barra de Herramientas
  toolbarContainer: "p-2 bg-slate-950 border border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-1.5 text-xs shadow-md",
  separator: "h-5 w-px bg-slate-700 mx-0.5 sm:mx-1",
  
  // Botones de Formato
  buttonActive: "w-9 h-9 flex items-center justify-center rounded-lg transition-all cursor-pointer bg-secondary/25 text-secondary border border-secondary/50 shadow-sm shadow-secondary/10 font-bold",
  buttonInactive: "w-9 h-9 flex items-center justify-center rounded-lg transition-all cursor-pointer bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-transparent",
  
  // Botón Selector de Fuente
  fontSizeButton: "h-9 px-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer select-none",
  fontSizeDropdown: "absolute left-0 top-full mt-1.5 w-40 bg-slate-950 border border-slate-800 rounded-xl shadow-2xl py-1 z-40",
  fontSizeItemActive: "w-full text-left px-3 py-2 text-xs font-medium transition-colors cursor-pointer bg-secondary/20 text-secondary font-bold",
  fontSizeItemInactive: "w-full text-left px-3 py-2 text-xs font-medium transition-colors cursor-pointer text-slate-300 hover:bg-slate-900 hover:text-white",
  
  // Botón Insertar Imagen
  imageButton: "w-9 h-9 flex items-center justify-center bg-secondary/20 hover:bg-secondary text-secondary hover:text-slate-950 rounded-lg transition-all cursor-pointer font-bold border border-secondary/30",
};

export const guiaEditorBoxStyles = {
  container: "w-full bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden focus-within:border-secondary focus-within:ring-1 focus-within:ring-secondary transition-all shadow-inner",
  contentEditable: "w-full min-h-[250px] sm:min-h-[350px] p-4 sm:p-5 pb-44 sm:pb-24 text-slate-100 caret-secondary focus:outline-none leading-relaxed [scrollbar-width:thin] [scrollbar-color:#334155_#020617] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-slate-950 [&::-webkit-scrollbar-thumb]:bg-slate-700 hover:[&::-webkit-scrollbar-thumb]:bg-secondary",
};
