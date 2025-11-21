import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { NextRequest, NextResponse } from 'next/server';

const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function POST(request: NextRequest) {
  try {
    const { fileKey } = await request.json();
    
    if (!fileKey) {
      return NextResponse.json(
        { error: 'File key is required' },
        { status: 400 }
      );
    }

    const command = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME || 'job-videos',
      Key: fileKey,
    });

    // Generate presigned URL for download (valid for 1 hour)
    const downloadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

    return NextResponse.json({ downloadUrl });
  } catch (error: any) {
    console.error('Download URL generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate download URL' },
      { status: 500 }
    );
  }
}