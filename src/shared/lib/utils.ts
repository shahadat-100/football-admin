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
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};
