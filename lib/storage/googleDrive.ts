import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { db } from '@/lib/db';
import { storageAccounts, storageFiles } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

const DRIVE_SCOPE = ['https://www.googleapis.com/auth/drive.file'];

function getRedirectUri() {
  const base = process.env.APP_URL || 'http://localhost:3000';
  return `${base}/api/storage/connect/gdrive/callback`;
}

export function getOAuthClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('Google client ID/secret not set');
  }
  const redirectUri = getRedirectUri();
  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

export function getAuthUrl(): string {
  const oAuth2Client = getOAuthClient();
  return oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: DRIVE_SCOPE,
  });
}

export async function exchangeCodeForTokens(userId: string, code: string) {
  const oAuth2Client = getOAuthClient();
  const { tokens } = await oAuth2Client.getToken(code);
  if (!tokens.access_token) {
    throw new Error('Failed to obtain access token');
  }

  // Upsert storage account
  const existing = await db.query.storageAccounts.findFirst({
    where: and(eq(storageAccounts.userId, userId), eq(storageAccounts.provider, 'gdrive')),
  });

  if (existing) {
    await db
      .update(storageAccounts)
      .set({
        accessToken: tokens.access_token || null,
        refreshToken: tokens.refresh_token || existing.refreshToken,
        scope: tokens.scope || existing.scope,
        updatedAt: new Date(),
      })
      .where(eq(storageAccounts.id, existing.id));
  } else {
    await db.insert(storageAccounts).values({
      id: uuidv4(),
      userId,
      provider: 'gdrive',
      accessToken: tokens.access_token || null,
      refreshToken: tokens.refresh_token || null,
      scope: tokens.scope || DRIVE_SCOPE.join(' '),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
}

export async function getAuthedDriveForUser(userId: string) {
  const acct = await db.query.storageAccounts.findFirst({
    where: and(eq(storageAccounts.userId, userId), eq(storageAccounts.provider, 'gdrive')),
  });
  if (!acct?.accessToken) throw new Error('Google Drive not connected');

  const oAuth2Client = getOAuthClient();
  oAuth2Client.setCredentials({
    access_token: acct.accessToken || undefined,
    refresh_token: acct.refreshToken || undefined,
  });
  return google.drive({ version: 'v3', auth: oAuth2Client as OAuth2Client });
}

export async function ensureGoalFolder(userId: string, folderName: string) {
  const acct = await db.query.storageAccounts.findFirst({
    where: and(eq(storageAccounts.userId, userId), eq(storageAccounts.provider, 'gdrive')),
  });
  if (!acct) throw new Error('Google Drive not connected');

  // Check if folder mapping exists
  const existing = await db.query.storageFiles.findFirst({
    where: and(
      eq(storageFiles.storageAccountId, acct.id),
      eq(storageFiles.path, `/${folderName}`),
    ),
  });
  if (existing?.providerFileId) return { folderId: existing.providerFileId, storageAccountId: acct.id };

  const drive = await getAuthedDriveForUser(userId);
  const res = await drive.files.create({
    requestBody: { name: folderName, mimeType: 'application/vnd.google-apps.folder' },
    fields: 'id,name',
  });
  const folderId = res.data.id!;

  await db.insert(storageFiles).values({
    id: uuidv4(),
    storageAccountId: acct.id,
    providerFileId: folderId,
    path: `/${folderName}`,
    mimeType: 'application/vnd.google-apps.folder',
    createdAt: new Date(),
  });

  return { folderId, storageAccountId: acct.id };
}

export async function uploadTextFile(userId: string, folderId: string, name: string, content: string) {
  const drive = await getAuthedDriveForUser(userId);
  const media = {
    mimeType: 'text/markdown',
    body: Buffer.from(content, 'utf8'),
  } as any;
  const file = await drive.files.create({
    requestBody: { name, parents: [folderId] },
    media,
    fields: 'id,name',
  });
  return file.data.id!;
}

