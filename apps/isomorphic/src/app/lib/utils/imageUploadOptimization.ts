type PreparedImageUpload = {
  file: File;
  originalFile: File;
  optimized: boolean;
  originalSize: number;
  optimizedSize: number;
  width: number | null;
  height: number | null;
  originalWidth: number | null;
  originalHeight: number | null;
  format: string;
};

type PrepareImageOptions = {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  minSavingsRatio?: number;
  allowedMimeTypes?: string[];
  resizeMode?: 'contain' | 'cover';
};

const SUPPORTED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

const DEFAULT_MAX_WIDTH = 1280;
const DEFAULT_MAX_HEIGHT = 1280;
const DEFAULT_QUALITY = 0.82;

const canvasToBlob = (
  canvas: HTMLCanvasElement,
  type: string,
  quality: number
) =>
  new Promise<Blob | null>((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, quality);
  });

const getImageBitmap = async (file: File) => {
  if (typeof createImageBitmap === 'function') {
    return createImageBitmap(file, { imageOrientation: 'from-image' });
  }

  const url = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
    return image;
  } finally {
    URL.revokeObjectURL(url);
  }
};

const resolveTargetSize = ({
  width,
  height,
  maxWidth,
  maxHeight,
  resizeMode = 'contain',
}: {
  width: number;
  height: number;
  maxWidth: number;
  maxHeight: number;
  resizeMode?: 'contain' | 'cover';
}) => {
  if (resizeMode === 'cover') {
    return {
      width: Math.max(1, Math.round(maxWidth)),
      height: Math.max(1, Math.round(maxHeight)),
    };
  }

  const scale = Math.min(1, maxWidth / width, maxHeight / height);
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
};

const extensionMimeMap: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};

const normalizeAcceptedMimeTypes = (allowedMimeTypes: string[] = []) =>
  allowedMimeTypes
    .map((entry) => String(entry || '').trim().toLowerCase())
    .filter(Boolean)
    .map((entry) => extensionMimeMap[entry] || entry);

const acceptsMimeType = (mimeType: string, acceptedMimeTypes: string[]) => {
  if (acceptedMimeTypes.length === 0) return true;
  if (acceptedMimeTypes.includes('*/*')) return true;
  if (acceptedMimeTypes.includes(mimeType)) return true;

  return acceptedMimeTypes.some((entry) => {
    if (!entry.endsWith('/*')) return false;
    return mimeType.startsWith(entry.slice(0, -1));
  });
};

const getOutputType = (file: File, allowedMimeTypes: string[] = []) => {
  const originalType = String(file.type || '').toLowerCase();
  const acceptedMimeTypes = normalizeAcceptedMimeTypes(allowedMimeTypes);
  const webpAllowed = acceptsMimeType('image/webp', acceptedMimeTypes);

  if (
    webpAllowed &&
    (originalType === 'image/png' || originalType === 'image/webp')
  ) {
    return 'image/webp';
  }

  if (acceptsMimeType(originalType, acceptedMimeTypes)) {
    return originalType || 'image/jpeg';
  }

  if (acceptsMimeType('image/jpeg', acceptedMimeTypes)) return 'image/jpeg';
  if (acceptsMimeType('image/png', acceptedMimeTypes)) return 'image/png';
  if (webpAllowed) return 'image/webp';

  return originalType || 'image/jpeg';
};

const getOptimizedFileName = (fileName: string, mimeType: string) => {
  const extension =
    mimeType === 'image/webp' ? 'webp' : mimeType === 'image/png' ? 'png' : 'jpg';
  const base = String(fileName || 'upload')
    .replace(/\.[a-zA-Z0-9]+$/, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return `${base || 'upload'}.${extension}`;
};

const drawSourceToCanvas = ({
  source,
  originalWidth,
  originalHeight,
  targetWidth,
  targetHeight,
  resizeMode,
}: {
  source: CanvasImageSource;
  originalWidth: number;
  originalHeight: number;
  targetWidth: number;
  targetHeight: number;
  resizeMode: 'contain' | 'cover';
}) => {
  const sourceCanvas = document.createElement('canvas');

  if (resizeMode === 'cover') {
    const targetRatio = targetWidth / targetHeight;
    const originalRatio = originalWidth / originalHeight;
    let cropWidth = originalWidth;
    let cropHeight = originalHeight;
    let cropX = 0;
    let cropY = 0;

    if (originalRatio > targetRatio) {
      cropWidth = Math.round(originalHeight * targetRatio);
      cropX = Math.round((originalWidth - cropWidth) / 2);
    } else if (originalRatio < targetRatio) {
      cropHeight = Math.round(originalWidth / targetRatio);
      cropY = Math.round((originalHeight - cropHeight) / 2);
    }

    sourceCanvas.width = cropWidth;
    sourceCanvas.height = cropHeight;
    const sourceContext = sourceCanvas.getContext('2d');
    if (!sourceContext) return null;
    sourceContext.drawImage(
      source,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      cropWidth,
      cropHeight
    );
    return sourceCanvas;
  }

  sourceCanvas.width = originalWidth;
  sourceCanvas.height = originalHeight;
  const sourceContext = sourceCanvas.getContext('2d');
  if (!sourceContext) return null;
  sourceContext.drawImage(source, 0, 0);
  return sourceCanvas;
};

export const prepareImageForUpload = async (
  file: File,
  options: PrepareImageOptions = {}
): Promise<PreparedImageUpload> => {
  const originalSize = file.size;
  const fallback = {
    file,
    originalFile: file,
    optimized: false,
    originalSize,
    optimizedSize: originalSize,
    width: null,
    height: null,
    originalWidth: null,
    originalHeight: null,
    format: file.type || 'application/octet-stream',
  };

  if (
    typeof window === 'undefined' ||
    !SUPPORTED_IMAGE_TYPES.has(String(file.type || '').toLowerCase())
  ) {
    return fallback;
  }

  try {
    const source = await getImageBitmap(file);
    const originalWidth = Number(source.width || 0);
    const originalHeight = Number(source.height || 0);

    if (!originalWidth || !originalHeight) return fallback;

    const resizeMode = options.resizeMode || 'contain';
    const target = resolveTargetSize({
      width: originalWidth,
      height: originalHeight,
      maxWidth: options.maxWidth || DEFAULT_MAX_WIDTH,
      maxHeight: options.maxHeight || DEFAULT_MAX_HEIGHT,
      resizeMode,
    });

    const sourceCanvas = drawSourceToCanvas({
      source,
      originalWidth,
      originalHeight,
      targetWidth: target.width,
      targetHeight: target.height,
      resizeMode,
    });
    if (!sourceCanvas) return fallback;

    const targetCanvas = document.createElement('canvas');
    targetCanvas.width = target.width;
    targetCanvas.height = target.height;

    const picaModule = await import('pica');
    const createPica = (picaModule.default || picaModule) as any;
    const pica = createPica();
    await pica.resize(sourceCanvas, targetCanvas, {
      quality: 3,
      alpha: file.type === 'image/png',
    });

    const outputType = getOutputType(file, options.allowedMimeTypes);
    const blob = await canvasToBlob(
      targetCanvas,
      outputType,
      options.quality || DEFAULT_QUALITY
    );

    if (!blob || blob.size <= 0) {
      return {
        ...fallback,
        width: originalWidth,
        height: originalHeight,
        originalWidth,
        originalHeight,
      };
    }

    const minSavingsRatio = options.minSavingsRatio ?? 0.92;
    const shouldUseOptimized =
      resizeMode === 'cover' ||
      target.width < originalWidth ||
      target.height < originalHeight ||
      blob.size < originalSize * minSavingsRatio;

    if (!shouldUseOptimized) {
      return {
        ...fallback,
        width: originalWidth,
        height: originalHeight,
        originalWidth,
        originalHeight,
      };
    }

    const optimizedFile = new File(
      [blob],
      getOptimizedFileName(file.name, outputType),
      {
        type: outputType,
        lastModified: Date.now(),
      }
    );

    return {
      file: optimizedFile,
      originalFile: file,
      optimized: true,
      originalSize,
      optimizedSize: optimizedFile.size,
      width: target.width,
      height: target.height,
      originalWidth,
      originalHeight,
      format: outputType,
    };
  } catch {
    return fallback;
  }
};
