import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { ReadStream } from 'fs';

let configured = false;

function ensureConfigured() {
  if (configured) return;
  const cloud_name = process.env.CLOUDINARY_CLOUD_NAME;
  const api_key = process.env.CLOUDINARY_API_KEY;
  const api_secret = process.env.CLOUDINARY_API_SECRET;

  if (!cloud_name || !api_key || !api_secret) {
    throw new Error(
      'Cloudinary credentials missing. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in .env',
    );
  }

  cloudinary.config({
    cloud_name,
    api_key,
    api_secret,
    secure: true,
  });
  configured = true;
}

/**
 * Upload a readable stream to Cloudinary and return the secure URL.
 * @param stream - the file stream from graphql-upload
 * @param folder - logical folder ("member", "partnerProperties", "attractions")
 */
export function uploadStreamToCloudinary(
  stream: ReadStream,
  folder: string,
): Promise<string> {
  ensureConfigured();

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `lanka-stay/${folder}`,
        resource_type: 'image',
      },
      (error, result?: UploadApiResponse) => {
        if (error) {
          console.error('[Cloudinary] Upload failed:', error);
          if ((error as any).http_code === 403) {
            return reject(
              new Error(
                'Cloudinary 403 — your API key is missing upload permissions. ' +
                  'In the Cloudinary Console go to Settings → API Keys and use a key with Upload + Read + Write permissions.',
              ),
            );
          }
          return reject(error);
        }
        if (!result) return reject(new Error('Cloudinary returned no result'));
        resolve(result.secure_url);
      },
    );
    stream.pipe(uploadStream);
  });
}
