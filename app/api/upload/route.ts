import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
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
    const { fileName, fileType, jobId, userId, revisionNumber } = await request.json();
    
    if (!fileName || !fileType || !jobId || !userId || !revisionNumber) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create a unique file path
    const timestamp = Date.now();
    const key = `${userId}/${jobId}/revision-${revisionNumber}/${timestamp}-${fileName}`;
    
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME || 'job-videos',
      Key: key,
      ContentType: fileType,
    });

    // Generate presigned URL for client-side upload (valid for 1 hour)
    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

    return NextResponse.json({ uploadUrl, key });
  } catch (error: any) {
    console.error('Upload URL generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate upload URL' },
      { status: 500 }
    );
  }
}