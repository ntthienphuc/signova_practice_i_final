const gamificationAssets = import.meta.glob(
  "../assets/mascot/gamification/*.png",
  { eager: true }
) as Record<string, { default: string }>;

export function getMascotAssetUrl(filename: string): string | undefined {
  const key = `../assets/mascot/gamification/${filename}`;
  return gamificationAssets[key]?.default;
}
