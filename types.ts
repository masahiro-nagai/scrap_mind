export interface Scrap {
  id: string;
  content: string; // The user's rough notes
  image?: string; // Base64 image string if user uploads a screenshot/photo
  url?: string; // Optional link to the article
  tags?: string[]; // User defined tags
  createdAt: number;
  lastReviewedAt: number;
  
  // Visual properties
  position: { x: number; y: number };
  rotation: number;
  color: string; // bg color class
  zIndex: number;
  width: number;
  height: number;
  clipPath: string; // To store the "torn" shape
}

export interface IdeaSynthesis {
  title: string;
  summary: string;
  connections: string[];
}

export enum AppMode {
  BOARD = 'BOARD',
  REVIEW = 'REVIEW',
  SYNTHESIS = 'SYNTHESIS'
}

export const COLORS = [
  'bg-yellow-100', // Post-it
  'bg-orange-100', // Kraft
  'bg-blue-100',   // Note card
  'bg-red-100',    // Alert
  'bg-emerald-100',// Soft green
  'bg-stone-200',  // Grey cardboard
];