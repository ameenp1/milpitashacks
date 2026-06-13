// Static directory of food banks and public transit options for the
// homeless-resident "find nearby resources" tabs. Nearby shelters come from
// the live Firestore directory instead (see lib/shelters/store).

export interface ResourcePlace {
  id: string;
  name: string;
  county: "Santa Clara" | "San Francisco";
  address: string;
  phone?: string;
  hours?: string;
  note?: string;
}

export const FOOD_BANKS: ResourcePlace[] = [
  {
    id: "second-harvest",
    name: "Second Harvest of Silicon Valley",
    county: "Santa Clara",
    address: "4001 N First St, San Jose, CA 95134",
    phone: "(800) 984-3663",
    hours: "Food line Mon–Fri 8am–5pm",
    note: "Call the food line to find a free distribution near you.",
  },
  {
    id: "sacred-heart",
    name: "Sacred Heart Community Service",
    county: "Santa Clara",
    address: "1381 South First St, San Jose, CA 95110",
    phone: "(408) 278-2160",
    hours: "Tue–Sat 9am–2pm",
    note: "Groceries, clothing, and rental assistance.",
  },
  {
    id: "west-valley",
    name: "West Valley Community Services",
    county: "Santa Clara",
    address: "10104 Vista Dr, Cupertino, CA 95014",
    phone: "(408) 255-8033",
    hours: "Mon–Fri 9am–4:30pm",
  },
  {
    id: "sf-marin",
    name: "SF-Marin Food Bank",
    county: "San Francisco",
    address: "900 Pennsylvania Ave, San Francisco, CA 94107",
    phone: "(415) 282-1900",
    hours: "Mon–Fri 9am–5pm",
    note: "Find a weekly Pop-Up Pantry near you.",
  },
  {
    id: "glide",
    name: "GLIDE Daily Free Meals",
    county: "San Francisco",
    address: "330 Ellis St, San Francisco, CA 94102",
    phone: "(415) 674-6000",
    hours: "Breakfast, lunch & dinner daily",
    note: "Three free meals a day, no questions asked.",
  },
  {
    id: "st-anthony",
    name: "St. Anthony's Dining Room",
    county: "San Francisco",
    address: "121 Golden Gate Ave, San Francisco, CA 94102",
    phone: "(415) 592-2710",
    hours: "Lunch daily 11:30am–1:30pm",
  },
];

export const TRANSIT: ResourcePlace[] = [
  {
    id: "vta",
    name: "VTA — Santa Clara Valley Transit",
    county: "Santa Clara",
    address: "55 W Santa Clara St, San Jose, CA 95113",
    phone: "(408) 321-2300",
    hours: "Buses & light rail daily",
    note: "Ask about a reduced (Clipper START) fare card for low-income riders.",
  },
  {
    id: "caltrain-sj",
    name: "Caltrain — San Jose Diridon Station",
    county: "Santa Clara",
    address: "65 Cahill St, San Jose, CA 95110",
    hours: "Trains daily ~5am–midnight",
    note: "Connects San Jose to San Francisco along the Peninsula.",
  },
  {
    id: "muni",
    name: "SFMTA Muni",
    county: "San Francisco",
    address: "11 South Van Ness Ave, San Francisco, CA 94103",
    phone: "(415) 701-2311",
    hours: "Buses & Metro daily",
    note: "Free Muni for low-income adults — apply for a Lifeline Clipper card.",
  },
  {
    id: "bart-civic",
    name: "BART — Civic Center Station",
    county: "San Francisco",
    address: "1150 Market St, San Francisco, CA 94102",
    hours: "Trains Mon–Sat 5am–midnight, Sun 8am–midnight",
    note: "Regional rail across the Bay Area.",
  },
  {
    id: "caltrain-sf",
    name: "Caltrain — San Francisco Station",
    county: "San Francisco",
    address: "700 4th St, San Francisco, CA 94107",
    hours: "Trains daily ~5am–midnight",
  },
];

export function mapsUrl(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}
