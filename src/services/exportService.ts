/**
 * Export Service
 * Enterprise-grade canvas-based image export with plan-based watermarking
 */

import { UserPlan } from '../store/useAppStore';

export type ExportFormat = 'ifood' | 'whatsapp';

export interface ExportOptions {
  imageUrl: string;
  userPlan: UserPlan;
  format: ExportFormat;
}

/**
 * Main export function - Creates canvas, applies watermark based on plan, exports optimized image
 */
export async function exportImage(options: ExportOptions): Promise<void> {
  const { imageUrl, userPlan, format } = options;

  try {
    // Create canvas with iFood standard dimensions
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Canvas context not available');
    }

    // Set canvas to iFood standard: 1080x1080
    canvas.width = 1080;
    canvas.height = 1080;

    // Load image
    const img = await loadImage(imageUrl);

    // Draw image with cover fit (fills canvas, crops if needed)
    drawImageCover(ctx, img, 0, 0, canvas.width, canvas.height);

    // Apply watermark for FREE users
    if (userPlan === 'FREE') {
      applyFreeWatermark(ctx, canvas.width, canvas.height);
    }

    // Export based on format
    if (format === 'ifood') {
      await downloadAsJPEG(canvas, 'emprata_ifood_optimized.jpg');
    } else if (format === 'whatsapp') {
      await shareToWhatsApp(canvas);
    }

  } catch (error) {
    console.error('Export error:', error);
    throw error;
  }
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
  x: number,
  y: number,
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
    // Image is wider - crop sides
    sourceWidth = img.height * canvasRatio;
    sourceX = (img.width - sourceWidth) / 2;
  } else {
    // Image is taller - crop top/bottom
    sourceHeight = img.width / canvasRatio;
    sourceY = (img.height - sourceHeight) / 2;
  }

  ctx.drawImage(
    img,
    sourceX, sourceY, sourceWidth, sourceHeight,
    x, y, width, height
  );
}

/**
 * Apply FREE tier watermark - Diagonal pattern + corner logo
 */
function applyFreeWatermark(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) {
  // Save context state
  ctx.save();

  // PATTERN 1: Diagonal repeating text (subtle but persistent)
  const fontSize = Math.floor(width / 18);
  ctx.font = `bold ${fontSize}px Arial`;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Rotate for diagonal effect
  ctx.translate(width / 2, height / 2);
  ctx.rotate(-Math.PI / 6); // -30 degrees

  const text = 'EMPRATA FREE';
  const spacing = fontSize * 3.5;

  for (let y = -height; y < height * 2; y += spacing) {
    for (let x = -width; x < width * 2; x += spacing * 2.5) {
      ctx.fillText(text, x, y);
    }
  }

  ctx.restore();

  // PATTERN 2: Corner logo (more visible, professional)
  ctx.save();
  
  const logoSize = Math.floor(width / 12);
  ctx.font = `bold ${logoSize}px Arial`;
  ctx.fillStyle = 'rgba(255, 94, 0, 0.35)'; // Orange brand color
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.lineWidth = 3;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';

  const logoText = 'Emprata.ai';
  const padding = logoSize * 0.5;
  
  // Draw with stroke for better visibility
  ctx.strokeText(logoText, width - padding, height - padding);
  ctx.fillText(logoText, width - padding, height - padding);

  ctx.restore();

  // PATTERN 3: Small "FREE" badge (top-left corner)
  ctx.save();
  
  const badgePadding = 20;
  const badgeHeight = 30;
  const badgeWidth = 100;
  
  // Background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fillRect(badgePadding, badgePadding, badgeWidth, badgeHeight);
  
  // Border
  ctx.strokeStyle = 'rgba(255, 94, 0, 0.8)';
  ctx.lineWidth = 2;
  ctx.strokeRect(badgePadding, badgePadding, badgeWidth, badgeHeight);
  
  // Text
  ctx.font = 'bold 14px Arial';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('FREE MODE', badgePadding + badgeWidth / 2, badgePadding + badgeHeight / 2);
  
  ctx.restore();
}

/**
 * Download canvas as optimized JPEG
 */
function downloadAsJPEG(canvas: HTMLCanvasElement, filename: string): Promise<void> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Failed to create blob'));
          return;
        }

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        resolve();
      },
      'image/jpeg',
      0.9 // High quality (90%)
    );
  });
}

/**
 * Share to WhatsApp using Web Share API (mobile) or fallback to download
 */
async function shareToWhatsApp(canvas: HTMLCanvasElement): Promise<void> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      async (blob) => {
        if (!blob) {
          reject(new Error('Failed to create blob'));
          return;
        }

        // Check if Web Share API is available (mobile devices)
        if (navigator.share && navigator.canShare) {
          try {
            const file = new File([blob], 'emprata_whatsapp.jpg', { type: 'image/jpeg' });
            
            if (navigator.canShare({ files: [file] })) {
              await navigator.share({
                files: [file],
                title: 'Foto Profissional - Emprata.ai',
                text: 'Confira minha foto profissional gerada com Emprata.ai!'
              });
              resolve();
              return;
            }
          } catch (err: any) {
            if (err.name !== 'AbortError') {
              console.warn('Web Share failed, falling back to download:', err);
            }
          }
        }

        // Fallback: Download the image
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'emprata_whatsapp.jpg';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        resolve();
      },
      'image/jpeg',
      0.9
    );
  });
}

/**
 * Utility: Check if device supports Web Share API
 */
export function supportsWebShare(): boolean {
  return typeof navigator.share !== 'undefined';
}
