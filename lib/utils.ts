import OTP from 'otp-generator';
import * as iso8601 from 'iso8601-duration';
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import ms, { StringValue } from 'ms';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function durationToUnix(duration: string): number {
  if (!duration) throw new Error('Durasi tidak boleh kosong');

  const now = Date.now();

  try {
    const msVal: number = ms(duration as StringValue);
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

export async function createOtp(){
  const otp = await OTP.generate(6, {
        digits: true,
        upperCaseAlphabets: true,
        specialChars: false,
        lowerCaseAlphabets: false
    })
  return otp
}

export const isUnauthorizedError = (error: any): boolean => {
    if (!error) return false

    const message =
        error?.message ||
        error?.extensions?.originalError?.message ||
        error?.extensions?.message

    return typeof message === "string" &&
        message.toLowerCase().includes("unauthorized")
}

export function extractGraphQLErrorMessage(error: unknown): string {
  try {
    // Cek jika error adalah instance Error dan mengandung JSON di dalam message
    if (error instanceof Error && error.message.includes("{")) {
      const jsonStart = error.message.indexOf("{");
      const jsonString = error.message.slice(jsonStart);

      const parsed = JSON.parse(jsonString);
      const gqlError = parsed.response?.errors?.[0];

      const originalMessage = gqlError?.extensions?.originalError?.message;
      return originalMessage ?? gqlError?.message ?? "Unknown GraphQL error.";
    }
    return "Unexpected error format.";
  } catch (err) {
    return "Failed to parse error message.";
  }
}
