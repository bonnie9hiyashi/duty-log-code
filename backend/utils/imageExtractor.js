const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * Extract media files from xl/media/ and save to uploads/
 * Returns mapping: mediaPath -> publicUrl
 */
async function extractMediaFiles(zip, originalName) {
  const mediaMapping = {};
  const uploadsDir = path.join(__dirname, '..', 'uploads');
  
  // Ensure uploads directory exists
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Find all files in xl/media/
  const mediaFiles = Object.keys(zip.files).filter(filePath => 
    filePath.startsWith('xl/media/') && !zip.files[filePath].dir
  );

  console.log(`🗜️ Zip media files found: ${mediaFiles.length}`);

  // Extract each media file
  for (const mediaPath of mediaFiles) {
    try {
      const file = zip.files[mediaPath];
      const buffer = await file.async('nodebuffer');
      
      // Generate unique filename
      const ext = path.extname(mediaPath) || '.png';
      const baseName = path.basename(mediaPath, ext);
      const hash = crypto.createHash('md5').update(buffer).digest('hex').substring(0, 8);
      const timestamp = Date.now();
      const fileName = `${timestamp}_${hash}_${baseName}${ext}`;
      const filePath = path.join(uploadsDir, fileName);
      
      // Save file
      fs.writeFileSync(filePath, buffer);
      
      // Create public URL
      const publicUrl = `/uploads/${fileName}`;
      mediaMapping[mediaPath] = publicUrl;
      
      console.log(`🖼️ Saved media ${mediaPath} -> ${publicUrl}`);
    } catch (error) {
      console.warn(`⚠️ Failed to extract ${mediaPath}:`, error.message);
      // Continue with other files
    }
  }

  return mediaMapping;
}

module.exports = {
  extractMediaFiles
};

