import { createDecoder, type Decoder, type ScanResult } from "./decoder";

export function cameraError(error: unknown): string {
  const name = error instanceof Error || (typeof error === "object" && error !== null && "name" in error) ? String(error.name) : "";
  switch (name) {
    case "NotAllowedError": case "PermissionDeniedError":
      return "No se pudo acceder a la cámara. Permití su uso en los ajustes del sitio y del sistema, y volvé a intentar. Si abriste la página dentro de otra app, probá en el navegador.";
    case "NotFoundError": case "DevicesNotFoundError":
      return "No encontramos una cámara. Conectá una y volvé a intentar.";
    case "NotReadableError": case "TrackStartError":
      return "La cámara está ocupada o no está disponible. Cerrá otras aplicaciones que la usen y volvé a intentar.";
    case "OverconstrainedError":
      return "La cámara no admite la configuración solicitada. Cerrá otras aplicaciones que la usen y volvé a intentar.";
    case "SecurityError":
      return "El navegador bloqueó la cámara. Abrí esta página directamente en localhost o en una conexión HTTPS confiable.";
    default:
      return "No se pudo iniciar o mantener la lectura. Verificá la cámara y volvé a intentar.";
  }
}

function errorName(error: unknown) {
  return typeof error === "object" && error !== null && "name" in error ? String(error.name) : "";
}

async function findPreferredCameraId(): Promise<string | undefined> {
  try {
    if (!navigator.mediaDevices?.enumerateDevices) return undefined;
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter((d) => d.kind === "videoinput");
    if (videoDevices.length === 0) return undefined;

    // Prioridad 1: Cámara trasera 0 de Android ("camera2 0, facing back", sensor principal con flash)
    const camera0 = videoDevices.find((d) => {
      const label = (d.label || "").toLowerCase();
      const isBack =
        label.includes("back") ||
        label.includes("trasera") ||
        label.includes("rear") ||
        label.includes("environment");
      const hasZeroOrMain =
        label.includes("0") ||
        label.includes("main") ||
        label.includes("principal");
      return isBack && hasZeroOrMain;
    });
    if (camera0?.deviceId) return camera0.deviceId;

    // Prioridad 2: Cualquier cámara que mencione "0" y no sea frontal
    const anyZero = videoDevices.find((d) => {
      const label = (d.label || "").toLowerCase();
      return (
        !label.includes("front") &&
        !label.includes("frontal") &&
        label.includes("0")
      );
    });
    if (anyZero?.deviceId) return anyZero.deviceId;

    // Prioridad 3: Primera cámara trasera explícita
    const firstBack = videoDevices.find((d) => {
      const label = (d.label || "").toLowerCase();
      return (
        label.includes("back") ||
        label.includes("trasera") ||
        label.includes("rear") ||
        label.includes("environment")
      );
    });
    if (firstBack?.deviceId) return firstBack.deviceId;
  } catch {}
  return undefined;
}

async function requestCamera(selectedDeviceId?: string) {
  const resolution = {
    width: { ideal: 1920 },
    height: { ideal: 1080 },
  };

  let targetDeviceId = selectedDeviceId;
  if (!targetDeviceId) {
    targetDeviceId = await findPreferredCameraId();
  }

  if (targetDeviceId) {
    try {
      return await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { ...resolution, deviceId: { exact: targetDeviceId } },
      });
    } catch {
      // Si falla con exact deviceId, continuar con fallback general
    }
  }

  try {
    return await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: { ...resolution, facingMode: { exact: "environment" } },
    });
  } catch (error) {
    const name = errorName(error);
    if (name === "OverconstrainedError" || name === "NotFoundError") {
      try {
        // Las PC y algunos navegadores no etiquetan la orientación de su cámara.
        return await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { ...resolution, facingMode: { ideal: "environment" } },
        });
      } catch {
        return await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: true,
        });
      }
    }
    throw error;
  }
}

async function preferContinuousFocus(track: MediaStreamTrack) {
  type FocusCapabilities = MediaTrackCapabilities & { focusMode?: string[] };
  type FocusConstraints = MediaTrackConstraints & { focusMode?: string };

  try {
    const capabilities = track.getCapabilities?.() as FocusCapabilities | undefined;
    if (!capabilities?.focusMode?.includes("continuous")) return;

    await track.applyConstraints({
      ...track.getConstraints(),
      advanced: [{ focusMode: "continuous" } as FocusConstraints],
    });
  } catch {
    // El enfoque es una mejora opcional y varía entre navegadores Android.
  }
}

type Callbacks = {
  onResult: (result: ScanResult) => void;
  onReady: () => void;
  onError: (message: string) => void;
  onCamerasFound?: (cameras: MediaDeviceInfo[]) => void;
  onTorchSupported?: (supported: boolean) => void;
};

/** Una instancia por montaje. El token invalida permisos/importaciones pendientes. */
export class CameraSession {
  private generation = 0;
  private stream: MediaStream | null = null;
  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor(
    private video: HTMLVideoElement,
    private callbacks: Callbacks,
    private loadDecoder: () => Promise<Decoder> = createDecoder,
  ) {}

  stop() {
    ++this.generation;
    clearTimeout(this.timer);
    this.stream?.getTracks().forEach((track) => {
      track.onended = null;
      track.stop();
    });
    this.stream = null;
    this.video.srcObject = null;
  }

  async toggleTorch(enable: boolean): Promise<boolean> {
    if (this.stream) {
      const track = this.stream.getVideoTracks()[0];
      if (track && typeof (track as any).applyConstraints === "function") {
        try {
          await (track as any).applyConstraints({
            advanced: [{ torch: enable }],
          });
          return true;
        } catch (err) {
          console.warn("No se pudo alternar la linterna:", err);
          this.callbacks.onTorchSupported?.(false);
          return false;
        }
      }
    }
    return false;
  }

  getActiveTrack(): MediaStreamTrack | null {
    return this.stream?.getVideoTracks()[0] || null;
  }

  async start(deviceId?: string) {
    this.stop();
    const token = this.generation;
    const current = () => token === this.generation;

    if (!window.isSecureContext) {
      this.callbacks.onError("Para usar la cámara, abrí http://localhost:3000 en esta computadora o una dirección HTTPS confiable. Una IP de la red por HTTP no habilita la cámara.");
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      this.callbacks.onError("Este navegador no ofrece acceso a la cámara. Probá en una versión actual de Chrome, Edge, Firefox o Safari.");
      return;
    }

    try {
      const stream = await requestCamera(deviceId);
      if (!current()) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      this.stream = stream;

      const firstTrack = stream.getVideoTracks()[0];
      if (firstTrack) {
        await preferContinuousFocus(firstTrack);
      }

      // Verificación de linterna basada en capacidades reales del hardware
      const checkTorch = () => {
        if (!current() || !this.stream) return;
        const track = this.stream.getVideoTracks()[0];
        if (!track) return;

        let supported = false;
        if (typeof (track as any).getCapabilities === "function") {
          try {
            const caps = (track as any).getCapabilities();
            if (caps && Boolean(caps.torch)) {
              supported = true;
            }
          } catch {}
        }

        this.callbacks.onTorchSupported?.(supported);
      };

      checkTorch();

      if (!current()) return;

      for (const track of stream.getVideoTracks()) {
        track.onended = () => {
          if (!current()) return;
          this.stop();
          this.callbacks.onError("La cámara se desconectó o el permiso fue revocado. Volvé a activarla para continuar.");
        };
      }

      this.video.srcObject = stream;
      await this.video.play();
      if (!current()) return;

      // Re-verificar linterna tras iniciar reproducción de video (necesario en Android Chrome)
      checkTorch();
      setTimeout(checkTorch, 400);

      // Enumerar cámaras si el callback fue provisto
      if (this.callbacks.onCamerasFound && navigator.mediaDevices.enumerateDevices) {
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const videoDevices = devices.filter((d) => d.kind === "videoinput");
          this.callbacks.onCamerasFound(videoDevices);

          // Si inició sin deviceId explícito, verificar si la cámara abierta no es Camera 0
          if (!deviceId) {
            const preferredId = await findPreferredCameraId();
            const currentTrack = stream.getVideoTracks()[0];
            const currentId = currentTrack?.getSettings?.().deviceId;
            if (preferredId && currentId && preferredId !== currentId) {
              void this.start(preferredId);
              return;
            }
          }
        } catch {}
      }

      const decode = await this.loadDecoder();
      if (!current()) return;
      this.callbacks.onReady();

      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) throw new Error("Canvas 2D no disponible");
      context.imageSmoothingEnabled = false;

      let lastKey = "";
      let lastSeen = 0;
      let candidateKey = "";
      let candidateCount = 0;
      let candidateSeen = 0;
      let capturedFrames = 0;

      const scan = async () => {
        if (!current()) return;
        try {
          if (this.video.readyState >= 2 && this.video.videoWidth > 0) {
            const sourceWidth = this.video.videoWidth;
            const sourceHeight = this.video.videoHeight;
            const cropModes = [
              { width: 1, height: 1 },
              { width: 0.88, height: 0.72 },
              { width: 0.7, height: 0.5 },
            ];
            const crop = cropModes[capturedFrames++ % cropModes.length];
            const cropWidth = Math.round(sourceWidth * crop.width);
            const cropHeight = Math.round(sourceHeight * crop.height);
            const cropX = Math.round((sourceWidth - cropWidth) / 2);
            const cropY = Math.round((sourceHeight - cropHeight) / 2);
            const scale = Math.min(1, 1280 / cropWidth);
            canvas.width = Math.max(1, Math.round(cropWidth * scale));
            canvas.height = Math.max(1, Math.round(cropHeight * scale));
            context.drawImage(this.video, cropX, cropY, cropWidth, cropHeight, 0, 0, canvas.width, canvas.height);
            const result = await decode(canvas);
            if (result) {
              const key = `${result.format}:${result.text}`;
              const now = Date.now();
              if (key === candidateKey && now - candidateSeen <= 1800) {
                candidateCount += 1;
              } else {
                candidateKey = key;
                candidateCount = 1;
              }
              candidateSeen = now;

              if (candidateCount >= 2 && key !== lastKey) {
                this.callbacks.onResult(result);
                lastKey = key;
                candidateCount = 0;
              }
              lastSeen = now;
            } else if (Date.now() - candidateSeen > 1800) {
              candidateKey = "";
              candidateCount = 0;
              if (Date.now() - lastSeen > 2000) lastKey = "";
            }
          }
          this.timer = setTimeout(scan, 200);
        } catch (error) {
          if (!current()) return;
          this.stop();
          this.callbacks.onError(cameraError(error));
        }
      };
      scan();
    } catch (error) {
      if (!current()) return;
      this.stop();
      this.callbacks.onError(cameraError(error));
    }
  }
}
