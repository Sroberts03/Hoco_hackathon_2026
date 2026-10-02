export type CountryCode = keyof typeof COUNTRIES;

export const COUNTRIES = {
  US: "United States",
  CA: "Canada",
  MX: "Mexico",
  GB: "United Kingdom",
  IE: "Ireland",
  AU: "Australia",
  NZ: "New Zealand",
  IN: "India",
  SG: "Singapore",
  JP: "Japan",
  KR: "South Korea",
  CN: "China",
  DE: "Germany",
  FR: "France",
  ES: "Spain",
  IT: "Italy",
  NL: "Netherlands",
  BR: "Brazil",
  ZA: "South Africa",
  IL: "Israel",
} as const;

export const US_STATES = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California", CO: "Colorado", CT: "Connecticut",
  DE: "Delaware", FL: "Florida", GA: "Georgia", HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana",
  IA: "Iowa", KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland", MA: "Massachusetts",
  MI: "Michigan", MN: "Minnesota", MS: "Mississippi", MO: "Missouri", MT: "Montana", NE: "Nebraska", NV: "Nevada",
  NH: "New Hampshire", NJ: "New Jersey", NM: "New Mexico", NY: "New York", NC: "North Carolina", ND: "North Dakota",
  OH: "Ohio", OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina",
  SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont", VA: "Virginia", WA: "Washington",
  WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming",
} as const;

const US_CITIES: Partial<Record<keyof typeof US_STATES, string[]>> = {
  AL: ["Birmingham", "Mobile", "Montgomery", "Huntsville"],
  AK: ["Anchorage", "Fairbanks", "Juneau"],
  AZ: ["Phoenix", "Tucson", "Mesa", "Scottsdale"],
  AR: ["Little Rock", "Fayetteville", "Fort Smith"],
  CA: ["Los Angeles", "San Diego", "San Francisco", "San Jose", "Sacramento", "Oakland"],
  CO: ["Denver", "Boulder", "Colorado Springs", "Fort Collins", "Aurora"],
  CT: ["Hartford", "New Haven", "Stamford", "Bridgeport"],
  DE: ["Wilmington", "Dover", "Newark"],
  FL: ["Miami", "Orlando", "Tampa", "Jacksonville", "Tallahassee", "Fort Lauderdale"],
  GA: ["Atlanta", "Savannah", "Augusta", "Athens"],
  HI: ["Honolulu", "Hilo", "Kailua"],
  ID: ["Boise", "Idaho Falls", "Meridian"],
  IL: ["Chicago", "Springfield", "Rockford", "Peoria"],
  IN: ["Indianapolis", "Fort Wayne", "South Bend", "Bloomington"],
  IA: ["Des Moines", "Cedar Rapids", "Iowa City"],
  KS: ["Wichita", "Topeka", "Lawrence", "Kansas City"],
  KY: ["Louisville", "Lexington", "Frankfort", "Bowling Green"],
  LA: ["New Orleans", "Baton Rouge", "Shreveport", "Lafayette"],
  ME: ["Portland", "Augusta", "Bangor"],
  MD: ["Baltimore", "Columbia", "Annapolis", "Frederick", "Rockville"],
  MA: ["Boston", "Worcester", "Cambridge", "Springfield"],
  MI: ["Detroit", "Grand Rapids", "Lansing", "Ann Arbor"],
  MN: ["Minneapolis", "Saint Paul", "Rochester", "Duluth"],
  MS: ["Jackson", "Gulfport", "Hattiesburg"],
  MO: ["Kansas City", "St. Louis", "Springfield", "Columbia"],
  MT: ["Billings", "Missoula", "Bozeman", "Helena"],
  NE: ["Omaha", "Lincoln", "Bellevue"],
  NV: ["Las Vegas", "Reno", "Henderson", "Carson City"],
  NH: ["Manchester", "Concord", "Nashua"],
  NJ: ["Newark", "Jersey City", "Trenton", "Princeton"],
  NM: ["Albuquerque", "Santa Fe", "Las Cruces"],
  NY: ["New York", "Buffalo", "Rochester", "Albany", "Syracuse"],
  NC: ["Charlotte", "Raleigh", "Durham", "Asheville", "Wilmington"],
  ND: ["Fargo", "Bismarck", "Grand Forks"],
  OH: ["Columbus", "Cleveland", "Cincinnati", "Toledo", "Dayton"],
  OK: ["Oklahoma City", "Tulsa", "Norman", "Stillwater"],
  OR: ["Portland", "Eugene", "Salem", "Bend"],
  PA: ["Philadelphia", "Pittsburgh", "Harrisburg", "Allentown", "State College"],
  RI: ["Providence", "Newport", "Warwick"],
  SC: ["Charleston", "Columbia", "Greenville", "Myrtle Beach"],
  SD: ["Sioux Falls", "Rapid City", "Pierre"],
  TN: ["Nashville", "Memphis", "Knoxville", "Chattanooga"],
  TX: ["Houston", "Austin", "Dallas", "San Antonio", "Fort Worth", "El Paso"],
  UT: ["Salt Lake City", "Provo", "Ogden", "St. George"],
  VT: ["Burlington", "Montpelier", "Rutland"],
  VA: ["Virginia Beach", "Richmond", "Arlington", "Alexandria", "Norfolk"],
  WA: ["Seattle", "Spokane", "Tacoma", "Bellevue", "Olympia"],
  WV: ["Charleston", "Morgantown", "Huntington"],
  WI: ["Milwaukee", "Madison", "Green Bay", "Eau Claire"],
  WY: ["Cheyenne", "Casper", "Laramie"],
};

const INTERNATIONAL_CITIES = new Set([
  "Toronto", "Vancouver", "Montreal", "Ottawa", "Calgary", "Mexico City", "London", "Manchester", "Edinburgh",
  "Dublin", "Sydney", "Melbourne", "Brisbane", "Perth", "Auckland", "Mumbai", "New Delhi", "Bengaluru", "Singapore",
  "Tokyo", "Osaka", "Seoul", "Beijing", "Shanghai", "Berlin", "Munich", "Paris", "Lyon", "Madrid", "Barcelona",
  "Rome", "Milan", "Amsterdam", "São Paulo", "Rio de Janeiro", "Johannesburg", "Cape Town", "Tel Aviv",
]);

export function cityOptions(country: string, region: string): string[] {
  if (country === "US" && region in US_STATES) return US_CITIES[region as keyof typeof US_STATES] ?? [];
  return [...INTERNATIONAL_CITIES];
}

function normalized(value: string) {
  return value.trim().toLocaleLowerCase();
}

export function validateLocation(city: string, region: string, country: string): string | null {
  const cleanCity = city.trim();
  const cleanRegion = region.trim().toUpperCase();
  const cleanCountry = country.trim().toUpperCase();
  if (!cleanCity && !cleanRegion && !cleanCountry) return null;
  if (!cleanCity || !cleanRegion || !cleanCountry) return "Enter a city, state or region, and country.";
  if (!(cleanCountry in COUNTRIES)) return "Choose a country from the list.";
  if (cleanCountry === "US") {
    if (!(cleanRegion in US_STATES)) return "Choose a valid U.S. state.";
    const cities = US_CITIES[cleanRegion as keyof typeof US_STATES] ?? [];
    if (!cities.some((value) => normalized(value) === normalized(cleanCity))) {
      return "Choose a recognized city for that state.";
    }
  } else if (!cityOptions(cleanCountry, cleanRegion).some((value) => normalized(value) === normalized(cleanCity))) {
    return "Choose a recognized city from the list.";
  }
  return null;
}

export function locationLabel(city: string | null, region: string | null, country: string | null, fallback: string | null) {
  if (city && region && country && country in COUNTRIES) {
    return `${city}, ${country === "US" && region in US_STATES ? US_STATES[region as keyof typeof US_STATES] : region}, ${COUNTRIES[country as CountryCode]}`;
  }
  return fallback;
}
