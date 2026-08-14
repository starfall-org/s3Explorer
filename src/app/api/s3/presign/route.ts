import { NextRequest, NextResponse } from 'next/server';
import { S3Config } from '@/utils/s3Types';
import {
  getS3ConfigFromCookies,
  isS3ConfigValid,
  presignS3Object,
} from '@/lib/server/s3';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DEFAULT_EXPIRES_IN = 3600; // 1 hour for playback
const MAX_EXPIRES_IN = 604800; // hard cap at 7 days to avoid leaking keys forever
const SHARE_EXPIRES_IN = 604800;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const key: string = typeof body.key === 'string' ? body.key : '';
    const configOverride = (body.config as S3Config) ?? null;
    const config =
      configOverride ??
      getS3ConfigFromCookies({
        s3Endpoint: request.cookies.get('s3Endpoint')?.value,
        s3Apikey: request.cookies.get('s3Apikey')?.value,
        s3SecretKey: request.cookies.get('s3SecretKey')?.value,
        s3Bucket: request.cookies.get('s3Bucket')?.value,
      });

    if (!key || !isS3ConfigValid(config)) {
      return NextResponse.json(
        { success: false, error: 'Missing file key or S3 configuration.' },
        { status: 400 }
      );
    }

    // Allow caller to pick a shorter TTL for media playback. Cap at MAX_EXPIRES_IN
    // so the route can't be abused to mint long-lived links without auth.
    const requested = Number(body.expiresIn);
    const expiresIn =
      Number.isFinite(requested) && requested > 0
        ? Math.min(requested, MAX_EXPIRES_IN)
        : SHARE_EXPIRES_IN;
    const url = await presignS3Object(config, key, expiresIn);
    return NextResponse.json({ success: true, url, expiresIn });
  } catch (error) {
    console.error('Error generating presigned URL (server):', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
