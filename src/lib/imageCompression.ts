export const compressImage = async (file: File, targetSizeKB: number = 100, maxWidth: number = 800, maxHeight: number = 800): Promise<File> => {
  return new Promise((resolve, reject) => {
    // If the file is already small enough and is webp, just return it
    if (file.size <= targetSizeKB * 1024 && file.type === 'image/webp') {
      resolve(file);
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Scale down if needed
        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        // Draw image on canvas
        ctx.drawImage(img, 0, 0, width, height);

        let quality = 0.9;
        const targetSizeBytes = targetSizeKB * 1024;
        
        const compress = (q: number) => {
          canvas.toBlob((blob) => {
            if (!blob) {
              reject(new Error('Compression failed'));
              return;
            }
            
            // If size is good or we've reached minimum quality, return the file
            if (blob.size <= targetSizeBytes || q <= 0.1) {
              const newFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".webp", {
                type: 'image/webp',
                lastModified: Date.now(),
              });
              resolve(newFile);
            } else {
              // Otherwise, reduce quality and try again
              compress(q - 0.1);
            }
          }, 'image/webp', q);
        };
        
        compress(quality);
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};
