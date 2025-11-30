import { WALRUS_PUBLISHER, WALRUS_AGGREGATOR } from '../config/constants';

/**
 * Upload data to Walrus
 * @param data - The data to upload (string or Blob)
 * @returns The blob ID from Walrus
 */
export async function uploadToWalrus(data: string | Blob): Promise<string> {
  try {
    const blob = typeof data === 'string' ? new Blob([data], { type: 'text/plain' }) : data;

    console.log('Uploading to Walrus:', {
      url: `${WALRUS_PUBLISHER}/v1/blobs`,
      blobSize: blob.size,
      blobType: blob.type
    });

    const response = await fetch(`${WALRUS_PUBLISHER}/v1/blobs`, {
      method: 'PUT',
      body: blob,
      headers: {
        'Content-Type': blob.type || 'application/octet-stream',
      },
    });

    console.log('Walrus response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Walrus upload error response:', errorText);
      console.error('Response headers:', Object.fromEntries(response.headers.entries()));
      throw new Error(`Walrus upload failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    console.log('Walrus upload success:', result);

    // Walrus response format: { newlyCreated: { blobObject: { blobId: "..." } } }
    // or { alreadyCertified: { blobId: "..." } }
    const blobId = result.newlyCreated?.blobObject?.blobId || result.alreadyCertified?.blobId;

    if (!blobId) {
      console.error('No blob ID in response:', result);
      throw new Error('No blob ID returned from Walrus');
    }

    console.log('Upload successful, blob ID:', blobId);
    return blobId;
  } catch (error) {
    console.error('Failed to upload to Walrus:', error);
    throw error;
  }
}

/**
 * Read data from Walrus
 * @param blobId - The blob ID to read
 * @returns The data as text
 */
export async function readFromWalrus(blobId: string): Promise<string> {
  try {
    console.log('Reading from Walrus:', {
      url: `${WALRUS_AGGREGATOR}/v1/blobs/${blobId}`,
      blobId
    });

    const response = await fetch(`${WALRUS_AGGREGATOR}/v1/blobs/${blobId}`);

    console.log('Walrus read response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });

    if (!response.ok) {
      throw new Error(`Walrus read failed: ${response.statusText}`);
    }

    const text = await response.text();
    console.log('Walrus read success:', { blobId, textLength: text.length, preview: text.substring(0, 50) });
    return text;
  } catch (error) {
    console.error('Failed to read from Walrus:', error);
    throw error;
  }
}

/**
 * Get Walrus URL for a blob
 * @param blobId - The blob ID
 * @returns The full URL to access the blob
 */
export function getWalrusUrl(blobId: string): string {
  return `${WALRUS_AGGREGATOR}/v1/blobs/${blobId}`;
}

/**
 * Upload an image to Walrus
 * @param file - The image file
 * @returns The blob ID
 */
export async function uploadImage(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('File must be an image');
  }

  return uploadToWalrus(file);
}

/**
 * Generate a default avatar blob ID (using DiceBear API)
 * @param seed - The seed for avatar generation (e.g., wallet address)
 * @returns A blob ID (in this case, we'll use a data URL as fallback)
 */
export function getDefaultAvatarUrl(seed: string): string {
  // Use DiceBear API for default avatars
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
}
