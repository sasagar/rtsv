import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combines Tailwind CSS classes with `clsx` and `tailwind-merge` for conditional styling and conflict resolution.
 * @param inputs - An array of class values (strings, objects, arrays) to be combined.
 * @returns A merged string of Tailwind CSS classes.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Retrieves a session ID from sessionStorage or generates a new one if it doesn't exist.
 * The session ID is a random string used to identify a unique user session.
 * @returns The session ID as a string, or null if `window` is undefined (e.g., during server-side rendering).
 */
export const getSessionId = (): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  let sessionId = sessionStorage.getItem('sessionId');
  if (!sessionId) {
    sessionId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    sessionStorage.setItem('sessionId', sessionId);
  }
  return sessionId;
};