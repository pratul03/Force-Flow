type ProcessImageOptions = {
  cropSquare?: boolean;
  maxWidth: number;
  maxHeight: number;
  quality: number;
  outputType?: 'image/webp' | 'image/jpeg';
};

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    image.src = url;
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  outputType: string,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Failed to process image'));
          return;
        }

        resolve(blob);
      },
      outputType,
      quality,
    );
  });
}

function getTargetDimensions(
  sourceWidth: number,
  sourceHeight: number,
  maxWidth: number,
  maxHeight: number,
) {
  const widthRatio = maxWidth / sourceWidth;
  const heightRatio = maxHeight / sourceHeight;
  const scale = Math.min(1, widthRatio, heightRatio);

  return {
    width: Math.max(1, Math.round(sourceWidth * scale)),
    height: Math.max(1, Math.round(sourceHeight * scale)),
  };
}

export async function processImageBeforeUpload(
  file: File,
  options: ProcessImageOptions,
): Promise<File> {
  if (typeof window === 'undefined' || !file.type.startsWith('image/')) {
    return file;
  }

  try {
    const image = await loadImage(file);

    let sourceX = 0;
    let sourceY = 0;
    let sourceWidth = image.width;
    let sourceHeight = image.height;

    if (options.cropSquare) {
      const side = Math.min(image.width, image.height);
      sourceWidth = side;
      sourceHeight = side;
      sourceX = Math.floor((image.width - side) / 2);
      sourceY = Math.floor((image.height - side) / 2);
    }

    const { width: targetWidth, height: targetHeight } = getTargetDimensions(
      sourceWidth,
      sourceHeight,
      options.maxWidth,
      options.maxHeight,
    );

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const context = canvas.getContext('2d');
    if (!context) {
      return file;
    }

    context.drawImage(
      image,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      targetWidth,
      targetHeight,
    );

    const outputType = options.outputType || 'image/webp';
    const processedBlob = await canvasToBlob(canvas, outputType, options.quality);

    const extension = outputType === 'image/jpeg' ? 'jpg' : 'webp';
    const processedFile = new File(
      [processedBlob],
      `${file.name.replace(/\.[^.]+$/, '')}.${extension}`,
      {
        type: outputType,
        lastModified: Date.now(),
      },
    );

    if (!options.cropSquare && processedFile.size >= file.size) {
      return file;
    }

    return processedFile;
  } catch {
    return file;
  }
}
