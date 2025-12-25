/**
 * useImageDownloader Hook
 * Direct canvas-based download with plan-based watermarking
 */

import { useState } from 'react';
import { UserPlan } from '../store/useAppStore';

export function useImageDownloader() {
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const downloadImage = async (imageUrl: string, userPlan: UserPlan) => {
    try {
      setIsDownloading(true);
      setError(null);

      // Create canvas with standard dimensions
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1080;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Canvas context not available');
      }

      // Load image
      const img = await loadImage(imageUrl);

      // Draw image to canvas (cover fit)
      drawImageCover(ctx, img, canvas.width, canvas.height);

      // Apply watermark for FREE users
      if (userPlan === 'FREE') {
        applyWatermark(ctx, canvas.width, canvas.height);
      }

      // Download directly as blob
      await downloadCanvas(canvas, 'emprata_resultado.jpg');

    } catch (err: any) {
      console.error('Download error:', err);
      setError('Erro ao baixar imagem. Tente novamente.');
      throw err;
    } finally {
      setIsDownloading(false);
    }
  };

  return { downloadImage, isDownloading, error };
}

/**
 * Load image from URL with CORS support
 */
function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = url;
  });
}

/**
 * Draw image with object-fit: cover behavior
 */
function drawImageCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  width: number,
  height: number
) {
  const imgRatio = img.width / img.height;
  const canvasRatio = width / height;

  let sourceX = 0;
  let sourceY = 0;
  let sourceWidth = img.width;
  let sourceHeight = img.height;

  if (imgRatio > canvasRatio) {
    sourceWidth = img.height * canvasRatio;
    sourceX = (img.width - sourceWidth) / 2;
  } else {
    sourceHeight = img.width / canvasRatio;
    sourceY = (img.height - sourceHeight) / 2;
  }

  ctx.drawImage(
    img,
    sourceX, sourceY, sourceWidth, sourceHeight,
    0, 0, width, height
  );
}

/**
 * Apply FREE watermark - Center rotated text + corner logo
 */
function applyWatermark(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) {
  // CENTER WATERMARK: Rotated text
  ctx.save();
  
  // Move to center and rotate
  ctx.translate(width / 2, height / 2);
  ctx.rotate(-Math.PI / 4); // 45 degrees
  
  // Configure text style
  ctx.font = 'bold 80px sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Draw center text
  ctx.fillText('EMPRATA.AI - FREE', 0, 0);
  
  ctx.restore();

  // CORNER LOGO: Bottom-right
  ctx.save();
  
  const logoSize = 40;
  const padding = 30;
  
  ctx.font = `bold ${logoSize}px sans-serif`;
  ctx.fillStyle = 'rgba(255, 94, 0, 0.6)'; // Orange brand color
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.lineWidth = 3;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';
  
  const logoText = 'Emprata.ai';
  ctx.strokeText(logoText, width - padding, height - padding);
  ctx.fillText(logoText, width - padding, height - padding);
  
  ctx.restore();
}

/**
 * Download canvas as JPEG using blob
 */
function downloadCanvas(canvas: HTMLCanvasElement, filename: string): Promise<void> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Failed to create blob'));
          return;
        }

        // Create temporary URL
        const url = URL.createObjectURL(blob);
        
        // Create invisible link
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up
        URL.revokeObjectURL(url);
        
        resolve();
      },
      'image/jpeg',
      0.95 // High quality
    );
  });
}
