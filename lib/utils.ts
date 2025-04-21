import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString: string): string {
  // This is a simple function that could be enhanced with a date parsing library
  // For now, we'll just return the string as is
  return dateString
}
