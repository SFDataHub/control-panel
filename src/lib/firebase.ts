import type { Firestore } from "firebase/firestore";
import { getFirestore } from "firebase/firestore";

/**
 * TODO: Replace this stub with the real Firebase app initialisation.
 * We import firebase/firestore here so the module is present and ready once the
 * actual config is wired up.
 */
export const db = {} as Firestore;

// Helper so the real setup can hand in an initialised Firebase app later.
export function createFirestore(app: unknown): Firestore {
  return getFirestore(app as any);
}
