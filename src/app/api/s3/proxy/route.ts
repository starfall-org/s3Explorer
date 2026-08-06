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

    const range = request.headers.get('range');
    const response = await getS3Object(config, key, range || undefined);

    const fileName = key.split('/').pop() || 'file';
    const headers = new Headers();
    headers.set('Content-Type', response.ContentType || 'application/octet-stream');
    headers.set('Accept-Ranges', 'bytes');
    headers.set('Content-Disposition', buildContentDisposition(fileName));
    if (response.ContentLength) {
      headers.set('Content-Length', String(response.ContentLength));
    }
    if (range && response.ContentRange) {
      headers.set('Content-Range', response.ContentRange);
    }

    const status = range ? 206 : 200;

    const body = response.Body as any;
    if (body && typeof body.transformToWebStream === 'function') {
      return new Response(body.transformToWebStream() as ReadableStream, { status, headers });
    }
    if (body && typeof body.transformToByteArray === 'function') {
      const bytes = await body.transformToByteArray();
      return new Response(new Uint8Array(bytes), { status, headers });
    }
    return new Response(body as ReadableStream, { status, headers });
  } catch (error: any) {
    // Pass through 416 (Range Not Satisfiable) from S3 so media players can recover
    if (error?.$metadata?.httpStatusCode === 416) {
      return new Response('Range Not Satisfiable', {
        status: 416,
        headers: { 'Content-Range': 'bytes */0' },
      });
    }
    console.error('Error proxying S3 object:', error);
    return new Response('Failed to load file', { status: 500 });
  }
}

// Build a Content-Disposition header that is safe for non-ASCII filenames.
// Plain filename= must be ASCII; use RFC 5987 filename*=UTF-8''... for Unicode names.
function buildContentDisposition(fileName: string): string {
  const asciiName = fileName.replace(/[^\x20-\x7E]/g, '_').replace(/["\\]/g, '_');
  const encodedName = encodeURIComponent(fileName).replace(
    /['()*]/g,
    (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase()
  );
  return `inline; filename="${asciiName}"; filename*=UTF-8''${encodedName}`;
}
