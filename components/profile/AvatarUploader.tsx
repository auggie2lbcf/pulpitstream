'use client';

import { useState, useRef, ChangeEvent } from 'react';
import { ArrowUpIcon, CameraIcon } from 'lucide-react';
import Image from 'next/image';

export interface AvatarUploaderProps {
  initialUrl?: string;
  onUploadComplete: (newUrl: string) => void;
  disabled?: boolean;
  maxSizeMB?: number;
}

export function AvatarUploader({
  initialUrl = '',
  onUploadComplete,
  disabled = false,
  maxSizeMB = 5,
}: AvatarUploaderProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>(initialUrl);
  const [uploading, setUploading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const validateFile = (file: File): string | null => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const sizeLimit = maxSizeMB * 1024 * 1024;

    if (!allowedTypes.includes(file.type)) {
      return 'Only JPG, PNG, WEBP, and GIF files are allowed.';
    }

    if (file.size > sizeLimit) {
      return `File too large. Max size is ${maxSizeMB}MB.`;
    }

    return null;
  };

  const generateUniqueFileName = (originalName: string): string => {
    const extension = originalName.split('.').pop();
    return `avatar-${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${extension}`;
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setSelectedFile(file);
    setPreviewUrl(objectUrl);
    setError(null);
    setSuccessMessage(null);

    try {
      await uploadAvatar(file);
    } catch (err) {
      console.error('Upload failed:', err);
    }
  };

  const uploadAvatar = async (file: File) => {
    setUploading(true);
    setError(null);
    setSuccessMessage(null);

    const fileName = generateUniqueFileName(file.name);

    try {
      // Request a presigned URL
      const response = await fetch('/api/r2/upload-avatar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName,
          contentType: file.type,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to get upload URL.');
      }

      const { uploadUrl, r2ObjectUrl } = await response.json();

      if (!uploadUrl || !r2ObjectUrl) {
        throw new Error('Invalid response from upload endpoint.');
      }

      // Upload the image to R2
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });

      if (!uploadResponse.ok) {
        const text = await uploadResponse.text();
        throw new Error(`Upload failed: ${text}`);
      }

      setSuccessMessage('Upload successful!');
      onUploadComplete(r2ObjectUrl);
    } catch (err: any) {
      setError(err?.message || 'Upload failed.');
      throw err;
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setPreviewUrl(initialUrl);
    setError(null);
    setSuccessMessage(null);
  };

  return (
    <div>
      <p className="block text-sm font-medium text-gray-700">Profile Picture</p>

      <div className="mt-2 flex items-center space-x-4">
        <div className="h-20 w-20 rounded-full overflow-hidden bg-gray-100 relative">
          {previewUrl ? (
            <Image src={previewUrl} alt="Avatar Preview" fill className="object-cover" />
          ) : (
            <CameraIcon className="w-full h-full text-gray-400 p-4" />
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="avatar-upload"
            className={`cursor-pointer inline-flex items-center gap-2 py-2 px-3 border rounded-md shadow-sm text-sm font-medium focus:outline-none ${
              disabled || uploading
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500'
            }`}
          >
            <ArrowUpIcon className="w-4 h-4" />
            {selectedFile ? 'Change image' : 'Upload image'}
            <input
              ref={inputRef}
              id="avatar-upload"
              name="avatar-upload"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="sr-only"
              onChange={handleFileChange}
              disabled={disabled || uploading}
            />
          </label>

          {selectedFile && (
            <button
              type="button"
              onClick={handleCancel}
              disabled={uploading}
              className="text-sm text-gray-500 hover:underline"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      {uploading && <p className="mt-2 text-sm text-blue-600">Uploading image...</p>}
      {successMessage && <p className="mt-2 text-sm text-green-600">{successMessage}</p>}
      <p className="mt-1 text-xs text-gray-500">Max size: {maxSizeMB}MB. JPG, PNG, WEBP, or GIF only.</p>
    </div>
  );
}
