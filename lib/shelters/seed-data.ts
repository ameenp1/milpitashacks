// Sample shelters for Santa Clara & San Francisco counties, with fake
// participants and applicants. Passwords are a single word from the name.
import type { Shelter, Participant, Applicant, Post } from "./types";

export interface SeedShelter extends Shelter {
  participants: Participant[];
  applicants: Applicant[];
}

export const SEED_SHELTERS: SeedShelter[] = [
  {
    id: "hope-village",
    name: "Hope Village",
    county: "Santa Clara",
    city: "San Jose",
    address: "1297 N First St, San Jose, CA 95112",
    phone: "(408) 555-0142",
    capacity: 60,
    description:
      "A general-purpose emergency shelter for single adults and couples. Walk-ins welcome; meals and case management included.",
    focus: ["General shelter", "Single adults"],
    password: "hope",
    participants: [
      { id: "p1", name: "Maria Gonzalez", joinedOn: "2026-04-12", bedAssignment: "A-14", caseworker: "L. Tran" },
      { id: "p2", name: "James Whitaker", joinedOn: "2026-05-02", bedAssignment: "B-07", caseworker: "L. Tran" },
      { id: "p3", name: "Aisha Rahman", joinedOn: "2026-05-21", bedAssignment: "A-03", caseworker: "D. Park" },
    ],
    applicants: [
      { id: "a1", name: "Robert Lee", appliedOn: "2026-06-09", progress: 80, needs: "Family of 3, needs ground-floor bed" },
      { id: "a2", name: "Tina Morales", appliedOn: "2026-06-11", progress: 40, needs: "ADA accessible" },
    ],
  },
  {
    id: "boccardo-center",
    name: "Boccardo Reception Center",
    county: "Santa Clara",
    city: "San Jose",
    address: "2011 Little Orchard St, San Jose, CA 95125",
    phone: "(408) 555-0188",
    capacity: 250,
    description:
      "The county's largest shelter. On-site clinic, mental-health services, and a path toward permanent supportive housing.",
    focus: ["General shelter", "Health services", "Housing placement"],
    password: "boccardo",
    participants: [
      { id: "p1", name: "Daniel Okafor", joinedOn: "2026-03-30", bedAssignment: "D-22", caseworker: "M. Rivera" },
      { id: "p2", name: "Sandra Kim", joinedOn: "2026-04-18", bedAssignment: "C-09", caseworker: "M. Rivera" },
      { id: "p3", name: "Victor Nguyen", joinedOn: "2026-05-27", bedAssignment: "E-31", caseworker: "S. Cole" },
      { id: "p4", name: "Grace Adeyemi", joinedOn: "2026-06-01", bedAssignment: "C-15", caseworker: "S. Cole" },
    ],
    applicants: [
      { id: "a1", name: "Marcus Bell", appliedOn: "2026-06-10", progress: 55, needs: "Veteran, PTSD support" },
      { id: "a2", name: "Lucia Fernandes", appliedOn: "2026-06-12", progress: 20, needs: "Pregnant, due August" },
      { id: "a3", name: "Omar Said", appliedOn: "2026-06-12", progress: 90, needs: "Single adult" },
    ],
  },
  {
    id: "gilroy-compassion",
    name: "Gilroy Compassion Center",
    county: "Santa Clara",
    city: "Gilroy",
    address: "370 Tomkins Ct, Gilroy, CA 95020",
    phone: "(408) 555-0211",
    capacity: 45,
    description:
      "Employment-focused shelter for adults ready to work. On-site job training, resume help, and partnerships with local employers.",
    focus: ["Job assistance", "Job training", "Single adults"],
    password: "gilroy",
    participants: [
      { id: "p1", name: "Hector Ramirez", joinedOn: "2026-05-05", bedAssignment: "1-02", caseworker: "A. Flores" },
      { id: "p2", name: "Nadia Patel", joinedOn: "2026-05-19", bedAssignment: "1-08", caseworker: "A. Flores" },
    ],
    applicants: [
      { id: "a1", name: "Brian Choi", appliedOn: "2026-06-08", progress: 65, needs: "Day-labor schedule, late check-in" },
    ],
  },
  {
    id: "sunnyvale-haven",
    name: "Sunnyvale Safe Haven",
    county: "Santa Clara",
    city: "Sunnyvale",
    address: "1313 N Mathilda Ave, Sunnyvale, CA 94089",
    phone: "(408) 555-0276",
    capacity: 80,
    description:
      "Assisted-living shelter for seniors and adults with disabilities. Accessible rooms, on-site nursing, and daily living support.",
    focus: ["Assisted living", "Seniors", "Accessible"],
    password: "sunnyvale",
    participants: [
      { id: "p1", name: "Evelyn Carter", joinedOn: "2026-04-22", bedAssignment: "F-11", caseworker: "J. Singh" },
      { id: "p2", name: "Tomas Herrera", joinedOn: "2026-05-30", bedAssignment: "F-04", caseworker: "J. Singh" },
      { id: "p3", name: "Priya Desai", joinedOn: "2026-06-03", bedAssignment: "G-18", caseworker: "R. Owens" },
    ],
    applicants: [
      { id: "a1", name: "Kevin Walsh", appliedOn: "2026-06-11", progress: 35, needs: "Single adult, employed" },
      { id: "a2", name: "Fatima Noor", appliedOn: "2026-06-12", progress: 75, needs: "Mother with 2 kids" },
    ],
  },
  {
    id: "hamilton-families",
    name: "Hamilton Families",
    county: "San Francisco",
    city: "San Francisco",
    address: "1631 Hayes St, San Francisco, CA 94117",
    phone: "(415) 555-0319",
    capacity: 120,
    description:
      "Family shelter for parents with children. Private rooms, childcare, after-school programs, and rapid re-housing support.",
    focus: ["Families", "Children", "Housing placement"],
    password: "hamilton",
    participants: [
      { id: "p1", name: "Andre Jackson", joinedOn: "2026-03-15", bedAssignment: "2-A", caseworker: "P. Mendez" },
      { id: "p2", name: "Wei Chen", joinedOn: "2026-04-09", bedAssignment: "2-C", caseworker: "P. Mendez" },
      { id: "p3", name: "Rosa Delgado", joinedOn: "2026-05-12", bedAssignment: "3-B", caseworker: "T. Howard" },
    ],
    applicants: [
      { id: "a1", name: "Sophia Russo", appliedOn: "2026-06-10", progress: 50, needs: "Family of 4" },
      { id: "a2", name: "Idris Mohammed", appliedOn: "2026-06-12", progress: 25, needs: "Newly arrived, needs ESL" },
    ],
  },
  {
    id: "msc-south",
    name: "MSC South Shelter",
    county: "San Francisco",
    city: "San Francisco",
    address: "525 5th St, San Francisco, CA 94107",
    phone: "(415) 555-0364",
    capacity: 340,
    description:
      "Large 24-hour shelter for single adults. Reservations and drop-in beds, hot meals, showers, and benefits enrollment.",
    focus: ["General shelter", "Single adults", "24-hour"],
    password: "msc",
    participants: [
      { id: "p1", name: "Gerald Foster", joinedOn: "2026-02-28", bedAssignment: "L1-58", caseworker: "K. Boyd" },
      { id: "p2", name: "Linda Pham", joinedOn: "2026-04-14", bedAssignment: "L2-12", caseworker: "K. Boyd" },
      { id: "p3", name: "Samuel Ortiz", joinedOn: "2026-05-25", bedAssignment: "L2-44", caseworker: "N. Reyes" },
      { id: "p4", name: "Helen Wu", joinedOn: "2026-06-02", bedAssignment: "L1-09", caseworker: "N. Reyes" },
    ],
    applicants: [
      { id: "a1", name: "Frank Doyle", appliedOn: "2026-06-09", progress: 70, needs: "Wheelchair user" },
      { id: "a2", name: "Amara Bello", appliedOn: "2026-06-11", progress: 45, needs: "Single adult" },
      { id: "a3", name: "Jorge Vega", appliedOn: "2026-06-12", progress: 15, needs: "Just lost housing" },
    ],
  },
  {
    id: "next-door",
    name: "Next Door Shelter",
    county: "San Francisco",
    city: "San Francisco",
    address: "1001 Polk St, San Francisco, CA 94109",
    phone: "(415) 555-0402",
    capacity: 270,
    description:
      "Shelter for women and transgender adults, with a focus on safety. Trauma-informed care and domestic-violence support.",
    focus: ["Women", "Trauma-informed", "Safety"],
    password: "nextdoor",
    participants: [
      { id: "p1", name: "Carla Jensen", joinedOn: "2026-04-01", bedAssignment: "N-77", caseworker: "B. Aziz" },
      { id: "p2", name: "Michael Brooks", joinedOn: "2026-05-08", bedAssignment: "N-33", caseworker: "B. Aziz" },
    ],
    applicants: [
      { id: "a1", name: "Renee Dubois", appliedOn: "2026-06-10", progress: 60, needs: "Domestic violence survivor" },
      { id: "a2", name: "Hassan Ali", appliedOn: "2026-06-12", progress: 30, needs: "Single adult, employed nights" },
    ],
  },
  {
    id: "providence",
    name: "Providence Shelter",
    county: "San Francisco",
    city: "San Francisco",
    address: "1601 McKinnon Ave, San Francisco, CA 94124",
    phone: "(415) 555-0457",
    capacity: 100,
    description:
      "Faith-based shelter for older adults needing extra care. Light assisted-living support, meals, and medical coordination.",
    focus: ["Assisted living", "Seniors", "General shelter"],
    password: "providence",
    participants: [
      { id: "p1", name: "Dorothy Sims", joinedOn: "2026-03-22", bedAssignment: "P-05", caseworker: "C. Nava" },
      { id: "p2", name: "Anthony Russo", joinedOn: "2026-05-16", bedAssignment: "P-12", caseworker: "C. Nava" },
      { id: "p3", name: "Mei Lin", joinedOn: "2026-06-04", bedAssignment: "P-21", caseworker: "C. Nava" },
    ],
    applicants: [
      { id: "a1", name: "Paul Greer", appliedOn: "2026-06-11", progress: 85, needs: "Senior, mobility limited" },
    ],
  },
];

// Sample community-feed posts. createdAt is fixed so ordering is stable.
const day = (iso: string) => new Date(iso + "T09:00:00").getTime();

export const SEED_POSTS: (Post & { id: string })[] = [
  {
    id: "post-gilroy-jobfair",
    shelterId: "gilroy-compassion",
    shelterName: "Gilroy Compassion Center",
    county: "Santa Clara",
    title: "On-site Job Fair — 12 employers hiring",
    body: "Bring your ID. Warehouse, food service, and landscaping roles. Resume help available all morning, and we'll have free coffee and lunch.",
    eventDate: "2026-06-20",
    createdAt: day("2026-06-11"),
  },
  {
    id: "post-boccardo-clinic",
    shelterId: "boccardo-center",
    shelterName: "Boccardo Reception Center",
    county: "Santa Clara",
    title: "Free dental clinic this Saturday",
    body: "Mobile dental van will be in the parking lot from 9am to 3pm. Cleanings and basic care, no appointment needed. Open to anyone, not just residents.",
    eventDate: "2026-06-14",
    createdAt: day("2026-06-10"),
  },
  {
    id: "post-hamilton-backpacks",
    shelterId: "hamilton-families",
    shelterName: "Hamilton Families",
    county: "San Francisco",
    title: "Back-to-school backpack giveaway",
    body: "Free backpacks and school supplies for kids K–12. Families welcome from any shelter. While supplies last.",
    eventDate: "2026-06-28",
    createdAt: day("2026-06-12"),
  },
  {
    id: "post-msc-meals",
    shelterId: "msc-south",
    shelterName: "MSC South Shelter",
    county: "San Francisco",
    title: "Extended dinner hours starting this week",
    body: "We're now serving hot dinner until 8pm every night. Showers and laundry also available for drop-in guests.",
    createdAt: day("2026-06-09"),
  },
  {
    id: "post-sunnyvale-health",
    shelterId: "sunnyvale-haven",
    shelterName: "Sunnyvale Safe Haven",
    county: "Santa Clara",
    title: "Free blood-pressure & flu shot day",
    body: "County nurses on site for seniors and anyone who'd like a checkup. Wheelchair accessible. No insurance required.",
    eventDate: "2026-06-18",
    createdAt: day("2026-06-08"),
  },
];
