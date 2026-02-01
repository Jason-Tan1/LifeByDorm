/**
 * Image compression utility for client-side image optimization.
 * Reduces image file size before upload to improve loading times.
 */

interface CompressOptions {
    /** Maximum width in pixels (default: 1200) */
    maxWidth?: number;
    /** Maximum height in pixels (default: 1200) */
    maxHeight?: number;
    /** JPEG quality from 0 to 1 (default: 0.8) */
    quality?: number;
    /** Output format (default: 'image/jpeg') */
    outputType?: 'image/jpeg' | 'image/webp';
}

/**
 * Compresses an image file to reduce file size while maintaining reasonable quality.
 * 
 * @param file - The image file to compress
 * @param options - Compression options
 * @returns Promise resolving to a base64 data URL of the compressed image
 */
export async function compressImage(
    file: File,
    options: CompressOptions = {}
): Promise<string> {
    const {
        maxWidth = 1200,
        maxHeight = 1200,
        quality = 0.8,
        outputType = 'image/jpeg'
    } = options;

    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (event) => {
            const img = new Image();

            img.onload = () => {
                // Calculate new dimensions while maintaining aspect ratio
                let { width, height } = img;

                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }

                if (height > maxHeight) {
                    width = (width * maxHeight) / height;
                    height = maxHeight;
                }

                // Create canvas and draw resized image
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Failed to get canvas context'));
                    return;
                }

                // Use high-quality image smoothing
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, 0, 0, width, height);

                // Convert to compressed data URL
                const compressedDataUrl = canvas.toDataURL(outputType, quality);
                resolve(compressedDataUrl);
            };

            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = event.target?.result as string;
        };

        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
    });
}

/**
 * Compresses multiple image files in parallel.
 * 
 * @param files - Array of image files to compress
 * @param options - Compression options applied to all images
 * @returns Promise resolving to array of base64 data URLs
 */
export async function compressImages(
    files: File[],
    options: CompressOptions = {}
): Promise<string[]> {
    return Promise.all(files.map(file => compressImage(file, options)));
}
