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
  "Access-Control-Allow-Origin": "*", // Matches the R2 policy example
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE", // Matches methods in the R2 policy example
  "Access-Control-Allow-Headers": "*", // Matches headers in the R2 policy example (Be specific if possible)
};

// Helper function to handle CORS preflight requests
export async function OPTIONS(req: Request) {
  return new Response(null, {
    status: 204, // No Content
    headers: {
      ...corsHeaders,
      "Access-Control-Max-Age": "86400", // Cache preflight response for 1 day
    },
  });
}

// This is the POST handler for the API route.
// It receives the incoming request object.
export async function POST(req: NextRequest) {
  try {
    // 1. Parse the request body from the client
    let requestBody: UploadRequestBody;
    try {
      requestBody = await req.json();
    } catch (e) {
      console.error("Failed to parse JSON body:", e);
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400, headers: corsHeaders }
      );
    }

    const { fileName, contentType } = requestBody;

    if (!fileName || !contentType) {
      return NextResponse.json(
        { error: "Missing fileName or contentType in request body" },
        { status: 400, headers: corsHeaders }
      );
    }

    // 2. Access environment variables from process.env
    // Use non-null assertion (`!`) assuming these are set in your .env.local or environment
    // A more robust approach would be runtime checks or validation.
    const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID!;
    const R2_AVATAR_BUCKET_NAME = process.env.R2_AVATAR_BUCKET_NAME!;
    const R2_AVATAR_ACCESS_KEY_ID = process.env.R2_AVATAR_ACCESS_KEY_ID!;
    const R2_AVATAR_SECRET_ACCESS_KEY = process.env.R2_AVATAR_SECRET_ACCESS_KEY!;
    const R2_AVATAR_URL_BASE = process.env.R2_AVATAR_URL_BASE!;

    // Basic check for missing env vars (optional, but good practice)
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
    const objectKey = "avatars/" + fileName; // Use the client-provided filename

    const putCommand = new PutObjectCommand({
      Bucket: R2_AVATAR_BUCKET_NAME,
      Key: objectKey,
      ContentType: contentType, // Important: Client must use this exact Content-Type when uploading
    });

    // 5. Generate the presigned URL
    const expiresInSeconds = 300; // URL expires in 5 minutes
    const uploadUrl = await getSignedUrl(s3Client, putCommand, { expiresIn: expiresInSeconds });

    // 6. Construct the final public URL for the object
    // Ensure R2_AVATAR_URL_BASE is the public domain or R2.dev URL for your bucket
    const r2ObjectUrl = `${R2_AVATAR_URL_BASE.endsWith('/') ? R2_AVATAR_URL_BASE : R2_AVATAR_URL_BASE + '/'}${objectKey}`;


    // 7. Return the presigned URL and the final object URL to the client
    return NextResponse.json(
      { uploadUrl, r2ObjectUrl },
      { status: 200, headers: corsHeaders }
    );

  } catch (error) {
    console.error("Error generating presigned URL:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return NextResponse.json(
      { error: "Failed to generate upload URL", details: errorMessage },
      { status: 500, headers: corsHeaders }
    );
  }
}