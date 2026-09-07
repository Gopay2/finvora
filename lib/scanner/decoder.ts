export type ScanResult = { text: string; format: string };
export type Decoder = (canvas: HTMLCanvasElement) => Promise<ScanResult | null>;

const formatNames: Record<string, string> = {
  ZBAR_EAN13: "EAN 13",
  ZBAR_EAN8: "EAN 8",
  ZBAR_UPCA: "UPC A",
  ZBAR_UPCE: "UPC E",
  ZBAR_CODE128: "CODE 128",
  ZBAR_CODE93: "CODE 93",
  ZBAR_CODE39: "CODE 39",
  ZBAR_I25: "ITF",
  ZBAR_CODABAR: "CODABAR",
  ZBAR_DATABAR: "DATABAR",
  ZBAR_DATABAR_EXP: "DATABAR EXPANDED",
  ZBAR_ISBN10: "ISBN 10",
  ZBAR_ISBN13: "ISBN 13",
};

const nativeFormatNames: Record<string, string> = {
  ean_13: "EAN 13",
  ean_8: "EAN 8",
  upc_a: "UPC A",
  upc_e: "UPC E",
  code_128: "CODE 128",
  code_93: "CODE 93",
  code_39: "CODE 39",
  itf: "ITF",
  codabar: "CODABAR",
};

type NativeBarcode = { rawValue: string; format: string };
type NativeDetector = { detect: (source: HTMLCanvasElement) => Promise<NativeBarcode[]> };
type NativeDetectorConstructor = {
  new (options: { formats: string[] }): NativeDetector;
  getSupportedFormats: () => Promise<string[]>;
};

function normalizeResult(text: string, format: string): ScanResult | null {
  text = text.trim();
  if (!text) return null;

  if (format === "EAN 13" && /^0\d{12}$/.test(text)) {
    text = text.slice(1);
    format = "UPC A";
  }

  if (["EAN 13", "EAN 8", "UPC A"].includes(format)) {
    if (!/^\d+$/.test(text)) return null;
    const digits = [...text].map(Number);
    const expected = digits.pop();
    const sum = digits.reverse().reduce(
      (total, digit, index) => total + digit * (index % 2 === 0 ? 3 : 1),
      0,
    );
    if ((10 - (sum % 10)) % 10 !== expected) return null;
  }

  return { text, format };
}

async function createNativeDecoder(): Promise<NativeDetector | null> {
  const Detector = (globalThis as typeof globalThis & { BarcodeDetector?: NativeDetectorConstructor }).BarcodeDetector;
  if (!Detector) return null;

  try {
    const supported = await Detector.getSupportedFormats();
    const formats = Object.keys(nativeFormatNames).filter((format) => supported.includes(format));
    return formats.length ? new Detector({ formats }) : null;
  } catch {
    return null;
  }
}

// ZBar se carga únicamente tras una acción del usuario. Su motor C/C++ corre
// como WebAssembly en el navegador y recibe ImageData, sin subir imágenes.
export async function createDecoder(): Promise<Decoder> {
  const [{ scanImageData }, nativeDetector] = await Promise.all([
    import("@undecaf/zbar-wasm"),
    createNativeDecoder(),
  ]);

  return async (canvas) => {
    if (nativeDetector) {
      try {
        const detected = await nativeDetector.detect(canvas);
        for (const barcode of detected) {
          const format = nativeFormatNames[barcode.format];
          if (!format) continue;
          const result = normalizeResult(barcode.rawValue, format);
          if (result) return result;
        }
      } catch {
        // ZBar sigue disponible si el detector del sistema falla en un cuadro.
      }
    }

    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("Canvas 2D no disponible");

    const symbols = await scanImageData(
      context.getImageData(0, 0, canvas.width, canvas.height),
    );

    const supported = symbols
      .filter((symbol) => formatNames[symbol.typeName])
      .sort((left, right) => right.quality - left.quality);
    const symbol = supported[0];
    if (!symbol) return null;

    return normalizeResult(symbol.decode(), formatNames[symbol.typeName]);
  };
}
