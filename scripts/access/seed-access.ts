import fs from "fs";

import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

import type { AccessGroup, FeatureAccess } from "../../src/types/accessControl";
import { accessGroupsSeed } from "./access-groups.seed";
import { featureAccessSeed } from "./feature-access.seed";

function initFirestore(): Firestore {
  const jsonEnv = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const pathEnv = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

  if (getApps().length) {
    throw new Error("Firebase app already initialized; seed script expects to control initialization.");
  }

  if (jsonEnv) {
    const parsed = JSON.parse(jsonEnv);
    initializeApp({ credential: cert(parsed) });
  } else if (pathEnv) {
    const raw = fs.readFileSync(pathEnv, "utf8");
    const parsed = JSON.parse(raw);
    initializeApp({ credential: cert(parsed) });
  } else {
    throw new Error(
      "No FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_SERVICE_ACCOUNT_PATH set; refusing to use ADC",
    );
  }

  return getFirestore();
}

async function seedCollection<T extends { id: string }>(
  db: Firestore,
  collectionName: string,
  entries: T[],
) {
  if (!entries.length) {
    console.warn(`No seed entries provided for ${collectionName}, skipping.`);
    return;
  }

  for (const entry of entries) {
    if (!entry.id) {
      console.warn(`Skipping entry without id in ${collectionName}:`, entry);
      continue;
    }

    await db.collection(collectionName).doc(entry.id).set(entry as Record<string, unknown>, {
      merge: true,
    });
  }
}

async function main() {
  const db = initFirestore();

  console.log("Seeding feature_access...");
  await seedCollection<FeatureAccess>(db, "feature_access", featureAccessSeed);
  console.log("Seeding feature_access... done.");

  console.log("Seeding access_groups...");
  await seedCollection<AccessGroup>(db, "access_groups", accessGroupsSeed);
  console.log("Seeding access_groups... done.");

  console.log("Access control seeding complete.");
}

main().catch((error) => {
  console.error("Access control seeding failed:", error);
  process.exit(1);
});
