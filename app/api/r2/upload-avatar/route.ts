import { tryCatch } from "@/utils/try-catch";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextResponse, NextRequest } from 'next/server';

export const runtime = 'edge';

// Define the expected request body from the client
interface UploadRequestBody {
  fileName: string;
  contentType: string;
}

// Define CORS headers - adjust "Access-Control-Allow-Origin" for production
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE",
  "Access-Control-Allow-Headers": "*",
};

// Helper function to handle CORS preflight requests
export async function OPTIONS() {
  return new Response(null, {
    status: 204, // No Content
    headers: {
      ...corsHeaders,
      "Access-Control-Max-Age": "86400", // Cache preflight response for 1 day
    },
  });
}

export async function POST(req: NextRequest) {
  // 1. Parse the request body from the client
  const [requestBody, parseError] = await tryCatch<UploadRequestBody>(req.json());

  if (parseError) {
    console.error("Failed to parse JSON body:", parseError);
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400, headers: corsHeaders }
    );
  }

  const { fileName, contentType } = requestBody!; // '!' because parseError being null guarantees requestBody is not null

  if (!fileName || !contentType) {
    return NextResponse.json(
      { error: "Missing fileName or contentType in request body" },
      { status: 400, headers: corsHeaders }
    );
  }

  // 2. Access environment variables from process.env
  const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
  const R2_AVATAR_BUCKET_NAME = process.env.R2_AVATAR_BUCKET_NAME;
  const R2_AVATAR_ACCESS_KEY_ID = process.env.R2_AVATAR_ACCESS_KEY_ID;
  const R2_AVATAR_SECRET_ACCESS_KEY = process.env.R2_AVATAR_SECRET_ACCESS_KEY;
  const R2_AVATAR_URL_BASE = process.env.R2_AVATAR_URL_BASE;

  if (!R2_ACCOUNT_ID || !R2_AVATAR_BUCKET_NAME || !R2_AVATAR_ACCESS_KEY_ID || !R2_AVATAR_SECRET_ACCESS_KEY || !R2_AVATAR_URL_BASE) {
    console.error("Missing one or more R2 environment variables.");
    return NextResponse.json(
      { error: "Server configuration error: Missing R2 credentials or URL base." },
      { status: 500, headers: corsHeaders }
    );
  }

  const s3Client = new S3Client({
    region: "auto",
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_AVATAR_ACCESS_KEY_ID,
      secretAccessKey: R2_AVATAR_SECRET_ACCESS_KEY,
    },
  });

  // 4. Define the parameters for the S3 PutObjectCommand
  const objectKey = "avatars/" + fileName;

  const putCommand = new PutObjectCommand({
    Bucket: R2_AVATAR_BUCKET_NAME,
    Key: objectKey,
    ContentType: contentType,
  });

  // 5. Generate the presigned URL
  const expiresInSeconds = 300;
  const [uploadUrl, signedUrlError] = await tryCatch(
    getSignedUrl(s3Client, putCommand, { expiresIn: expiresInSeconds })
  );

  if (signedUrlError) {
    console.error("Error generating presigned URL:", signedUrlError);
    const errorMessage = signedUrlError instanceof Error ? signedUrlError.message : "An unknown error occurred.";
    return NextResponse.json(
      { error: "Failed to generate upload URL", details: errorMessage },
      { status: 500, headers: corsHeaders }
    );
  }

  // 6. Construct the final public URL for the object
  const r2ObjectUrl = `${R2_AVATAR_URL_BASE.endsWith('/') ? R2_AVATAR_URL_BASE : R2_AVATAR_URL_BASE + '/'}${objectKey}`;

  // 7. Return the presigned URL and the final object URL to the client
  return NextResponse.json(
    { uploadUrl, r2ObjectUrl },
    { status: 200, headers: corsHeaders }
  );
}