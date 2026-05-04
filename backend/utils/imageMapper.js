const { XMLParser } = require('fast-xml-parser');
const path = require('path');

/**
 * Parse drawing anchors from xl/drawings/drawing*.xml
 * Returns array of anchors with row, col, rId, sheetName
 */
async function parseDrawingAnchors(zip) {
  const anchors = [];
  
  // Find all drawing XML files
  const drawingFiles = Object.keys(zip.files).filter(filePath => 
    filePath.match(/^xl\/drawings\/drawing\d+\.xml$/) && !zip.files[filePath].dir
  );

  console.log(`🧩 Found ${drawingFiles.length} drawing files`);

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    textNodeName: '#text',
    parseAttributeValue: true
  });

  // First, build mapping: drawingId -> sheetName from workbook relationships
  const drawingToSheetMap = {};
  
  try {
    // Read workbook relationships
    const workbookRelsPath = 'xl/_rels/workbook.xml.rels';
    if (zip.files[workbookRelsPath]) {
      const workbookRelsContent = await zip.files[workbookRelsPath].async('string');
      const workbookRels = parser.parse(workbookRelsContent);
      const relationships = workbookRels.Relationships?.Relationship || [];
      const relArray = Array.isArray(relationships) ? relationships : [relationships];
      
      // Read workbook to get sheet names
      const workbookXml = await zip.files['xl/workbook.xml'].async('string');
      const workbookParsed = parser.parse(workbookXml);
      const sheets = workbookParsed.workbook?.sheets?.sheet || [];
      const sheetsArray = Array.isArray(sheets) ? sheets : [sheets];
      
      // Map: sheet rId -> sheet name
      const sheetRIdToName = {};
      for (let i = 0; i < sheetsArray.length; i++) {
        const sheet = sheetsArray[i];
        const sheetRId = relArray.find(r => r['@_Target'] === `worksheets/sheet${i + 1}.xml`);
        if (sheetRId && sheet['@_name']) {
          sheetRIdToName[sheetRId['@_Id']] = sheet['@_name'];
        }
      }
      
      // Map: drawing rId -> sheet name
      for (const rel of relArray) {
        const target = rel['@_Target'] || '';
        if (target.startsWith('drawings/drawing')) {
          const drawingMatch = target.match(/drawing(\d+)\.xml/);
          if (drawingMatch) {
            const drawingId = drawingMatch[1];
            // Find which sheet this drawing belongs to
            // Check worksheet relationships
            for (let i = 0; i < sheetsArray.length; i++) {
              const sheetRelsPath = `xl/worksheets/_rels/sheet${i + 1}.xml.rels`;
              if (zip.files[sheetRelsPath]) {
                try {
                  const sheetRelsContent = await zip.files[sheetRelsPath].async('string');
                  const sheetRels = parser.parse(sheetRelsContent);
                  const sheetRelsArray = Array.isArray(sheetRels.Relationships?.Relationship) 
                    ? sheetRels.Relationships.Relationship 
                    : [sheetRels.Relationships?.Relationship].filter(Boolean);
                  
                  const hasDrawing = sheetRelsArray.some(r => r['@_Target'] === target);
                  if (hasDrawing && sheetsArray[i]?.['@_name']) {
                    drawingToSheetMap[drawingId] = sheetsArray[i]['@_name'];
                    break;
                  }
                } catch (e) {
                  // Continue
                }
              }
            }
          }
        }
      }
    }
  } catch (e) {
    console.warn('⚠️ Failed to build drawing-to-sheet map:', e.message);
  }

  for (const drawingFile of drawingFiles) {
    try {
      const file = zip.files[drawingFile];
      const xmlContent = await file.async('string');
      const xml = parser.parse(xmlContent);
      
      // Get drawing ID from filename
      const drawingMatch = drawingFile.match(/drawing(\d+)\.xml/);
      const drawingId = drawingMatch ? drawingMatch[1] : '1';
      
      // Get sheet name from mapping
      let sheetName = drawingToSheetMap[drawingId];
      
      // Fallback: try to get from workbook directly
      if (!sheetName) {
        try {
          const workbookXml = await zip.files['xl/workbook.xml'].async('string');
          const workbookParsed = parser.parse(workbookXml);
          const sheets = workbookParsed.workbook?.sheets?.sheet || [];
          const sheetsArray = Array.isArray(sheets) ? sheets : [sheets];
          const drawingIndex = parseInt(drawingId) - 1;
          if (sheetsArray[drawingIndex]?.['@_name']) {
            sheetName = sheetsArray[drawingIndex]['@_name'];
          }
        } catch (e) {
          // Fallback to drawing ID
        }
      }
      
      // Final fallback
      if (!sheetName) {
        sheetName = drawingId; // Use drawing ID as sheet name
      }

      // Parse anchors
      const drawing = xml['xdr:wsDr'] || xml['wsDr'] || xml;
      const twoCellAnchors = drawing['xdr:twoCellAnchor'] || drawing['twoCellAnchor'] || [];
      const oneCellAnchors = drawing['xdr:oneCellAnchor'] || drawing['oneCellAnchor'] || [];
      
      const allAnchors = [
        ...(Array.isArray(twoCellAnchors) ? twoCellAnchors : [twoCellAnchors]),
        ...(Array.isArray(oneCellAnchors) ? oneCellAnchors : [oneCellAnchors])
      ].filter(Boolean);

      for (const anchor of allAnchors) {
        try {
          // Get from position (0-based in XML, convert to 1-based Excel row)
          const from = anchor['xdr:from'] || anchor['from'] || {};
          const fromRow = (from['xdr:row'] || from['row'] || 0) + 1; // Convert to 1-based
          const fromCol = (from['xdr:col'] || from['col'] || 0) + 1; // Convert to 1-based
          
          // Get rId from pic or graphicFrame
          const pic = anchor['xdr:pic'] || anchor['pic'] || {};
          const blip = pic['a:blip'] || pic['blip'] || {};
          const embed = blip['@_r:embed'] || blip['@_embed'] || '';
          
          if (embed) {
            anchors.push({
              drawingFile,
              sheetName,
              rid: embed,
              fromRow1Based: fromRow,
              fromCol1Based: fromCol,
              publicUrl: null // Will be filled by mapRidsToMedia
            });
          }
        } catch (error) {
          console.warn(`⚠️ Failed to parse anchor in ${drawingFile}:`, error.message);
        }
      }

      console.log(`🧩 Drawing ${drawingFile} anchors found: ${allAnchors.length}`);
    } catch (error) {
      console.warn(`⚠️ Failed to parse ${drawingFile}:`, error.message);
      // Continue with other drawings
    }
  }

  return anchors;
}

/**
 * Map rId -> mediaPath -> publicUrl via rels files
 */
async function mapRidsToMedia(zip, anchors, mediaMapping) {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    textNodeName: '#text'
  });

  for (const anchor of anchors) {
    try {
      // Find corresponding rels file
      const drawingFile = anchor.drawingFile;
      const relsFile = drawingFile.replace('.xml', '.xml.rels');
      const relsPath = `xl/drawings/_rels/${path.basename(relsFile)}`;
      
      if (!zip.files[relsPath]) {
        console.warn(`⚠️ Rels file not found: ${relsPath}`);
        continue;
      }

      const relsContent = await zip.files[relsPath].async('string');
      const rels = parser.parse(relsContent);
      
      // Find relationship with matching Id
      const relationships = rels.Relationships?.Relationship || [];
      const relArray = Array.isArray(relationships) ? relationships : [relationships];
      
      const relationship = relArray.find(rel => rel['@_Id'] === anchor.rid);
      
      if (relationship) {
        let target = relationship['@_Target'] || '';
        // Normalize path (remove ../)
        target = target.replace(/^\.\.\//, '');
        if (!target.startsWith('xl/media/')) {
          target = `xl/media/${path.basename(target)}`;
        }
        
        const publicUrl = mediaMapping[target];
        if (publicUrl) {
          anchor.publicUrl = publicUrl;
          console.log(`🔗 rid ${anchor.rid} -> ${target} -> ${publicUrl}`);
        } else {
          console.warn(`⚠️ Media file not found in mapping: ${target}`);
        }
      } else {
        console.warn(`⚠️ Relationship not found for rId: ${anchor.rid}`);
      }
    } catch (error) {
      console.warn(`⚠️ Failed to map rId ${anchor.rid}:`, error.message);
      // Continue with other anchors
    }
  }
}

/**
 * Attach images to entries using heuristic mapping
 * Returns unassigned images
 */
function attachImagesToEntries(entriesBySheet, imageAnchors) {
  const unassignedImages = [];

  // Group anchors by sheet
  const anchorsBySheet = {};
  for (const anchor of imageAnchors) {
    if (!anchor.publicUrl) continue; // Skip if no URL
    
    if (!anchorsBySheet[anchor.sheetName]) {
      anchorsBySheet[anchor.sheetName] = [];
    }
    anchorsBySheet[anchor.sheetName].push(anchor);
  }

  // Process each sheet
  for (const [sheetName, entries] of Object.entries(entriesBySheet)) {
    const anchors = anchorsBySheet[sheetName] || [];
    
    if (anchors.length === 0) continue;

    // Sort anchors by row
    anchors.sort((a, b) => a.fromRow1Based - b.fromRow1Based);

    for (const anchor of anchors) {
      let attached = false;

      // Rule 1: Exact match
      const exactMatch = entries.find(e => e.excelRow === anchor.fromRow1Based);
      if (exactMatch) {
        exactMatch.images.push(anchor.publicUrl);
        attached = true;
        console.log(`🧷 Mapped image ${anchor.publicUrl} to sheet ${sheetName} entryRow ${exactMatch.excelRow} (mode=exact)`);
        continue;
      }

      // Rule 2: Nearest entry above
      const entriesAbove = entries
        .filter(e => e.excelRow < anchor.fromRow1Based)
        .sort((a, b) => b.excelRow - a.excelRow); // Sort descending
      
      if (entriesAbove.length > 0) {
        const nearestEntry = entriesAbove[0];
        nearestEntry.images.push(anchor.publicUrl);
        attached = true;
        console.log(`🧷 Mapped image ${anchor.publicUrl} to sheet ${sheetName} entryRow ${nearestEntry.excelRow} (mode=nearest)`);
        continue;
      }

      // Rule 3: Unassigned
      if (!attached) {
        unassignedImages.push({
          url: anchor.publicUrl,
          sheetName: anchor.sheetName,
          anchorRow: anchor.fromRow1Based,
          anchorCol: anchor.fromCol1Based
        });
        console.log(`🧷 Mapped image ${anchor.publicUrl} to sheet ${sheetName} entryRow N/A (mode=unassigned)`);
      }
    }
  }

  return unassignedImages;
}

module.exports = {
  parseDrawingAnchors,
  mapRidsToMedia,
  attachImagesToEntries
};

