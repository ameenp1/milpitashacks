// Shapes for the homeless-shelter directory stored in Firestore.

export type County = "Santa Clara" | "San Francisco";

export interface Shelter {
  id: string; // slug, also the Firestore doc id
  name: string;
  county: County;
  city: string;
  address: string;
  phone: string;
  capacity: number;
  description: string; // who this shelter serves / what it offers
  focus: string[]; // short tags, e.g. "Job assistance", "Families"
  password: string; // demo login code (single word). NOT secure — demo only.
}

// A community-feed post made by a shelter (events, announcements).
export interface Post {
  id: string;
  shelterId: string;
  shelterName: string;
  county: County;
  title: string;
  body: string;
  eventDate?: string; // ISO date, present when the post is an event
  createdAt: number; // epoch millis, for ordering
}

export interface Participant {
  id: string;
  name: string;
  joinedOn: string; // ISO date
  bedAssignment: string;
  caseworker: string;
}

export interface Applicant {
  id: string;
  name: string;
  appliedOn: string; // ISO date
  progress: number; // 0-100 percent of application completed
  needs: string;
  status?: "in_progress" | "complete"; // present on real (synced) applicants
}
