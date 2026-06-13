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
  password: string; // demo login code (single word). NOT secure — demo only.
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
}
