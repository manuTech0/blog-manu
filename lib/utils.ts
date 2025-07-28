import { ErrorZod, SlugifyOptions } from '@/lib/types';
import * as iso8601 from 'iso8601-duration';
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import ms from 'ms';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function durationToUnix(duration: string): number {
  if (!duration) throw new Error('Durasi tidak boleh kosong');

  const now = Date.now();

  try {
    const msVal = ms(duration);
    if (typeof msVal === 'number') {
      return Math.floor((now + msVal) / 1000); 
    }
  // eslint-disable-next-line no-empty, @typescript-eslint/no-unused-vars
  } catch (_) {
  }

  try {
    const parsed = iso8601.parse(duration);
    const endTime = iso8601.end(parsed, new Date());
    return Math.floor(endTime.getTime() / 1000);
  } catch (e) {
    console.error(e);
  }

  throw new Error(`Format durasi tidak dikenali: "${duration}"`);
}

export function zodErrorValidateToStr(err: ErrorZod[]) {
  const allFieald = err.map((field: ErrorZod) => {
    const path = field.path.split(".")[0]
    return `${path}: ${field.message}`
  })
  return allFieald.join("\n")
}

export const slugifyOptions: SlugifyOptions = {
  lower: true,
  strict: true,
  locale:  "id",
  trim: true,
}

export function createExcerpt(text: string, maxLength: number = 100): string {
  if (!text) return ""
  return text.length > maxLength
    ? text.substring(0, maxLength).trim() + "..."
    : text
}

export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '')
}

export function createExcerptFromHtml(html: string, maxLength: number = 150): string {
  const cleanText = stripHtml(html)
  return createExcerpt(cleanText, maxLength)
}
