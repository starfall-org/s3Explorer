import { NextRequest, NextResponse } from 'next/server';
import { S3Config } from '@/utils/s3Types';
import {
  getS3ConfigFromCookies,
  isS3ConfigValid,
  deleteS3Object,
} from '@/lib/server/s3';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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
        { success: false, error: 'Thiếu thông tin.' },
        { status: 400 }
      );
    }

    await deleteS3Object(config, key);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting S3 object (server):', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
