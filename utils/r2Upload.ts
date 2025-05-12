async function uploadAvatarToR2(
    file: File,
    // These would typically be part of your component's state/context
    setIsUploading: (isUploading: boolean) => void,
    setFeedbackMessage: (feedback: { text: string, type: 'info' | 'success' | 'error' }) => void
): Promise<string> {
    setIsUploading(true);
    setFeedbackMessage({ text: 'Preparing to upload avatar...', type: 'info' });

    // Generate a unique filename or use the original; your backend Pages Function will ultimately decide the key.
    const clientSideFileName = generateUniqueFileName(file.name);

    try {
        // ** START: ACTUAL R2 UPLOAD LOGIC **

        // Step 1: Request a presigned URL from your Cloudflare Pages Function.
        // This path should correspond to a function in your /functions directory
        // (e.g., /functions/api/r2/generate-upload-avatar-url.ts)
        setFeedbackMessage({ text: 'Requesting upload permission...', type: 'info' });
        const presignedUrlResponse = await fetch('/api/r2/generate-upload-avatar-url', { // This is your Pages Function endpoint
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Add any authentication headers if your Pages Function requires them
            },
            body: JSON.stringify({
                fileName: clientSideFileName,
                contentType: file.type,
            }),
        });

        if (!presignedUrlResponse.ok) {
            let errorMessage = `Failed to get upload URL: ${presignedUrlResponse.statusText}`;
            try {
                const errorData = await presignedUrlResponse.json();
                errorMessage = errorData.message || errorData.error || errorMessage;
            } catch (e) {
                // Could not parse JSON, stick with statusText
            }
            throw new Error(errorMessage);
        }

        const { uploadUrl, r2ObjectUrl }: PresignedUrlResponse = await presignedUrlResponse.json();

        if (!uploadUrl || !r2ObjectUrl) {
            throw new Error('Invalid response from presigned URL endpoint: missing uploadUrl or r2ObjectUrl.');
        }

        // Step 2: Upload the file directly to R2 using the presigned URL.
        setFeedbackMessage({ text: 'Uploading avatar...', type: 'info' });
        console.log(`Uploading ${file.name} to R2 via presigned URL...`);

        const uploadResponse = await fetch(uploadUrl, {
            method: 'PUT',
            body: file,
            headers: {
                'Content-Type': file.type,
            },
        });

        if (!uploadResponse.ok) {
            const r2ErrorText = await uploadResponse.text();
            console.error('R2 Upload Error Response:', r2ErrorText);
            let detailedErrorMessage = `Failed to upload to R2: ${uploadResponse.statusText}`;
            if (r2ErrorText) {
                const messageMatch = r2ErrorText.match(/<Message>(.*?)<\/Message>/i);
                if (messageMatch && messageMatch[1]) {
                    detailedErrorMessage += `. R2 Message: ${messageMatch[1]}`;
                } else {
                    detailedErrorMessage += `. Details: ${r2ErrorText.substring(0, 200)}`;
                }
            }
            throw new Error(detailedErrorMessage);
        }

        console.log(`Successfully uploaded ${file.name} to R2. Object URL: ${r2ObjectUrl}`);
        // ** END: ACTUAL R2 UPLOAD LOGIC **

        setFeedbackMessage({ text: 'Avatar uploaded successfully!', type: 'success' });
        setIsUploading(false);
        return r2ObjectUrl;

    } catch (error) {
        console.error('Error uploading avatar to R2:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during upload.';
        setFeedbackMessage({ text: `Upload failed: ${errorMessage}`, type: 'error' });
        setIsUploading(false);
        throw error;
    }
}