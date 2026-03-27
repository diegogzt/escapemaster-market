export const DEFAULT_ROOM_IMAGES: string[] = [
  '/images/covers/asylum_horror_1772694144449.png',
  '/images/covers/bank_vault_1772694283668.png',
  '/images/covers/cyberpunk_scifi_1772694166451.png',
  '/images/covers/detective_mystery_1772694217318.png',
  '/images/covers/tomb_adventure_1772694231604.png',
  '/images/covers/wizard_magic_1772694309772.png',
  'https://images.unsplash.com/photo-1558230230-6abe881e18cd?auto=format&fit=crop&w=1200&q=80', // dark forest
  'https://images.unsplash.com/photo-1541624890606-5fc71ea2fe1d?auto=format&fit=crop&w=1200&q=80', // abandoned building
  'https://images.unsplash.com/photo-1620888204653-a55e1cdae0ab?auto=format&fit=crop&w=1200&q=80', // locked door
  'https://images.unsplash.com/photo-1518774780287-3d149ff92d3b?auto=format&fit=crop&w=1200&q=80', // neon cyberpunk alley
];

const hashSeed = (seed: string): number => {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
};

export const getDefaultRoomImage = (seed: string | number): string => {
  const normalizedSeed = String(seed || 'room-default');
  const hashed = hashSeed(normalizedSeed);
  return DEFAULT_ROOM_IMAGES[hashed % DEFAULT_ROOM_IMAGES.length];
};

export const getDefaultRoomGallery = (seed: string | number): string[] => {
  const normalizedSeed = String(seed || 'room-default');
  const hashed = hashSeed(normalizedSeed);
  const offset = hashed % DEFAULT_ROOM_IMAGES.length;

  return DEFAULT_ROOM_IMAGES.map((_, index) =>
    DEFAULT_ROOM_IMAGES[(index + offset) % DEFAULT_ROOM_IMAGES.length],
  );
};
