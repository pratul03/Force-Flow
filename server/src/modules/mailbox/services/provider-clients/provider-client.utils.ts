import { randomBytes } from 'crypto';

export function createPreview(body: string): string {
  return body.replace(/\s+/g, ' ').trim().slice(0, 160);
}

export function stripHtml(input: string | undefined): string {
  if (!input) {
    return '';
  }

  return input.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

export function parseCommaSeparatedEmails(input: string): string[] {
  return input
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function toBase64UrlUtf8(input: string): string {
  return Buffer.from(input, 'utf8').toString('base64url');
}

export function fromBase64UrlToUtf8(input: string | undefined): string {
  if (!input) {
    return '';
  }

  return Buffer.from(input, 'base64url').toString('utf8');
}

export function normalizeBase64(input: string): string {
  return input.replace(/\s+/g, '');
}

export function wrapBase64Lines(input: string): string {
  const matches = input.match(/.{1,76}/g);
  return matches ? matches.join('\r\n') : input;
}

export function createNonce(length: number = 24): string {
  return randomBytes(length).toString('base64url');
}
