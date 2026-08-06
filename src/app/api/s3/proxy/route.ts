import { NextRequest } from 'next/server';
import {
  getS3ConfigFromCookies,
  isS3ConfigValid,
  getS3Object,
} from '@/lib/server/s3';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const key = request.nextUrl.searchParams.get('key') || '';
    const config = getS3ConfigFromCookies({
      s3Endpoint: request.cookies.get('s3Endpoint')?.value,
      s3Apikey: request.cookies.get('s3Apikey')?.value,
      s3SecretKey: request.cookies.get('s3SecretKey')?.value,
      s3Bucket: request.cookies.get('s3Bucket')?.value,
    });

    if (!key || !isS3ConfigValid(config)) {
      return new Response('Missing S3 configuration', { status: 400 });
    }

    const response = await getS3Object(config, key);

    const fileName = key.split('/').pop() || 'file';
    const headers = new Headers();
    headers.set('Content-Type', response.ContentType || 'application/octet-stream');
    headers.set('Content-Disposition', `inline; filename="${fileName}"`);
    if (response.ContentLength) {
      headers.set('Content-Length', String(response.ContentLength));
    }

    const body = response.Body as any;
    if (body && typeof body.transformToWebStream === 'function') {
      return new Response(body.transformToWebStream() as ReadableStream, { headers });
    }
    if (body && typeof body.transformToByteArray === 'function') {
      const bytes = await body.transformToByteArray();
      return new Response(new Uint8Array(bytes), { headers });
    }
    return new Response(body as ReadableStream, { headers });
  } catch (error) {
    console.error('Error proxying S3 object:', error);
    return new Response('Failed to load file', { status: 500 });
  }
}
