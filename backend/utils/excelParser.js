const XLSX = require('xlsx');

/**
 * Parse duty log entries from workbook
 * Returns entries with excelRow index for image mapping
 */
async function parseDutyLogsFromWorkbook(workbook) {
  const days = {};
  const entriesBySheet = {}; // { sheetName: [entries] }

  // Helper: Get cell value
  const getCellValue = (ws, cellAddress) => {
    const cell = ws[cellAddress];
    if (!cell) return '';
    if (cell.v === null || cell.v === undefined) return '';
    if (typeof cell.v === 'string') return cell.v;
    if (typeof cell.v === 'number') return String(cell.v);
    if (typeof cell.v === 'boolean') return String(cell.v);
    if (cell.v instanceof Date) return cell.v.toISOString();
    return String(cell.v);
  };

  // Helper: Parse date from "Date: 23 October 2025"
  const parseHotelDateToISO = (dateText) => {
    if (!dateText || !dateText.trim()) return null;
    
    const text = dateText.trim();
    const monthNames = [
      'january', 'february', 'march', 'april', 'may', 'june',
      'july', 'august', 'september', 'october', 'november', 'december'
    ];
    
    // "Date: DD Month YYYY"
    const monthNameMatch = text.match(/Date:\s*(\d{1,2})\s+([a-z]+)\s+(\d{4})/i);
    if (monthNameMatch) {
      const day = parseInt(monthNameMatch[1]);
      const monthName = monthNameMatch[2].toLowerCase();
      const year = parseInt(monthNameMatch[3]);
      const monthIndex = monthNames.findIndex(m => m.startsWith(monthName));
      if (monthIndex >= 0) {
        const month = monthIndex + 1;
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      }
    }
    
    // "Date: DD/MM/YYYY"
    const dateMatch = text.match(/Date:\s*(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (dateMatch) {
      const day = parseInt(dateMatch[1]);
      const month = parseInt(dateMatch[2]);
      const year = parseInt(dateMatch[3]);
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
    
    return null;
  };

  // Helper: Find cell containing text
  const findCellContains = (ws, searchText) => {
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    for (let row = range.s.r; row <= range.e.r; row++) {
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
        const cell = ws[cellAddress];
        if (cell && cell.v) {
          const cellValue = String(cell.v);
          if (cellValue.includes(searchText)) {
            return cellValue;
          }
        }
      }
    }
    return '';
  };

  // Helper: Check if row is section header
  const isSectionHeader = (row, ws) => {
    const cellA = getCellValue(ws, XLSX.utils.encode_cell({ r: row, c: 0 }));
    const cellB = getCellValue(ws, XLSX.utils.encode_cell({ r: row, c: 1 }));
    const cellC = getCellValue(ws, XLSX.utils.encode_cell({ r: row, c: 2 }));
    const cellD = getCellValue(ws, XLSX.utils.encode_cell({ r: row, c: 3 }));
    
    const textA = cellA.trim();
    const textB = cellB.trim();
    const textC = cellC.trim();
    const textD = cellD.trim();
    
    const nonEmptyCells = [textA, textB, textC, textD].filter(t => t.length > 0);
    
    // Check if all cells have same text (merged header)
    if (nonEmptyCells.length >= 2) {
      const firstText = nonEmptyCells[0];
      const allSame = nonEmptyCells.every(t => t === firstText);
      if (allSame && firstText.length < 60) {
        const lower = firstText.toLowerCase();
        const isHeaderLike = 
          lower.includes('related') ||
          (lower.includes('check') && lower.includes('out')) ||
          lower.includes('early') ||
          lower.includes('late') ||
          lower.includes('f & b') ||
          lower.includes('f&b') ||
          (lower.includes('food') && lower.includes('beverage'));
        
        if (isHeaderLike) {
          return { isHeader: true, category: firstText };
        }
      }
    }
    
    return { isHeader: false };
  };

  // Parse each sheet
  for (const sheetName of workbook.SheetNames) {
    // Skip non-day sheets (only process sheets that are numbers like "22", "23")
    if (!/^\d+$/.test(sheetName)) {
      console.log(`⏭️ Skipping sheet "${sheetName}" (not a day number)`);
      continue;
    }

    const ws = workbook.Sheets[sheetName];
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    
    // Find date
    const dateText = findCellContains(ws, "Date:");
    const dateISO = parseHotelDateToISO(dateText);
    
    if (!dateISO) {
      console.warn(`  ⚠️ Sheet "${sheetName}": ไม่พบวันที่, ข้าม`);
      continue;
    }

    // Find header row (DM/Time, Guest Name/Location, Details/Issue, Action Taken)
    let headerRow = -1;
    for (let row = range.s.r; row <= Math.min(range.e.r, 20); row++) {
      const cellA = getCellValue(ws, XLSX.utils.encode_cell({ r: row, c: 0 }));
      const cellB = getCellValue(ws, XLSX.utils.encode_cell({ r: row, c: 1 }));
      const cellC = getCellValue(ws, XLSX.utils.encode_cell({ r: row, c: 2 }));
      const cellD = getCellValue(ws, XLSX.utils.encode_cell({ r: row, c: 3 }));
      
      if (cellA.includes('DM') && cellA.includes('Time') &&
          (cellB.includes('Guest') || cellB.includes('Location')) &&
          (cellC.includes('Details') || cellC.includes('Issue')) &&
          (cellD.includes('Action') || cellD.includes('Taken'))) {
        headerRow = row;
        break;
      }
    }
    
    if (headerRow === -1) {
      headerRow = 5; // default
    }

    // Parse header info (MOD, DM shifts, etc.)
    // ขยายการสแกนให้ครอบคลุมมากขึ้น (row 0-15, col 0-5) เพื่อหา header ที่อาจอยู่ตำแหน่งต่างๆ
    const header = {
      dateISO: dateISO,
      mod: '',
      dmMorning: '',
      dmAfternoon: '',
      dmNight: '',
      arrivalRooms: 0,
      departureRooms: 0,
      occupancyPercent: 0
    };

    // สแกนในช่วงที่กว้างขึ้น (row 0-15, col 0-5 = A-F)
    for (let row = 0; row <= 15; row++) {
      for (let col = 0; col <= 5; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
        const cellValue = getCellValue(ws, cellAddress);
        if (!cellValue) continue;
        
        const text = cellValue.trim();
        
        // Parse MOD - รองรับรูปแบบต่างๆ: "MOD:", "MOD :", "MOD : ", "MOD: Name"
        if (text.match(/^MOD\s*:\s*/i)) {
          const match = text.match(/^MOD\s*:\s*(.+)/i);
          if (match && match[1]) {
            header.mod = match[1].trim();
            console.log(`  ✅ Found MOD: "${header.mod}" at row ${row + 1}, col ${col + 1}`);
          }
        } 
        // Parse DM Morning Shift - รองรับรูปแบบต่างๆ
        else if (text.match(/^DM\s+Morning\s+Shift\s*:\s*/i)) {
          const match = text.match(/^DM\s+Morning\s+Shift\s*:\s*(.+)/i);
          if (match && match[1]) {
            header.dmMorning = match[1].trim();
            console.log(`  ✅ Found DM Morning: "${header.dmMorning}" at row ${row + 1}, col ${col + 1}`);
          }
        } 
        // Parse DM Afternoon Shift
        else if (text.match(/^DM\s+Afternoon\s+Shift\s*:\s*/i)) {
          const match = text.match(/^DM\s+Afternoon\s+Shift\s*:\s*(.+)/i);
          if (match && match[1]) {
            header.dmAfternoon = match[1].trim();
            console.log(`  ✅ Found DM Afternoon: "${header.dmAfternoon}" at row ${row + 1}, col ${col + 1}`);
          }
        } 
        // Parse DM Night Shift
        else if (text.match(/^DM\s+Night\s+Shift\s*:\s*/i)) {
          const match = text.match(/^DM\s+Night\s+Shift\s*:\s*(.+)/i);
          if (match && match[1]) {
            header.dmNight = match[1].trim();
            console.log(`  ✅ Found DM Night: "${header.dmNight}" at row ${row + 1}, col ${col + 1}`);
          }
        } 
        // Parse Arrival - รองรับ "Arrival : 10 Rooms" หรือ "Arrival: 10"
        else if (text.match(/^Arrival\s*:\s*/i)) {
          // ลองหาเลขที่ตามหลัง "Arrival :" (อาจมี "Rooms" หรือไม่)
          const match = text.match(/^Arrival\s*:\s*(\d+)/i);
          if (match && match[1]) {
            header.arrivalRooms = parseInt(match[1], 10);
            console.log(`  ✅ Found Arrival: ${header.arrivalRooms} at row ${row + 1}, col ${col + 1}`);
          }
        } 
        // Parse Departure - รองรับ "Departure : 5 Rooms" หรือ "Departure: 5"
        else if (text.match(/^Departure\s*:\s*/i)) {
          const match = text.match(/^Departure\s*:\s*(\d+)/i);
          if (match && match[1]) {
            header.departureRooms = parseInt(match[1], 10);
            console.log(`  ✅ Found Departure: ${header.departureRooms} at row ${row + 1}, col ${col + 1}`);
          }
        } 
        // Parse Occupancy - รองรับ "Occupancy : 85%" หรือ "Occupancy: 85"
        else if (text.match(/^Occupancy\s*:\s*/i)) {
          // ลองหาเลขทศนิยม (อาจมี % หรือไม่)
          const match = text.match(/^Occupancy\s*:\s*([\d.]+)/i);
          if (match && match[1]) {
            header.occupancyPercent = parseFloat(match[1]);
            console.log(`  ✅ Found Occupancy: ${header.occupancyPercent}% at row ${row + 1}, col ${col + 1}`);
          }
        }
      }
    }
    
    // Debug: แสดงผลการ parse header
    console.log(`  📋 Sheet "${sheetName}" header parsed:`, {
      mod: header.mod || '(empty)',
      dmMorning: header.dmMorning || '(empty)',
      dmAfternoon: header.dmAfternoon || '(empty)',
      dmNight: header.dmNight || '(empty)',
      arrival: header.arrivalRooms || 0,
      departure: header.departureRooms || 0,
      occupancy: header.occupancyPercent || 0
    });

    // Parse entries
    const entries = [];
    let currentCategory = '';
    
    for (let row = headerRow + 1; row <= range.e.r; row++) {
      // Check if section header
      const headerCheck = isSectionHeader(row, ws);
      if (headerCheck.isHeader) {
        currentCategory = headerCheck.category || '';
        continue;
      }

      const cellA = getCellValue(ws, XLSX.utils.encode_cell({ r: row, c: 0 }));
      const cellB = getCellValue(ws, XLSX.utils.encode_cell({ r: row, c: 1 }));
      const cellC = getCellValue(ws, XLSX.utils.encode_cell({ r: row, c: 2 }));
      const cellD = getCellValue(ws, XLSX.utils.encode_cell({ r: row, c: 3 }));
      
      // Skip empty rows
      if (!cellA && !cellB && !cellC && !cellD) continue;
      if (!cellC && !cellD) continue;

      // Parse DM/Time
      const dmTimeParts = cellA.split('/');
      const dmName = dmTimeParts[0]?.trim() || '';
      const incidentTime = dmTimeParts.length > 1 ? dmTimeParts.slice(1).join('/').trim() : '';

      // Create entry with excelRow (1-based, same as Excel row number)
      const entry = {
        id: `imported-${Date.now()}-${row}-${Math.random()}`,
        dmTime: cellA || '',
        guestText: cellB || '',
        details: cellC || '',
        actionTaken: cellD || '',
        category: currentCategory || undefined,
        images: [], // Will be populated by image mapper
        excelRow: row + 1, // Convert 0-based to 1-based Excel row
        sheetName: sheetName
      };

      entries.push(entry);
    }

    // Store entries
    if (!days[dateISO]) {
      days[dateISO] = {
        header,
        entries: []
      };
    }
    
    days[dateISO].entries.push(...entries);
    entriesBySheet[sheetName] = entries;
    
    console.log(`  📋 Sheet "${sheetName}": ${entries.length} entries, date ${dateISO}`);
  }

  return { days, entriesBySheet };
}

module.exports = {
  parseDutyLogsFromWorkbook
};

