
import { UserProfile } from './types';

export const MOCK_USER: UserProfile = {
  id: 'me',
  name: 'DRAKE "THE PITBULL" VARMA',
  age: 28,
  weightClass: 'Middleweight',
  style: 'MMA',
  experienceYears: 6,
  bio: 'Ready to bleed. No rules, just respect.',
  verified: true,
  imageUrl: 'https://images.unsplash.com/photo-1552072805-2a9039d00e57?q=80&w=800&auto=format&fit=crop',
  stats: {
    wins: 14,
    losses: 2,
    brutalityScore: 88
  }
};

export const OPPONENTS: UserProfile[] = [
  {
    id: '1',
    name: 'VIKRAM "THE HAMMER" SINGH',
    age: 32,
    weightClass: 'Heavyweight',
    style: 'Boxing',
    experienceYears: 10,
    bio: 'Heavy hands, steel chin. Come find out.',
    verified: true,
    imageUrl: 'https://images.unsplash.com/photo-1544117518-2b462fca8a49?q=80&w=800&auto=format&fit=crop',
    stats: { wins: 22, losses: 4, brutalityScore: 92 }
  },
  {
    id: '2',
    name: 'RAHUL "GHOST" KHAN',
    age: 24,
    weightClass: 'Welterweight',
    style: 'Muay Thai',
    experienceYears: 4,
    bio: 'Elbows like razors. Speed kills.',
    verified: true,
    imageUrl: 'https://images.unsplash.com/photo-1599058917233-358334466e77?q=80&w=800&auto=format&fit=crop',
    stats: { wins: 9, losses: 1, brutalityScore: 75 }
  },
  {
    id: '3',
    name: 'AJAY "STORM" REDDY',
    age: 29,
    weightClass: 'Middleweight',
    style: 'Street Brawl',
    experienceYears: 15,
    bio: 'I survived the streets, you won\'t survive me.',
    verified: false,
    imageUrl: 'https://images.unsplash.com/photo-1517438476312-10d79c67750d?q=80&w=800&auto=format&fit=crop',
    stats: { wins: 45, losses: 0, brutalityScore: 98 }
  },
  {
    id: '4',
    name: 'SAM "THE BLADE" JOSHI',
    age: 27,
    weightClass: 'Lightweight',
    style: 'MMA',
    experienceYears: 5,
    bio: 'Technical savagery.',
    verified: true,
    imageUrl: 'https://images.unsplash.com/photo-1509563268479-0f004cf3f58b?q=80&w=800&auto=format&fit=crop',
    stats: { wins: 12, losses: 3, brutalityScore: 82 }
  }
];
