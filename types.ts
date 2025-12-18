
export type FightingStyle = 'MMA' | 'Boxing' | 'Muay Thai' | 'Street Brawl' | 'BJJ' | 'Wrestling';

export interface UserProfile {
  id: string;
  name: string;
  age: number;
  weightClass: string;
  style: FightingStyle;
  experienceYears: number;
  bio: string;
  verified: boolean;
  imageUrl: string;
  stats: {
    wins: number;
    losses: number;
    brutalityScore: number;
  };
}

export interface Match {
  id: string;
  fighterA: UserProfile;
  fighterB: UserProfile;
  status: 'pending' | 'accepted' | 'scheduled' | 'completed';
  scheduledTime?: string;
  location?: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}
