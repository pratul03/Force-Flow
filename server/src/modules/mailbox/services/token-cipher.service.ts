import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';

@Injectable()
export class TokenCipherService {
  private readonly encryptionKey: Buffer;

  constructor(private readonly configService: ConfigService) {
    const keySource =
      this.configService.get<string>('MAIL_TOKEN_ENCRYPTION_KEY') ||
      this.configService.get<string>('JWT_REFRESH_SECRET') ||
      '';

    if (!keySource) {
      throw new InternalServerErrorException(
        'MAIL_TOKEN_ENCRYPTION_KEY is required for mailbox encryption',
      );
    }

    this.encryptionKey = createHash('sha256').update(keySource).digest();
  }

  encrypt(plainText: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.encryptionKey, iv);

    const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();

    return `${iv.toString('base64url')}.${authTag.toString('base64url')}.${encrypted.toString('base64url')}`;
  }

  decrypt(cipherText: string): string {
    const [ivRaw, authTagRaw, encryptedRaw] = cipherText.split('.');

    if (!ivRaw || !authTagRaw || !encryptedRaw) {
      throw new InternalServerErrorException('Corrupted encrypted mailbox token');
    }

    const decipher = createDecipheriv(
      'aes-256-gcm',
      this.encryptionKey,
      Buffer.from(ivRaw, 'base64url'),
    );

    decipher.setAuthTag(Buffer.from(authTagRaw, 'base64url'));

    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encryptedRaw, 'base64url')),
      decipher.final(),
    ]);

    return decrypted.toString('utf8');
  }
}
