export const uid = () => Math.random().toString(36).slice(2, 9);
export const calcHattricks = (goals: number | string) => Math.floor((Number(goals) || 0) / 3);
export const initials = (n = '') => n.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

const AVATAR_COLORS = ['#1a1a1a', '#333333', '#ec4899', '#f59e0b', '#10b981', '#222222', '#ef4444', '#444444'];
export const avatarColor = (n = '') => AVATAR_COLORS[n.charCodeAt(0) % AVATAR_COLORS.length];

export const parseTags = (raw: string | string[]) => 
  typeof raw === 'string' ? raw.split(',').map(t => t.trim()).filter(Boolean) : raw ?? [];

export const sumField = <T>(arr: T[], field: keyof T): number => {
  return arr.reduce((acc, item) => acc + (Number(item[field]) || 0), 0);
};

export const fuzzyFilter = <T>(arr: T[], query: string, fields: (keyof T)[]): T[] => {
  if (!query) return arr;
  const s = query.toLowerCase();
  return arr.filter(item => 
    fields.some(field => String(item[field] ?? '').toLowerCase().includes(s))
  );
};

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    // If it's not an image, fallback to normal reader
    if (!file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
      return;
    }

    // For images, resize to max 256x256 using Canvas
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl); // Clean up memory
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 256;
      const MAX_HEIGHT = 256;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height;
          height = MAX_HEIGHT;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        // Compress as JPEG to massively reduce size (quality 0.8)
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      } else {
        // Fallback if canvas context fails
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
      }
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image for resizing'));
    };
    
    img.src = objectUrl;
  });
};
