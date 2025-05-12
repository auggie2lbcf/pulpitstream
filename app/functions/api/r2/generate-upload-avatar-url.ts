import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Import PagesFunction type from Cloudflare Workers environment
import type { PagesFunction } from '@cloudflare/workers-types';

// Define the expected structure of the environment variables (secrets)
// This provides type safety when accessing env.
export interface Env {
    R2_ACCOUNT_ID: string;
    R2_AVATAR_BUCKET_NAME: string;
    R2_AVATAR_ACCESS_KEY_ID: string;
    R2_AVATAR_SECRET_ACCESS_KEY: string;
    R2_AVATAR_URL_BASE: string; // e.g., https://yourdomain.com/avatars or https://pub-yourid.r2.dev
}

// Define the expected request body from the client
interface UploadRequestBody {
    fileName: string;
    contentType: string;
}

// This is the onRequestPost handler for Cloudflare Pages Functions.
// It will specifically handle POST requests to /api/r2/generate-upload-avatar-url
export const onRequestPost: PagesFunction<Env> = async (context): Promise<import('@cloudflare/workers-types').Response> => {
    const { request, env } = context;
    try {
        // 1. Parse the request body from the client
        let requestBody: UploadRequestBody;
        try {
            requestBody = await request.json();
        } catch (e) {
            return new (Response as any)(JSON.stringify({ error: "Invalid JSON body" }), {
                status: 400,
                headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }, // Add CORS
            });
        }

        const { fileName, contentType } = requestBody;

        if (!fileName || !contentType) {
            return new (Response as any)(JSON.stringify({ error: "Missing fileName or contentType" }), {
                status: 400,
                headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }, // Add CORS
            });
        }

        // 2. Configure the S3 client to interact with Cloudflare R2
        // R2 is S3-compatible, so we use the S3Client.
        const s3Client = new S3Client({
            region: "auto", // R2 doesn't use regions in the same way AWS S3 does; 'auto' is fine.
            endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
            credentials: {
                accessKeyId: env.R2_AVATAR_ACCESS_KEY_ID,
                secretAccessKey: env.R2_AVATAR_SECRET_ACCESS_KEY,
            },
        });

        // 3. Define the parameters for the S3 PutObjectCommand
        // This is what we are granting permission to do with the presigned URL.
        // The objectKey is how the file will be named in your R2 bucket.
        // We use the fileName provided by the client (which should be unique).
        const objectKey = fileName; // Example: "avatar-user123-timestamp-random.png"

        const putCommand = new PutObjectCommand({
            Bucket: env.R2_AVATAR_BUCKET_NAME,
            Key: objectKey,
            ContentType: contentType, // The client must send this exact Content-Type when PUTting the file
            // You can add other parameters like ACL (though R2 handles public access differently),
            // or Metadata for custom metadata.
        });

        // 4. Generate the presigned URL
        // This URL will allow a PUT request to the specified object key.
        // It's valid for a limited time (default is 15 minutes, you can set `expiresIn`).
        const expiresInSeconds = 300; // 5 minutes
        const uploadUrl = await getSignedUrl(s3Client, putCommand, { expiresIn: expiresInSeconds });

        // 5. Construct the final public URL for the object
        // This is the URL the client will use to *access* the image after it's uploaded.
        // Ensure your R2_AVATAR_URL_BASE is set correctly. If it doesn't end with a '/', add one.
        const r2ObjectUrl = `${env.R2_AVATAR_URL_BASE.endsWith('/') ? env.R2_AVATAR_URL_BASE : env.R2_AVATAR_URL_BASE + '/'}${objectKey}`;

        // 6. Return the presigned URL and the final object URL to the client
        return new (Response as any)(JSON.stringify({ uploadUrl, r2ObjectUrl }), {
            status: 200,
            headers: {
                "Content-Type": "application/json",
                // Important for local development and if your Pages domain is different from the
                // domain your client is running on (though usually for Pages->Functions this is seamless)
                "Access-Control-Allow-Origin": "*", // Be more specific in production if possible
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, Authorization", // Include Authorization if you use it
            },
        });

    } catch (error) {
        console.error("Error generating presigned URL:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return new (Response as any)(JSON.stringify({ error: "Failed to generate upload URL", details: errorMessage }), {
            status: 500,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }, // Add CORS
        });
    }
};

// Optional: Handle OPTIONS requests for CORS preflight
export const onRequestOptions: PagesFunction<Env> = async () => {
    return new (Response as any)(null, {
        status: 204, // No Content
        headers: {
            "Access-Control-Allow-Origin": "*", // Adjust for production
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization", // And any other headers your client sends
            "Access-Control-Max-Age": "86400", // Cache preflight response for 1 day
        },
    }) as unknown as import('@cloudflare/workers-types').Response;
};