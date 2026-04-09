/**
 * One-time migration script: uploads all files in ./uploads/ to Cloudinary
 * and updates the corresponding MongoDB documents to point at the new URLs.
 *
 * Run with:
 *   npx ts-node scripts/migrate-uploads-to-cloudinary.ts
 *
 * Make sure CLOUDINARY_* env vars are set in .env first.
 */
import 'dotenv/config';
import { v2 as cloudinary } from 'cloudinary';
import * as mongoose from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const MONGO_URI = process.env.MONGO_PROD || process.env.MONGO_DEV;
if (!MONGO_URI) {
  console.error('Missing MONGO_PROD / MONGO_DEV env var');
  process.exit(1);
}

const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');

async function uploadOne(filePath: string, folder: string): Promise<string> {
  const result = await cloudinary.uploader.upload(filePath, {
    folder: `lanka-stay/${folder}`,
    resource_type: 'image',
  });
  return result.secure_url;
}

async function buildPathMap(): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (!fs.existsSync(UPLOADS_DIR)) {
    console.log('No uploads/ folder found, nothing to migrate.');
    return map;
  }

  const folders = fs.readdirSync(UPLOADS_DIR).filter((f) => {
    return fs.statSync(path.join(UPLOADS_DIR, f)).isDirectory();
  });

  for (const folder of folders) {
    const folderPath = path.join(UPLOADS_DIR, folder);
    const files = fs.readdirSync(folderPath);
    console.log(`Uploading ${files.length} files from ${folder}/...`);

    for (const file of files) {
      const fullPath = path.join(folderPath, file);
      const oldPath = `uploads/${folder}/${file}`;
      try {
        const newUrl = await uploadOne(fullPath, folder);
        map.set(oldPath, newUrl);
        console.log(`  ✓ ${oldPath} → ${newUrl}`);
      } catch (err) {
        console.error(`  ✗ Failed: ${oldPath}`, err);
      }
    }
  }

  return map;
}

async function updateDocs(pathMap: Map<string, string>) {
  if (pathMap.size === 0) {
    console.log('Nothing to update in DB.');
    return;
  }

  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection.db;

  // Guests: guestImage (single string)
  console.log('\nUpdating Guest.guestImage...');
  let guestCount = 0;
  for (const [oldPath, newUrl] of pathMap.entries()) {
    const res = await db
      .collection('guests')
      .updateMany({ guestImage: oldPath }, { $set: { guestImage: newUrl } });
    guestCount += res.modifiedCount;
  }
  console.log(`  Updated ${guestCount} guest(s)`);

  // PartnerProperties: propertyImages (array of strings)
  console.log('Updating PartnerProperty.propertyImages...');
  let propCount = 0;
  for (const [oldPath, newUrl] of pathMap.entries()) {
    const res = await db
      .collection('partnerproperties')
      .updateMany(
        { propertyImages: oldPath },
        { $set: { 'propertyImages.$[el]': newUrl } },
        { arrayFilters: [{ el: oldPath }] },
      );
    propCount += res.modifiedCount;
  }
  console.log(`  Updated ${propCount} property record(s)`);

  // Attractions: attractionImages (array of strings)
  console.log('Updating Attraction.attractionImages...');
  let attrCount = 0;
  for (const [oldPath, newUrl] of pathMap.entries()) {
    const res = await db
      .collection('attractions')
      .updateMany(
        { attractionImages: oldPath },
        { $set: { 'attractionImages.$[el]': newUrl } },
        { arrayFilters: [{ el: oldPath }] },
      );
    attrCount += res.modifiedCount;
  }
  console.log(`  Updated ${attrCount} attraction record(s)`);

  await mongoose.disconnect();
}

(async () => {
  console.log('Starting Cloudinary migration...\n');
  const pathMap = await buildPathMap();
  console.log(`\nUploaded ${pathMap.size} file(s) to Cloudinary.\n`);
  await updateDocs(pathMap);
  console.log('\n✅ Migration complete.');
})();
