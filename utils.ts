import { COLORS } from './types';

export const getRandomRotation = () => Math.random() * 6 - 3; // Reduced rotation for better readability

export const getRandomPosition = (containerWidth: number, containerHeight: number) => {
  const margin = 50; // Reduced margin to allow placement closer to edges
  return {
    x: Math.random() * (containerWidth - margin * 2) + margin,
    y: Math.random() * (containerHeight - margin * 2) + margin,
  };
};

export const getRandomColor = () => COLORS[Math.floor(Math.random() * COLORS.length)];

// Generate a random jagged polygon for clip-path to simulate torn paper
// Updated to have more segments (more detail) but shallower cuts (more space)
export const generateTornClipPath = () => {
  const points = [];
  const segments = 25; // Increased segments for "rougher" look
  const variance = 1.5; // Decreased variance to 1.5% to minimize wasted edge space
  
  // Top edge
  for (let i = 0; i <= segments; i++) {
    const x = (i / segments) * 100;
    const y = Math.random() * variance; 
    points.push(`${x}% ${y}%`);
  }
  
  // Right edge
  for (let i = 0; i <= segments; i++) {
    const y = (i / segments) * 100;
    const x = 100 - Math.random() * variance;
    points.push(`${x}% ${y}%`);
  }
  
  // Bottom edge
  for (let i = segments; i >= 0; i--) {
    const x = (i / segments) * 100;
    const y = 100 - Math.random() * variance;
    points.push(`${x}% ${y}%`);
  }
  
  // Left edge
  for (let i = segments; i >= 0; i--) {
    const y = (i / segments) * 100;
    const x = Math.random() * variance;
    points.push(`${x}% ${y}%`);
  }

  return `polygon(${points.join(', ')})`;
};

export const formatDate = (ms: number) => {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(ms));
};

export const needsReview = (lastReviewedAt: number) => {
  const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
  return Date.now() - lastReviewedAt > THREE_DAYS_MS;
};

// Security: Validate URL to prevent XSS (javascript: protocol)
export const isValidUrl = (string: string) => {
  try {
    const url = new URL(string);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch (_) {
    return false;
  }
};