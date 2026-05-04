const XLSX = require('xlsx');
const JSZip = require('jszip');
const { XMLParser } = require('fast-xml-parser');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { parseDutyLogsFromWorkbook } = require('./excelParser');
const { extractMediaFiles } = require('./imageExtractor');
const { parseDrawingAnchors, mapRidsToMedia, attachImagesToEntries } = require('./imageMapper');

/**
 * Main function: Import Excel file with embedded images
 * @param {Buffer} buffer - Excel file buffer
 * @param {string} originalName - Original filename
 * @returns {Promise<Object>} Import result with days and unassignedImages
 */
async function importXlsxWithImages(buffer, originalName) {
  console.log('📋 Starting Excel import with image extraction...');

  // [1] Parse duty log entries (ข้อความ)
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const { days, entriesBySheet } = await parseDutyLogsFromWorkbook(workbook);
  
  console.log(`✅ Parsed ${Object.keys(days).length} days with entries`);

  // [2] Extract media files from xl/media
  let mediaMapping = {};
  let zip = null;
  
  try {
    zip = await JSZip.loadAsync(buffer);
    mediaMapping = await extractMediaFiles(zip, originalName);
    console.log(`🗜️ Zip media files found: ${Object.keys(mediaMapping).length}`);
  } catch (error) {
    console.warn('⚠️ Failed to extract media files:', error.message);
    // Continue without images
  }

  // [3-4] Parse drawing anchors and map rId -> mediaPath
  let imageAnchors = [];
  
  if (zip && Object.keys(mediaMapping).length > 0) {
    try {
      imageAnchors = await parseDrawingAnchors(zip);
      console.log(`🧩 Total drawing anchors found: ${imageAnchors.length}`);
      
      // Map rId -> mediaPath -> publicUrl
      await mapRidsToMedia(zip, imageAnchors, mediaMapping);
      console.log(`🔗 Mapped ${imageAnchors.filter(a => a.publicUrl).length} images to anchors`);
    } catch (error) {
      console.warn('⚠️ Failed to parse drawing anchors:', error.message);
      // Continue without image mapping
    }
  }

  // [5] Map images to entries
  let unassignedImages = [];
  
  if (imageAnchors.length > 0) {
    try {
      unassignedImages = attachImagesToEntries(entriesBySheet, imageAnchors);
      console.log(`🧷 Mapped images to entries. Unassigned: ${unassignedImages.length}`);
    } catch (error) {
      console.warn('⚠️ Failed to attach images to entries:', error.message);
      // Add all images as unassigned
      imageAnchors.forEach(anchor => {
        if (anchor.publicUrl && !unassignedImages.find(u => u.url === anchor.publicUrl)) {
          unassignedImages.push({
            url: anchor.publicUrl,
            sheetName: anchor.sheetName,
            anchorRow: anchor.fromRow1Based,
            anchorCol: anchor.fromCol1Based
          });
        }
      });
    }
  }

  // [6] Prepare result
  const result = {
    days
  };

  if (unassignedImages.length > 0) {
    result.unassignedImages = unassignedImages;
  }

  return result;
}

module.exports = {
  importXlsxWithImages
};

