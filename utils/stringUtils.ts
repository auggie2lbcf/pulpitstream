function generateUniqueFileName(originalFileName: string): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    // Ensure the extension is correctly captured, even if filename has multiple dots.
    const lastDotIndex = originalFileName.lastIndexOf('.');
    const extension = lastDotIndex === -1 ? '' : originalFileName.substring(lastDotIndex);
    const nameWithoutExtension = lastDotIndex === -1 ? originalFileName : originalFileName.substring(0, lastDotIndex);
    // Sanitize nameWithoutExtension if needed (e.g., remove special characters)
    return `avatar-${nameWithoutExtension.replace(/[^a-zA-Z0-9_-]/g, '')}-${timestamp}-${randomString}${extension}`;
}

// Interface for the expected response from your backend Pages Function
interface PresignedUrlResponse {
    uploadUrl: string;    // The presigned URL to PUT the file to
    r2ObjectUrl: string;  // The final, publicly accessible URL of the uploaded object
}