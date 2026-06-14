// Firestore access for the shelter directory. Layout:
//   shelters/{shelterId}
//   shelters/{shelterId}/participants/{id}
//   shelters/{shelterId}/applicants/{id}
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { SEED_SHELTERS, SEED_POSTS } from "./seed-data";
import type { Shelter, Participant, Applicant, Post } from "./types";

// Public fields only — never ship the password to a directory listing.
function publicShelter(s: Shelter): Omit<Shelter, "password"> {
  const { password, ...rest } = s;
  return rest;
}

// Idempotent: deterministic doc ids mean re-running overwrites instead of
// duplicating, so it is safe to call on every directory load.
async function seedIfEmpty(): Promise<void> {
  const existing = await getDocs(collection(db, "shelters"));
  if (!existing.empty) return;

  const batch = writeBatch(db);
  for (const s of SEED_SHELTERS) {
    const { participants, applicants, ...shelter } = s;
    batch.set(doc(db, "shelters", s.id), shelter);
    for (const p of participants) {
      batch.set(doc(db, "shelters", s.id, "participants", p.id), p);
    }
    for (const a of applicants) {
      batch.set(doc(db, "shelters", s.id, "applicants", a.id), a);
    }
  }
  for (const post of SEED_POSTS) {
    const { id, ...rest } = post;
    batch.set(doc(db, "posts", id), rest);
  }
  await batch.commit();
}

export async function listShelters(): Promise<Omit<Shelter, "password">[]> {
  await seedIfEmpty();
  const snap = await getDocs(collection(db, "shelters"));
  return snap.docs
    .map((d) => publicShelter(d.data() as Shelter))
    .sort((a, b) => a.county.localeCompare(b.county) || a.name.localeCompare(b.name));
}

// Verifies the password for one shelter. Returns the shelter on success.
// Demo-grade auth: plaintext compare against Firestore. Not for production.
export async function loginShelter(
  shelterId: string,
  password: string,
): Promise<Omit<Shelter, "password"> | null> {
  const snap = await getDoc(doc(db, "shelters", shelterId));
  if (!snap.exists()) return null;
  const shelter = snap.data() as Shelter;
  if (shelter.password.toLowerCase() !== password.trim().toLowerCase()) return null;
  return publicShelter(shelter);
}

export async function getShelter(
  shelterId: string,
): Promise<Omit<Shelter, "password"> | null> {
  const snap = await getDoc(doc(db, "shelters", shelterId));
  return snap.exists() ? publicShelter(snap.data() as Shelter) : null;
}

export async function getParticipants(shelterId: string): Promise<Participant[]> {
  const snap = await getDocs(collection(db, "shelters", shelterId, "participants"));
  return snap.docs.map((d) => d.data() as Participant);
}

export async function getApplicants(shelterId: string): Promise<Applicant[]> {
  const snap = await getDocs(collection(db, "shelters", shelterId, "applicants"));
  return snap.docs
    .map((d) => d.data() as Applicant)
    .sort((a, b) => b.progress - a.progress);
}

// --- Community feed -------------------------------------------------------

export async function listPosts(): Promise<Post[]> {
  await seedIfEmpty();
  const snap = await getDocs(query(collection(db, "posts"), orderBy("createdAt", "desc")));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Post, "id">) }));
}

export interface NewPost {
  title: string;
  body: string;
  eventDate?: string;
}

export async function createPost(
  shelter: Pick<Shelter, "id" | "name" | "county">,
  input: NewPost,
): Promise<Post> {
  // Firestore rejects undefined fields, so only include eventDate when set.
  const data: Omit<Post, "id"> = {
    shelterId: shelter.id,
    shelterName: shelter.name,
    county: shelter.county,
    title: input.title.trim(),
    body: input.body.trim(),
    createdAt: Date.now(),
    ...(input.eventDate ? { eventDate: input.eventDate } : {}),
  };
  const ref = await addDoc(collection(db, "posts"), data);
  return { id: ref.id, ...data };
}
