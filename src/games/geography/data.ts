export interface Country {
  name: string;
  capital: string;
  continent: string;
  flag: string;
  tier: 1 | 2 | 3;
}

export const COUNTRIES: Country[] = [
  // Tier 1 - very well known (15)
  { name: 'United States', capital: 'Washington, D.C.', continent: 'North America', flag: '🇺🇸', tier: 1 },
  { name: 'United Kingdom', capital: 'London', continent: 'Europe', flag: '🇬🇧', tier: 1 },
  { name: 'France', capital: 'Paris', continent: 'Europe', flag: '🇫🇷', tier: 1 },
  { name: 'Germany', capital: 'Berlin', continent: 'Europe', flag: '🇩🇪', tier: 1 },
  { name: 'Japan', capital: 'Tokyo', continent: 'Asia', flag: '🇯🇵', tier: 1 },
  { name: 'China', capital: 'Beijing', continent: 'Asia', flag: '🇨🇳', tier: 1 },
  { name: 'India', capital: 'New Delhi', continent: 'Asia', flag: '🇮🇳', tier: 1 },
  { name: 'Brazil', capital: 'Brasília', continent: 'South America', flag: '🇧🇷', tier: 1 },
  { name: 'Canada', capital: 'Ottawa', continent: 'North America', flag: '🇨🇦', tier: 1 },
  { name: 'Australia', capital: 'Canberra', continent: 'Oceania', flag: '🇦🇺', tier: 1 },
  { name: 'Italy', capital: 'Rome', continent: 'Europe', flag: '🇮🇹', tier: 1 },
  { name: 'Spain', capital: 'Madrid', continent: 'Europe', flag: '🇪🇸', tier: 1 },
  { name: 'Mexico', capital: 'Mexico City', continent: 'North America', flag: '🇲🇽', tier: 1 },
  { name: 'Egypt', capital: 'Cairo', continent: 'Africa', flag: '🇪🇬', tier: 1 },
  { name: 'Russia', capital: 'Moscow', continent: 'Europe', flag: '🇷🇺', tier: 1 },

  // Tier 2 - moderately known (20)
  { name: 'South Korea', capital: 'Seoul', continent: 'Asia', flag: '🇰🇷', tier: 2 },
  { name: 'Argentina', capital: 'Buenos Aires', continent: 'South America', flag: '🇦🇷', tier: 2 },
  { name: 'South Africa', capital: 'Pretoria', continent: 'Africa', flag: '🇿🇦', tier: 2 },
  { name: 'Netherlands', capital: 'Amsterdam', continent: 'Europe', flag: '🇳🇱', tier: 2 },
  { name: 'Sweden', capital: 'Stockholm', continent: 'Europe', flag: '🇸🇪', tier: 2 },
  { name: 'Switzerland', capital: 'Bern', continent: 'Europe', flag: '🇨🇭', tier: 2 },
  { name: 'Greece', capital: 'Athens', continent: 'Europe', flag: '🇬🇷', tier: 2 },
  { name: 'Turkey', capital: 'Ankara', continent: 'Asia', flag: '🇹🇷', tier: 2 },
  { name: 'Thailand', capital: 'Bangkok', continent: 'Asia', flag: '🇹🇭', tier: 2 },
  { name: 'Indonesia', capital: 'Jakarta', continent: 'Asia', flag: '🇮🇩', tier: 2 },
  { name: 'Nigeria', capital: 'Abuja', continent: 'Africa', flag: '🇳🇬', tier: 2 },
  { name: 'Kenya', capital: 'Nairobi', continent: 'Africa', flag: '🇰🇪', tier: 2 },
  { name: 'Norway', capital: 'Oslo', continent: 'Europe', flag: '🇳🇴', tier: 2 },
  { name: 'Poland', capital: 'Warsaw', continent: 'Europe', flag: '🇵🇱', tier: 2 },
  { name: 'Portugal', capital: 'Lisbon', continent: 'Europe', flag: '🇵🇹', tier: 2 },
  { name: 'New Zealand', capital: 'Wellington', continent: 'Oceania', flag: '🇳🇿', tier: 2 },
  { name: 'Vietnam', capital: 'Hanoi', continent: 'Asia', flag: '🇻🇳', tier: 2 },
  { name: 'Peru', capital: 'Lima', continent: 'South America', flag: '🇵🇪', tier: 2 },
  { name: 'Chile', capital: 'Santiago', continent: 'South America', flag: '🇨🇱', tier: 2 },
  { name: 'Colombia', capital: 'Bogotá', continent: 'South America', flag: '🇨🇴', tier: 2 },

  // Tier 3 - trickier (15)
  { name: 'Morocco', capital: 'Rabat', continent: 'Africa', flag: '🇲🇦', tier: 3 },
  { name: 'Iceland', capital: 'Reykjavík', continent: 'Europe', flag: '🇮🇸', tier: 3 },
  { name: 'Hungary', capital: 'Budapest', continent: 'Europe', flag: '🇭🇺', tier: 3 },
  { name: 'Czechia', capital: 'Prague', continent: 'Europe', flag: '🇨🇿', tier: 3 },
  { name: 'Malaysia', capital: 'Kuala Lumpur', continent: 'Asia', flag: '🇲🇾', tier: 3 },
  { name: 'Israel', capital: 'Jerusalem', continent: 'Asia', flag: '🇮🇱', tier: 3 },
  { name: 'Ireland', capital: 'Dublin', continent: 'Europe', flag: '🇮🇪', tier: 3 },
  { name: 'Ethiopia', capital: 'Addis Ababa', continent: 'Africa', flag: '🇪🇹', tier: 3 },
  { name: 'Ghana', capital: 'Accra', continent: 'Africa', flag: '🇬🇭', tier: 3 },
  { name: 'Bangladesh', capital: 'Dhaka', continent: 'Asia', flag: '🇧🇩', tier: 3 },
  { name: 'Pakistan', capital: 'Islamabad', continent: 'Asia', flag: '🇵🇰', tier: 3 },
  { name: 'Austria', capital: 'Vienna', continent: 'Europe', flag: '🇦🇹', tier: 3 },
  { name: 'Belgium', capital: 'Brussels', continent: 'Europe', flag: '🇧🇪', tier: 3 },
  { name: 'Kazakhstan', capital: 'Astana', continent: 'Asia', flag: '🇰🇿', tier: 3 },
  { name: 'Cuba', capital: 'Havana', continent: 'North America', flag: '🇨🇺', tier: 3 },
];
