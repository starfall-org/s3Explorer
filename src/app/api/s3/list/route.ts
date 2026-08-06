import { NextRequest, NextResponse } from 'next/server';
import { S3Config } from '@/utils/s3Types';
import {
  getS3ConfigFromCookies,
  isS3ConfigValid,
  listS3Objects,
} from '@/lib/server/s3';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const path: string = typeof body.path === 'string' ? body.path : '';
    const configOverride = (body.config as S3Config) ?? null;
    const config =
      configOverride ??
      getS3ConfigFromCookies({
        s3Endpoint: request.cookies.get('s3Endpoint')?.value,
        s3Apikey: request.cookies.get('s3Apikey')?.value,
        s3SecretKey: request.cookies.get('s3SecretKey')?.value,
        s3Bucket: request.cookies.get('s3Bucket')?.value,
      });

    if (!isS3ConfigValid(config)) {
      return NextResponse.json(
        { error: 'Thiếu thông tin kết nối S3.' },
        { status: 400 }
      );
    }

    const items = await listS3Objects(config, path);
    return NextResponse.json({ items });
  } catch (error) {
    console.error('Error listing S3 objects (server):', error);
    return NextResponse.json(
      { error: 'Không thể kết nối tới S3.' },
      { status: 500 }
    );
  }
}
