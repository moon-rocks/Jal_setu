export interface EvidencePhotoStamp {
  wardNumber: string;
  wardName: string;
  latitude: number;
  longitude: number;
  capturedAt: string;
  reportId: string;
}

export function stampEvidencePhoto(file: File, stamp: EvidencePhotoStamp): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const imageUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(imageUrl);
      try {
        const canvas = document.createElement('canvas');
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;

        const context = canvas.getContext('2d');
        if (!context) throw new Error('Unable to prepare the evidence photo stamp.');

        context.drawImage(image, 0, 0);
        const fontSize = Math.max(14, Math.round(canvas.width * 0.025));
        const lineHeight = Math.round(fontSize * 1.45);
        const padding = Math.round(fontSize * 0.8);
        const lines = [
          'JalSetu',
          `Ward ${stamp.wardNumber} - ${stamp.wardName}`,
          `GPS ${stamp.latitude.toFixed(6)}, ${stamp.longitude.toFixed(6)}`,
          `Captured ${new Date(stamp.capturedAt).toLocaleString()}`,
          `Report ID ${stamp.reportId}`,
        ];
        const panelHeight = padding * 2 + lineHeight * lines.length;
        const panelTop = canvas.height - panelHeight;

        context.fillStyle = 'rgba(2, 6, 23, 0.78)';
        context.fillRect(0, panelTop, canvas.width, panelHeight);
        context.textBaseline = 'top';
        context.font = `600 ${fontSize}px sans-serif`;
        context.fillStyle = '#ffffff';
        lines.forEach((line, index) => {
          context.fillText(line, padding, panelTop + padding + lineHeight * index, canvas.width - padding * 2);
        });

        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Unable to encode the stamped evidence photo.'));
          }
        }, 'image/jpeg', 0.92);
      } catch (error) {
        reject(error instanceof Error ? error : new Error('Unable to stamp the evidence photo.'));
      }
    };

    image.onerror = () => {
      URL.revokeObjectURL(imageUrl);
      reject(new Error('Unable to read one of the selected evidence photos.'));
    };

    image.src = imageUrl;
  });
}
