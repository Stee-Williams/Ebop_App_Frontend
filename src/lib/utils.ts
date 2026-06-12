import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Taux d'utilisation en %, précision adaptée aux petits montants. */
export function computeTauxUtilisation(
  consomme: number,
  alloue: number
): number {
  if (alloue <= 0) return 0;
  const taux = (consomme / alloue) * 100;
  if (taux > 0 && taux < 0.1) return Math.round(taux * 1000) / 1000;
  if (taux < 10) return Math.round(taux * 100) / 100;
  return Math.round(taux * 10) / 10;
}

/** Affichage lisible d'un taux (ex. 0,012 % ou 26,7 %). */
export function formatTauxPercent(taux: number): string {
  if (taux === 0) return "0%";
  if (taux < 0.1) return `${taux.toFixed(3).replace(".", ",")}%`;
  if (taux < 10) return `${taux.toFixed(2).replace(".", ",")}%`;
  return `${taux.toFixed(1).replace(".", ",")}%`;
}
