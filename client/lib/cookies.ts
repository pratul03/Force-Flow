'use client';

/**
 * Cookie utility functions for client-side cookie management
 * Uses document.cookie API without external dependencies
 */

interface CookieOptions {
  maxAge?: number; // in seconds
  path?: string;
  domain?: string;
  secure?: boolean;
  sameSite?: 'Strict' | 'Lax' | 'None';
}

const DEFAULT_OPTIONS: CookieOptions = {
  path: '/',
  sameSite: 'Lax',
};

/**
 * Set a cookie with the given name and value
 */
export function setCookie(
  name: string,
  value: string,
  options: CookieOptions = {}
): void {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  
  let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;
  
  if (mergedOptions.maxAge) {
    cookieString += `; Max-Age=${mergedOptions.maxAge}`;
  }
  
  if (mergedOptions.path) {
    cookieString += `; Path=${mergedOptions.path}`;
  }
  
  if (mergedOptions.domain) {
    cookieString += `; Domain=${mergedOptions.domain}`;
  }
  
  if (mergedOptions.secure) {
    cookieString += '; Secure';
  }
  
  if (mergedOptions.sameSite) {
    cookieString += `; SameSite=${mergedOptions.sameSite}`;
  }
  
  document.cookie = cookieString;
}

/**
 * Get a cookie value by name
 */
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  
  const cookieArray = document.cookie.split(';');
  
  for (const cookie of cookieArray) {
    const [cookieName, cookieValue] = cookie.split('=');
    const decodedName = decodeURIComponent(cookieName.trim());
    
    if (decodedName === name) {
      return decodeURIComponent(cookieValue);
    }
  }
  
  return null;
}

/**
 * Remove a cookie by name
 */
export function removeCookie(name: string): void {
  setCookie(name, '', { maxAge: 0 });
}

/**
 * Set a JSON cookie
 */
export function setJsonCookie<T>(
  name: string,
  value: T,
  options: CookieOptions = {}
): void {
  const jsonString = JSON.stringify(value);
  setCookie(name, jsonString, {
    ...options,
    maxAge: options.maxAge || 7 * 24 * 60 * 60, // 7 days default
  });
}

/**
 * Get a JSON cookie
 */
export function getJsonCookie<T>(name: string): T | null {
  const cookie = getCookie(name);
  
  if (!cookie) return null;
  
  try {
    return JSON.parse(cookie) as T;
  } catch {
    console.error(`Failed to parse JSON cookie: ${name}`);
    return null;
  }
}

/**
 * Clear all cookies
 */
export function clearAllCookies(): void {
  const cookies = document.cookie.split(';');
  
  for (const cookie of cookies) {
    const cookieName = cookie.split('=')[0].trim();
    removeCookie(cookieName);
  }
}

/**
 * Check if a cookie exists
 */
export function hasCookie(name: string): boolean {
  return getCookie(name) !== null;
}
