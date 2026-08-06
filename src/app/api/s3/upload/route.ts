import { NextRequest, NextResponse } from 'next/server';
import { S3Config } from '@/utils/s3Types';
import {
  getS3ConfigFromCookies,
  isS3ConfigValid,
  putS3Object,
} from '@/lib/server/s3';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const key = typeof formData.get('key') === 'string' ? (formData.get('key') as string) : '';
    const configRaw = formData.get('config');
    const configOverride =
      typeof configRaw === 'string' ? (JSON.parse(configRaw) as S3Config) : null;

    const config =
      configOverride ??
      getS3ConfigFromCookies({
        s3Endpoint: request.cookies.get('s3Endpoint')?.value,
        s3Apikey: request.cookies.get('s3Apikey')?.value,
        s3SecretKey: request.cookies.get('s3SecretKey')?.value,
        s3Bucket: request.cookies.get('s3Bucket')?.value,
      });

    if (!(file instanceof File) || !key || !isS3ConfigValid(config)) {
      return NextResponse.json(
        { success: false, error: 'Missing file or S3 configuration.' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    await putS3Object(config, key, buffer, file.type || undefined);

    return NextResponse.json({ success: true, key });
  } catch (error) {
    console.error('Error uploading S3 object (server):', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
