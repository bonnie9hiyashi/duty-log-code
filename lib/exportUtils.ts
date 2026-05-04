import { DutyLog } from '../types';

// Export as Excel file using ExcelJS - layout แบบโรงแรม
export async function exportLogsToExcel(logs: DutyLog[], filename: string = 'duty-logs', startDate?: string, endDate?: string) {
  // ถ้ามีช่วงวันที่ ให้กรองก่อน
  const filteredLogs = startDate && endDate
    ? logs.filter((log) => {
        const logDate = new Date(log.createdAt).toISOString().split('T')[0];
        return logDate >= startDate && logDate <= endDate;
      })
    : logs;
  
  try {
    // ใช้ ExcelJS (สำหรับโลโก้ + styling + border + merge)
    const ExcelJS = (await import('exceljs')).default ?? (await import('exceljs'));
    const { saveAs } = await import('file-saver');
    const wb = new ExcelJS.Workbook();
    
    // จัดกลุ่ม logs ตามวันที่ (YYYY-MM-DD)
    const logsByDate: { [date: string]: DutyLog[] } = {};
    if (filteredLogs.length > 0) {
      for (const log of filteredLogs) {
        const dateKey = new Date(log.createdAt).toISOString().split('T')[0];
        if (!logsByDate[dateKey]) {
          logsByDate[dateKey] = [];
        }
        logsByDate[dateKey].push(log);
      }
    }
    
    // ถ้าไม่มี log ให้สร้างชีทเปล่า 1 วัน
    if (Object.keys(logsByDate).length === 0) {
      const fallbackDate = startDate && endDate ? startDate : new Date().toISOString().split('T')[0];
      logsByDate[fallbackDate] = [];
    }

    // ดึงข้อมูล dailyData จาก localStorage
    const dailyDataStr = localStorage.getItem('dailyData');
    const dailyData: {[key: string]: any} = dailyDataStr ? JSON.parse(dailyDataStr) : {};
    
    // Helper: แปลงวันที่เป็น "DD Month YYYY" (เช่น "22 October 2025")
    const formatDateForHeader = (dateISO: string): string => {
      const dateObj = new Date(dateISO);
      const day = dateObj.getDate();
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      const month = monthNames[dateObj.getMonth()];
      const year = dateObj.getFullYear();
      return `${day} ${month} ${year}`;
    };
    
    // Helper: สร้าง guest text จาก log (รวม room, name, period, source)
    const buildGuestText = (log: DutyLog): string => {
      const parts: string[] = [];
      
      // Room number
      if (log.roomNumber) {
        parts.push(log.roomNumber);
      }
      
      // Guest name
      if (log.guestName) {
        parts.push(`(${log.guestName})`);
      } else if (log.guestNameLocation) {
        // ถ้าไม่มี guestName แต่มี guestNameLocation ให้ parse
        const firstLine = log.guestNameLocation.split('\n')[0];
        if (firstLine) {
          parts.push(`(${firstLine})`);
        }
      }
      
      // Period of stay
      if (log.periodOfStay) {
        parts.push(`\nPeriod of stay: ${log.periodOfStay}`);
      }
      
      // Source of Booking
      if (log.sourceOfBooking) {
        parts.push(`\nSource of Booking: ${log.sourceOfBooking}`);
      }
      
      return parts.join(' ');
    };
    
    // ค่าคงที่สำหรับสไตล์
    const BORDER = { style: 'thin', color: { argb: 'FF000000' } } as const;
    const HEADER_BG = 'FF6E6B2A'; // สีน้ำตาล/ทอง (olive green-ish)
    const CATEGORY_BG = 'FF6E6B2A'; // สีน้ำตาล/ทองสำหรับ category header
    
    // Helper: Parse logo จาก base64
    const parseLogoDataUrl = (dataUrl: string) => {
      const match = /^data:(.*?);base64,(.+)$/.exec(dataUrl);
      if (!match) return null;
      const mime = match[1];
      const base64 = match[2];
      const ext = mime.includes('png') ? 'png' : 'jpeg';
      return { base64, ext };
    };
    
    // Helper: ดึงรูปจาก URL เป็น Buffer (รองรับเฉพาะ URL เท่านั้น, ไม่รองรับ data URL)
    // ใช้ Uint8Array แทน Buffer ใน browser environment
    const fetchImageAsBuffer = async (imageUrl: string): Promise<{ buffer: Uint8Array; ext: string } | null> => {
      try {
        // ตรวจสอบว่าเป็น URL (http:// หรือ https://) เท่านั้น (ไม่รองรับ data URL)
        if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
          return null;
        }
        
        // ดึงรูปจาก URL (อาจเจอ CORS)
        const response = await fetch(imageUrl, { 
          mode: 'cors',
          credentials: 'omit'
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const arrayBuffer = await response.arrayBuffer();
        const buffer = new Uint8Array(arrayBuffer);
        
        // หา extension จาก Content-Type หรือ URL
        const contentType = response.headers.get('content-type') || '';
        let ext = 'png';
        if (contentType.includes('jpeg') || contentType.includes('jpg')) {
          ext = 'jpeg';
        } else if (contentType.includes('png')) {
          ext = 'png';
        } else if (imageUrl.match(/\.(jpg|jpeg)$/i)) {
          ext = 'jpeg';
        } else if (imageUrl.match(/\.png$/i)) {
          ext = 'png';
        }
        
        return { buffer, ext };
      } catch (error) {
        console.warn(`  ⚠️ ไม่สามารถดึงรูปจาก URL: ${imageUrl.substring(0, 50)}...`, error);
        return null;
      }
    };
    
    // ฟังก์ชันสร้างชีทสำหรับ 1 วัน (ใช้ ExcelJS)
    const buildSheetForDate = async (dateKey: string, dayLogs: DutyLog[]) => {
      const dateObj = new Date(dateKey);
      const dayNumber = dateObj.getDate(); // ได้เลขวัน เช่น 22
      const ws = wb.addWorksheet(String(dayNumber)); // สร้างชีทชื่อ "22", "23", ...
      
      console.log(`  📦 Export sheet ${dayNumber} มี entries = ${dayLogs.length}`);
      
      console.log(`  📦 Export sheet ${dayNumber} มี entries = ${dayLogs.length}`);
      
      // ดึงข้อมูล dailyData
      const dailyInfo = dailyData[dateKey] || {
        mod: '',
        dmMorningShift: '',
        dmAfternoonShift: '',
        dmNightShift: '',
        arrival: 0,
        departure: 0,
        occupancy: 0
      };
      
      // 1) ใส่โลโก้ใน A1:A4 (scale ให้พอดี ไม่ล้น)
      const logoDataUrl = localStorage.getItem('hotelLogoDataUrl');
      if (logoDataUrl) {
        const logoData = parseLogoDataUrl(logoDataUrl);
        if (logoData) {
          const imageId = wb.addImage({ base64: logoData.base64, extension: logoData.ext as any });
          // วางโลโก้ครอบช่วง A1:A4 (col 0, row 0-3, width ~18 chars, height ~4 rows)
          // ExcelJS: col/row เป็น 0-based, ext เป็น pixel
          ws.addImage(imageId, {
            tl: { col: 0, row: 0 },
            ext: { width: 140, height: 80 }, // ปรับขนาดให้พอดี A1:A4
          });
        }
      } else {
        // ถ้าไม่มีโลโก้ ให้ใส่ข้อความแทน
        ws.getCell('A1').value = 'MELIÁ\nCHIANG MAI\nTHAILAND';
        ws.mergeCells('A1:A4');
        ws.getCell('A1').font = { bold: true, size: 11, color: { argb: 'FF6B7280' } };
        ws.getCell('A1').alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      }
      
      // 2) หัวกระดาษด้านซ้าย: B1-B3 (จัดแนวซ้าย อ่านชัด)
      ws.getCell('B1').value = 'Meliá Chiang Mai';
      ws.getCell('B1').font = { bold: true, size: 11 };
      ws.getCell('B1').alignment = { horizontal: 'left', vertical: 'middle' };
      
      ws.getCell('B2').value = 'Duty Manager Logbook';
      ws.getCell('B2').font = { bold: true, size: 11 };
      ws.getCell('B2').alignment = { horizontal: 'left', vertical: 'middle' };
      
      const dateText = formatDateForHeader(dateKey);
      ws.getCell('B3').value = `Date: ${dateText}`;
      ws.getCell('B3').font = { size: 10 };
      ws.getCell('B3').alignment = { horizontal: 'left', vertical: 'middle' };
      
      // 3) หัวกระดาษกลาง: C1-C4 (จัดแนวซ้าย)
      ws.getCell('C1').value = `MOD : ${dailyInfo.mod || ''}`;
      ws.getCell('C1').font = { size: 10 };
      ws.getCell('C1').alignment = { horizontal: 'left', vertical: 'middle' };
      
      ws.getCell('C2').value = `DM Morning Shift : ${dailyInfo.dmMorningShift || ''}`;
      ws.getCell('C2').font = { size: 10 };
      ws.getCell('C2').alignment = { horizontal: 'left', vertical: 'middle' };
      
      ws.getCell('C3').value = `DM Afternoon Shift : ${dailyInfo.dmAfternoonShift || ''}`;
      ws.getCell('C3').font = { size: 10 };
      ws.getCell('C3').alignment = { horizontal: 'left', vertical: 'middle' };
      
      ws.getCell('C4').value = `DM Night Shift : ${dailyInfo.dmNightShift || ''}`;
      ws.getCell('C4').font = { size: 10 };
      ws.getCell('C4').alignment = { horizontal: 'left', vertical: 'middle' };
      
      // 4) หัวกระดาษขวา: D1-D3 (จัดแนวซ้าย)
      ws.getCell('D1').value = `Arrival : ${dailyInfo.arrival ?? 0} Rooms`;
      ws.getCell('D1').font = { size: 10 };
      ws.getCell('D1').alignment = { horizontal: 'left', vertical: 'middle' };
      
      ws.getCell('D2').value = `Departure : ${dailyInfo.departure ?? 0} Rooms`;
      ws.getCell('D2').font = { size: 10 };
      ws.getCell('D2').alignment = { horizontal: 'left', vertical: 'middle' };
      
      ws.getCell('D3').value = `Occupancy : ${dailyInfo.occupancy ?? 0}%`;
      ws.getCell('D3').font = { size: 10 };
      ws.getCell('D3').alignment = { horizontal: 'left', vertical: 'middle' };
      
      // ใส่ border ให้ header (B1-D3, C1-C4)
      for (let r = 1; r <= 3; r++) {
        ['B', 'C', 'D'].forEach(col => {
          ws.getCell(`${col}${r}`).border = { top: BORDER, left: BORDER, right: BORDER, bottom: BORDER };
        });
      }
      ws.getCell('C4').border = { top: BORDER, left: BORDER, right: BORDER, bottom: BORDER };
      
      // 5) หัวตารางหลัก: A5-E5 (เพิ่มคอลัมน์ E = Evidence)
      ws.getCell('A5').value = 'DM/Time';
      ws.getCell('B5').value = 'Guest Name/Location';
      ws.getCell('C5').value = 'Details/Issue';
      ws.getCell('D5').value = 'Action Taken';
      ws.getCell('E5').value = 'Evidence';
      
      // ตั้งสไตล์หัวตาราง (สีทอง/น้ำตาล, ตัวอักษรสีขาว, ตัวหนา)
      const headerRow = ws.getRow(5);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
      headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_BG } };
      headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
      headerRow.height = 20; // ตั้งความสูงแถว
      
      // ใส่ border ให้ทุก cell ในหัวตาราง
      ['A5', 'B5', 'C5', 'D5', 'E5'].forEach(cellAddr => {
        const cell = ws.getCell(cellAddr);
        cell.border = { top: BORDER, left: BORDER, right: BORDER, bottom: BORDER };
      });
      
      // 6) ใส่ข้อมูล logs (เริ่มแถว 6)
      let currentRow = 6;
      
      // จัดกลุ่ม logs ตาม category
      const logsByCategory: { [category: string]: DutyLog[] } = {};
      const uncategorizedLogs: DutyLog[] = [];
      
      for (const log of dayLogs) {
        if (log.category) {
          if (!logsByCategory[log.category]) {
            logsByCategory[log.category] = [];
          }
          logsByCategory[log.category].push(log);
        } else {
          uncategorizedLogs.push(log);
        }
      }
      
      // ใส่ uncategorized logs ก่อน
      for (const log of uncategorizedLogs) {
        const dmUser = (log.createdByName || '').trim();
        const timePart = (log.incidentTime || '').trim();
        const dmTime = `${dmUser}${timePart ? `/${timePart}` : ''}`;
        const guestText = buildGuestText(log);
        
        ws.getCell(`A${currentRow}`).value = dmTime;
        ws.getCell(`B${currentRow}`).value = guestText;
        ws.getCell(`C${currentRow}`).value = log.description || '';
        ws.getCell(`D${currentRow}`).value = log.actionTaken || '';
        
        // ใส่ border และ alignment
        ['A', 'B', 'C', 'D', 'E'].forEach(col => {
          const cell = ws.getCell(`${col}${currentRow}`);
          cell.border = { top: BORDER, left: BORDER, right: BORDER, bottom: BORDER };
          if (col === 'A') {
            // คอลัมน์ A (DM/Time): จัดกึ่งกลาง
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
          } else if (['B', 'C', 'D'].includes(col)) {
            // คอลัมน์ B, C, D: wrapText และ align top
            cell.alignment = { wrapText: true, vertical: 'top' };
          } else if (col === 'E') {
            // คอลัมน์ E (Evidence): จัดกึ่งกลาง
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
          }
        });
        
        // ใส่รูปภาพในคอลัมน์ E (ถ้ามี) - นำรูปจาก duty log ไปใส่ใน Excel
        if (log.images && log.images.length > 0) {
          let imageAdded = false;
          const firstImageUrl = log.images[0];
          
          console.log(`  🔍 Row ${currentRow}: Processing images, first image type: ${firstImageUrl.substring(0, 20)}...`);
          
          // กรองเฉพาะ URL (http:// หรือ https://) สำหรับเก็บใน cell text
          const httpUrls = log.images.filter(url => 
            url.startsWith('http://') || url.startsWith('https://')
          );
          
          // ถ้ามี URL ให้เขียนลง cell (ไม่เขียน data URL ลง cell เพราะยาวเกินไป)
          if (httpUrls.length > 0) {
            const allUrls = httpUrls.join('|');
            ws.getCell(`E${currentRow}`).value = allUrls;
            console.log(`  ✅ Row ${currentRow}: set Evidence cell text = "${allUrls.substring(0, 100)}${allUrls.length > 100 ? '...' : ''}"`);
          } else {
            // ถ้ามีแต่ data URL ให้เก็บ cell ว่าง (ไม่เขียน data URL ลงไปเพราะจะทำให้ Excel repair)
            ws.getCell(`E${currentRow}`).value = '';
            console.log(`  ⚠️ Row ${currentRow}: มีแต่ data URL - ไม่เขียนลง cell (จะ embed รูปแทน)`);
          }
          
          // ลอง embed รูปแรก (รองรับทั้ง URL และ data URL)
          if (firstImageUrl.startsWith('http://') || firstImageUrl.startsWith('https://')) {
            // กรณี URL ธรรมดา
            try {
              console.log(`  🔄 Row ${currentRow}: Attempting to fetch image from URL...`);
              const imageBuffer = await fetchImageAsBuffer(firstImageUrl);
              if (imageBuffer) {
                const imageId = wb.addImage({ 
                  buffer: imageBuffer.buffer as any, 
                  extension: imageBuffer.ext as any 
                });
                
                ws.addImage(imageId, {
                  tl: { col: 4, row: currentRow - 1 },
                  ext: { width: 120, height: 100 },
                });
                
                imageAdded = true;
                console.log(`  📸 Row ${currentRow}: embed success (from URL)`);
              } else {
                console.warn(`  ⚠️ Row ${currentRow}: embed failed -> keep URL only (CORS/404/timeout)`);
              }
            } catch (e: any) {
              console.warn(`  ⚠️ Row ${currentRow}: embed failed -> keep URL only (${e.message || e})`);
            }
          } else if (firstImageUrl.startsWith('data:')) {
            // กรณี data URL - parse และ embed โดยตรง
            try {
              console.log(`  🔄 Row ${currentRow}: Processing data URL...`);
              const match = /^data:(.*?);base64,(.+)$/.exec(firstImageUrl);
              if (match) {
                const mime = match[1];
                const base64 = match[2];
                
                // ตรวจสอบขนาด (ถ้าใหญ่เกินไปไม่ embed - เพิ่ม limit เป็น 2MB เพื่อรองรับรูปใหญ่กว่า)
                const estimatedSizeKB = Math.ceil(base64.length * 0.75 / 1024);
                console.log(`  📊 Row ${currentRow}: data URL size: ${estimatedSizeKB}KB`);
                
                if (estimatedSizeKB > 2048) {
                  console.warn(`  ⚠️ Row ${currentRow}: data URL ใหญ่เกินไป (${estimatedSizeKB}KB > 2MB) - ไม่ embed`);
                } else {
                  const ext = mime.includes('png') ? 'png' : 
                             (mime.includes('jpeg') || mime.includes('jpg')) ? 'jpeg' : 'png';
                  
                  console.log(`  🔄 Row ${currentRow}: Adding image to workbook (ext: ${ext})...`);
                  const imageId = wb.addImage({ 
                    base64: base64, 
                    extension: ext as any 
                  });
                  
                  console.log(`  🔄 Row ${currentRow}: Embedding image to cell E${currentRow}...`);
                  ws.addImage(imageId, {
                    tl: { col: 4, row: currentRow - 1 },
                    ext: { width: 120, height: 100 },
                  });
                  
                  imageAdded = true;
                  console.log(`  📸 Row ${currentRow}: embed success (from data URL)`);
                }
              } else {
                console.warn(`  ⚠️ Row ${currentRow}: Failed to parse data URL format`);
              }
            } catch (e: any) {
              console.error(`  ❌ Row ${currentRow}: embed failed (data URL parse error: ${e.message || e})`);
              console.error(e);
            }
          } else {
            console.warn(`  ⚠️ Row ${currentRow}: Unknown image format: ${firstImageUrl.substring(0, 50)}...`);
          }
          
          // ปรับความสูง row ให้พอดีกับรูป (ถ้ามีรูป embed)
          if (imageAdded) {
            ws.getRow(currentRow).height = 100;
            console.log(`  ✅ Row ${currentRow}: Set row height to 100`);
          }
        } else {
          // ไม่มีรูป - cell E ว่าง
          ws.getCell(`E${currentRow}`).value = '';
        }
        
        currentRow++;
      }
      
      // ใส่ categorized logs (พร้อม category header)
      for (const [category, categoryLogs] of Object.entries(logsByCategory)) {
        // สร้างแถว category header (merged A:E, พื้นหลังสีทอง/น้ำตาล, ตัวหนา)
        ws.getCell(`A${currentRow}`).value = category;
        ws.mergeCells(`A${currentRow}:E${currentRow}`);
        const categoryCell = ws.getCell(`A${currentRow}`);
        categoryCell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
        categoryCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: CATEGORY_BG } };
        categoryCell.alignment = { horizontal: 'center', vertical: 'middle' };
        categoryCell.border = { top: BORDER, left: BORDER, right: BORDER, bottom: BORDER };
        ws.getRow(currentRow).height = 18; // ตั้งความสูงแถว category
        currentRow++;
        
        // ใส่ logs ใน category นี้
        for (const log of categoryLogs) {
          const dmUser = (log.createdByName || '').trim();
          const timePart = (log.incidentTime || '').trim();
          const dmTime = `${dmUser}${timePart ? `/${timePart}` : ''}`;
          const guestText = buildGuestText(log);
          
          ws.getCell(`A${currentRow}`).value = dmTime;
          ws.getCell(`B${currentRow}`).value = guestText;
          ws.getCell(`C${currentRow}`).value = log.description || '';
          ws.getCell(`D${currentRow}`).value = log.actionTaken || '';
          
          // ใส่ border และ alignment
          ['A', 'B', 'C', 'D', 'E'].forEach(col => {
            const cell = ws.getCell(`${col}${currentRow}`);
            cell.border = { top: BORDER, left: BORDER, right: BORDER, bottom: BORDER };
            if (col === 'A') {
              // คอลัมน์ A (DM/Time): จัดกึ่งกลาง
              cell.alignment = { horizontal: 'center', vertical: 'middle' };
            } else if (['B', 'C', 'D'].includes(col)) {
              // คอลัมน์ B, C, D: wrapText และ align top
              cell.alignment = { wrapText: true, vertical: 'top' };
            } else if (col === 'E') {
              // คอลัมน์ E (Evidence): จัดกึ่งกลาง
              cell.alignment = { horizontal: 'center', vertical: 'middle' };
            }
          });
          
        // ใส่รูปภาพในคอลัมน์ E (ถ้ามี) - นำรูปจาก duty log ไปใส่ใน Excel
        if (log.images && log.images.length > 0) {
          let imageAdded = false;
          const firstImageUrl = log.images[0];
          
          // กรองเฉพาะ URL (http:// หรือ https://) สำหรับเก็บใน cell text
          const httpUrls = log.images.filter(url => 
            url.startsWith('http://') || url.startsWith('https://')
          );
          
          // ถ้ามี URL ให้เขียนลง cell (ไม่เขียน data URL ลง cell เพราะยาวเกินไป)
          if (httpUrls.length > 0) {
            const allUrls = httpUrls.join('|');
            ws.getCell(`E${currentRow}`).value = allUrls;
            console.log(`  ✅ Row ${currentRow}: set Evidence cell text = "${allUrls.substring(0, 100)}${allUrls.length > 100 ? '...' : ''}"`);
          } else {
            // ถ้ามีแต่ data URL ให้เก็บ cell ว่าง (ไม่เขียน data URL ลงไปเพราะจะทำให้ Excel repair)
            ws.getCell(`E${currentRow}`).value = '';
            console.log(`  ⚠️ Row ${currentRow}: มีแต่ data URL - ไม่เขียนลง cell (จะ embed รูปแทน)`);
          }
          
          // ลอง embed รูปแรก (รองรับทั้ง URL และ data URL)
          if (firstImageUrl.startsWith('http://') || firstImageUrl.startsWith('https://')) {
            // กรณี URL ธรรมดา
            try {
              const imageBuffer = await fetchImageAsBuffer(firstImageUrl);
              if (imageBuffer) {
                const imageId = wb.addImage({ 
                  buffer: imageBuffer.buffer as any, 
                  extension: imageBuffer.ext as any 
                });
                
                ws.addImage(imageId, {
                  tl: { col: 4, row: currentRow - 1 },
                  ext: { width: 120, height: 100 },
                });
                
                imageAdded = true;
                console.log(`  📸 Row ${currentRow}: embed success (from URL)`);
              } else {
                console.warn(`  ⚠️ Row ${currentRow}: embed failed -> keep URL only (CORS/404/timeout)`);
              }
            } catch (e: any) {
              console.warn(`  ⚠️ Row ${currentRow}: embed failed -> keep URL only (${e.message || e})`);
            }
          } else if (firstImageUrl.startsWith('data:')) {
            // กรณี data URL - parse และ embed โดยตรง
            try {
              const match = /^data:(.*?);base64,(.+)$/.exec(firstImageUrl);
              if (match) {
                const mime = match[1];
                const base64 = match[2];
                
                // ตรวจสอบขนาด (ถ้าใหญ่เกินไปไม่ embed - เพิ่ม limit เป็น 2MB เพื่อรองรับรูปใหญ่กว่า)
                const estimatedSizeKB = Math.ceil(base64.length * 0.75 / 1024);
                console.log(`  📊 Row ${currentRow}: data URL size: ${estimatedSizeKB}KB`);
                if (estimatedSizeKB > 2048) {
                  console.warn(`  ⚠️ Row ${currentRow}: data URL ใหญ่เกินไป (${estimatedSizeKB}KB > 2MB) - ไม่ embed`);
                } else {
                  const ext = mime.includes('png') ? 'png' : 
                             (mime.includes('jpeg') || mime.includes('jpg')) ? 'jpeg' : 'png';
                  
                  const imageId = wb.addImage({ 
                    base64: base64, 
                    extension: ext as any 
                  });
                  
                  ws.addImage(imageId, {
                    tl: { col: 4, row: currentRow - 1 },
                    ext: { width: 120, height: 100 },
                  });
                  
                  imageAdded = true;
                  console.log(`  📸 Row ${currentRow}: embed success (from data URL)`);
                }
              }
            } catch (e: any) {
              console.warn(`  ⚠️ Row ${currentRow}: embed failed (data URL parse error: ${e.message || e})`);
            }
          }
          
          // ปรับความสูง row ให้พอดีกับรูป (ถ้ามีรูป embed)
          if (imageAdded) {
            ws.getRow(currentRow).height = 100;
          }
        } else {
          // ไม่มีรูป - cell E ว่าง
          ws.getCell(`E${currentRow}`).value = '';
        }
        
        currentRow++;
      }
      }
      
      // ตั้งความกว้างคอลัมน์ - ตามข้อกำหนด: Evidence column width = 22
      ws.getColumn('A').width = 18;
      ws.getColumn('B').width = 45;
      ws.getColumn('C').width = 55;
      ws.getColumn('D').width = 55;
      ws.getColumn('E').width = 22; // คอลัมน์ Evidence (ตามข้อกำหนด: column width = 22)
      
      // ตรวจสอบว่ามีข้อมูลจริง (rowCount > 6 และมี A5-D5)
      const rowCount = currentRow - 1;
      const hasTableHeader = ws.getCell('A5').value && ws.getCell('B5').value && 
                             ws.getCell('C5').value && ws.getCell('D5').value;
      
      console.log(`  ✅ สร้าง sheet "${dayNumber}" (${dateKey}): ${dayLogs.length} logs, ${rowCount} rows`);
      
      if (rowCount <= 6 || !hasTableHeader) {
        console.warn(`  ⚠️ Sheet "${dayNumber}": อาจไม่มีข้อมูล (rowCount: ${rowCount}, hasHeader: ${hasTableHeader})`);
      }
    };
    
    // สร้างชีทสำหรับแต่ละวัน (เรียงตามวันที่)
    const sortedDates = Object.keys(logsByDate).sort(); // เรียง YYYY-MM-DD จากน้อยไปมาก
    for (const dateKey of sortedDates) {
      await buildSheetForDate(dateKey, logsByDate[dateKey]);
    }
    
    // ตรวจสอบว่าสร้าง worksheets หลายอันจริง
    const sheetNames = wb.worksheets.map(ws => ws.name);
    console.log(`✅ Export สำเร็จ: สร้าง ${wb.worksheets.length} worksheets`);
    console.log(`📋 ชื่อชีท: ${sheetNames.join(', ')}`);
    
    if (wb.worksheets.length === 0) {
      throw new Error('ไม่สามารถสร้าง worksheet ได้');
    }
    
    // ตรวจสอบว่าแต่ละ sheet มีข้อมูลจริง (rowCount > 6 และมี A5-D5)
    for (const ws of wb.worksheets) {
      const rowCount = ws.rowCount;
      const hasHeader = ws.getCell('A5').value && ws.getCell('B5').value && 
                       ws.getCell('C5').value && ws.getCell('D5').value;
      
      if (rowCount <= 6 || !hasHeader) {
        console.warn(`  ⚠️ Sheet "${ws.name}": อาจไม่มีข้อมูล (rowCount: ${rowCount}, hasHeader: ${hasHeader})`);
        // ไม่ throw error แต่แค่ warn เพราะอาจเป็น sheet เปล่าที่ถูกต้อง
      } else {
        console.log(`  ✅ Sheet "${ws.name}": ${rowCount} rows, header ครบ`);
      }
    }

    // สร้างชื่อไฟล์ตาม date range
    let finalFilename = filename;
    if (startDate && endDate) {
      const start = new Date(startDate).toISOString().split('T')[0].replace(/-/g, '');
      const end = new Date(endDate).toISOString().split('T')[0].replace(/-/g, '');
      finalFilename = `${start}_${end}`;
    } else {
      finalFilename = `${filename}-${new Date().toISOString().split('T')[0]}`;
    }
    
    // Export เป็น .xlsx
    const buf = await wb.xlsx.writeBuffer();
    const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `${finalFilename}.xlsx`);
    return; // success
  } catch (e) {
    console.error('❌ Error exporting Excel:', e);
    throw new Error(`เกิดข้อผิดพลาดในการส่งออกไฟล์: ${e instanceof Error ? e.message : 'Unknown error'}`);
  }
}

export function exportSingleLog(log: DutyLog) {
  exportLogsToExcel([log], `duty-log-${log.id}`);
}

// Interface สำหรับ header ของแต่ละวัน
export interface DailyHeader {
  dateISO: string;
  mod: string;
  dmMorning: string;
  dmAfternoon: string;
  dmNight: string;
  arrivalRooms: number;
  departureRooms: number;
  occupancyPercent: number;
}

// Interface สำหรับข้อมูลของแต่ละวัน (header + entries)
export interface DailyLogData {
  header: DailyHeader;
  entries: DutyLog[];
}

// Import function สำหรับอ่านไฟล์ Excel และแยกข้อมูลตามวันที่
export async function importLogsFromExcel(file: File): Promise<{ 
  dutyLogsByDate: Record<string, DutyLog[]>, 
  dailyHeaders: Record<string, DailyHeader>,
  dates: string[] 
}> {
  try {
    // ใช้ XLSX (SheetJS) แทน ExcelJS
    const XLSX = await import('xlsx') as any;
    const arrayBuffer = await file.arrayBuffer();
    const wb = XLSX.read(arrayBuffer, { type: "array" });
    
    console.log("SheetNames:", wb.SheetNames);
    console.log("📋 เริ่ม Import Excel...");
    // ข้อความแจ้งผู้ใช้ตามข้อกำหนด
    console.log("⚠️ SheetJS ไม่สามารถอ่านรูป embed (floating images) จาก Excel ได้");
    console.log("💡 วิธีแก้: เพิ่มคอลัมน์ \"Evidence\" แล้วใส่ URL รูปในแต่ละแถว");
    
    const dutyLogsByDate: Record<string, DutyLog[]> = {};
    const dailyHeaders: Record<string, DailyHeader> = {};
    
    // Helper: หา cell ที่มีข้อความที่ต้องการ
    const findCellContains = (ws: any, searchText: string): string => {
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
    
    // Helper: Parse วันที่จาก "Date: 23 October 2025" เป็น "2025-10-23"
    const parseHotelDateToISO = (dateText: string): string | null => {
      if (!dateText || !dateText.trim()) return null;
      
      const text = dateText.trim();
      
      // รูปแบบ: "Date: 23 October 2025" หรือ "Date: 23/10/2025"
      const monthNames = [
        'january', 'february', 'march', 'april', 'may', 'june',
        'july', 'august', 'september', 'october', 'november', 'december'
      ];
      
      // ลอง parse "Date: DD Month YYYY"
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
      
      // ลอง parse "Date: DD/MM/YYYY"
      const dateMatch = text.match(/Date:\s*(\d{1,2})\/(\d{1,2})\/(\d{4})/);
      if (dateMatch) {
        const day = parseInt(dateMatch[1]);
        const month = parseInt(dateMatch[2]);
        const year = parseInt(dateMatch[3]);
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      }
      
      return null;
    };
    
    // Helper: อ่าน cell value จาก XLSX worksheet
    const getCellValue = (ws: any, cellAddress: string): string => {
      const cell = ws[cellAddress];
      if (!cell) return '';
      if (cell.v === null || cell.v === undefined) return '';
      if (typeof cell.v === 'string') return cell.v;
      if (typeof cell.v === 'number') return String(cell.v);
      if (typeof cell.v === 'boolean') return String(cell.v);
      if (cell.v instanceof Date) return cell.v.toISOString();
      return String(cell.v);
    };
    
    // Helper: Parse header จาก sheet (MOD, DM shifts, Arrival, Departure, Occupancy)
    const parseHeaderFromSheet = (ws: any, dateISO: string): DailyHeader => {
      const header: DailyHeader = {
        dateISO: dateISO,
        mod: '',
        dmMorning: '',
        dmAfternoon: '',
        dmNight: '',
        arrivalRooms: 0,
        departureRooms: 0,
        occupancyPercent: 0
      };
      
      // Scan cells ในช่วงที่กว้างขึ้น (row 0-15, col 0-5 = A-F) เพื่อหา header ที่อาจอยู่ตำแหน่งต่างๆ
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
      console.log(`  📋 Header parsed:`, {
        mod: header.mod || '(empty)',
        dmMorning: header.dmMorning || '(empty)',
        dmAfternoon: header.dmAfternoon || '(empty)',
        dmNight: header.dmNight || '(empty)',
        arrival: header.arrivalRooms || 0,
        departure: header.departureRooms || 0,
        occupancy: header.occupancyPercent || 0
      });
      
      return header;
    };
    
    // Helper: Parse guestName และข้อมูลอื่น ๆ จาก guestText (column B)
    const parseGuestInfo = (guestText: string): { 
      guestName: string; 
      roomNumber: string; 
      guestNameLocation: string;
      periodOfStay: string;
      sourceOfBooking: string;
    } => {
      const text = guestText.trim();
      if (!text) return { 
        guestName: '', 
        roomNumber: '', 
        guestNameLocation: '',
        periodOfStay: '',
        sourceOfBooking: ''
      };
      
      const lines = text.split('\n').map(l => l.trim()).filter(l => l);
      const firstLine = lines[0] || '';
      
      // Parse room number
      const roomMatch = firstLine.match(/R\.(\d+)/i);
      const roomNumber = roomMatch ? `R.${roomMatch[1]}` : '';
      
      // Parse guest name
      const nameInParens = firstLine.match(/\(([^)]+)\)/);
      let guestName = '';
      if (nameInParens) {
        guestName = nameInParens[1].trim();
      } else {
        guestName = firstLine.replace(/R\.\d+/i, '').trim() || firstLine;
      }
      
      // Parse Period of stay
      let periodOfStay = '';
      for (const line of lines) {
        const periodMatch = line.match(/Period of stay:\s*(.+)/i);
        if (periodMatch) {
          periodOfStay = periodMatch[1].trim();
          break;
        }
      }
      
      // Parse Source of Booking
      let sourceOfBooking = '';
      for (const line of lines) {
        const sourceMatch = line.match(/Source of Booking:\s*(.+)/i);
        if (sourceMatch) {
          sourceOfBooking = sourceMatch[1].trim();
          break;
        }
      }
      
      return { 
        guestName, 
        roomNumber, 
        guestNameLocation: text,
        periodOfStay,
        sourceOfBooking
      };
    };
    
    // Helper: สร้าง topic สั้น ๆ จาก details (จำกัด 80 ตัวอักษร)
    const createShortTopic = (details: string): string => {
      const clean = details.trim();
      if (!clean) return 'Imported Log';
      const firstLine = clean.split('\n')[0].trim();
      if (firstLine.length > 80) {
        return firstLine.substring(0, 77) + '...';
      }
      return firstLine || 'Imported Log';
    };
    
    // Helper: ตรวจสอบว่าเป็น section header หรือไม่ (หัวข้อคั่น)
    const isSectionHeader = (row: number, ws: any): { isHeader: boolean; category?: string } => {
      const cellA = getCellValue(ws, XLSX.utils.encode_cell({ r: row, c: 0 })); // A
      const cellB = getCellValue(ws, XLSX.utils.encode_cell({ r: row, c: 1 })); // B
      const cellC = getCellValue(ws, XLSX.utils.encode_cell({ r: row, c: 2 })); // C
      const cellD = getCellValue(ws, XLSX.utils.encode_cell({ r: row, c: 3 })); // D
      
      const textA = cellA.trim();
      const textB = cellB.trim();
      const textC = cellC.trim();
      const textD = cellD.trim();
      
      // นับจำนวนคอลัมน์ที่มีข้อความ
      const nonEmptyCells = [textA, textB, textC, textD].filter(t => t.length > 0);
      const nonEmptyCount = nonEmptyCells.length;
      
      // กรณี 1: ถ้ามีข้อความแค่ 1 ช่อง และช่องอื่นว่าง → ถือว่าเป็น section header
      if (nonEmptyCount === 1) {
        const text = nonEmptyCells[0];
        // ตรวจสอบว่าเป็นข้อความสั้น ๆ และไม่มีข้อมูลปกติ
        if (text.length < 60 && 
            !text.match(/R\.\d+/i) && // ไม่มีห้อง
            !text.match(/\d{1,2}:\d{2}/) && // ไม่มีเวลา
            !text.match(/\d{1,2}\/\d{1,2}\/\d{4}/) && // ไม่มีวันที่
            !text.match(/Period of stay|Source of Booking|Booking of/i) &&
            !text.match(/Mr\.|Ms\.|Mrs\./i) &&
            !text.match(/Guest|guest/i) &&
            !text.match(/The |At |After |When |Once |Solution:/i) &&
            !text.match(/informed|delivered|completed|allowed|acknowledged/i)) {
          // ตรวจสอบว่ามีคำที่บ่งบอกว่าเป็นหัวข้อ
          const hasHeaderKeywords = 
            text.toLowerCase().includes('related') ||
            text.toLowerCase().includes('check') ||
            text.toLowerCase().includes('early') ||
            text.toLowerCase().includes('late') ||
            text.toLowerCase().includes('f & b') ||
            text.toLowerCase().includes('f&b') ||
            text.toLowerCase().includes('food') ||
            text.toLowerCase().includes('beverage') ||
            text.toLowerCase().includes('out');
          
          if (hasHeaderKeywords || text.length < 30) {
            console.log(`  📌 ตรวจจับ section header (1 ช่อง): "${text}" ในแถว ${row}`);
            return { isHeader: true, category: text };
          }
        }
      }
      
      // กรณี 2: ถ้าข้อความเหมือนกันในหลายคอลัมน์ (เช่น "F & B related" ใน A, B, C, D)
      if (nonEmptyCount >= 2) {
        const firstText = nonEmptyCells[0];
        const allSame = nonEmptyCells.every(t => t === firstText);
        
        if (allSame && firstText.length < 60) {
          // ตรวจสอบว่าไม่มีข้อมูลปกติ
          const hasNoDataPattern = 
            !firstText.match(/R\.\d+/i) &&
            !firstText.match(/\d{1,2}:\d{2}/) &&
            !firstText.match(/\d{1,2}\/\d{1,2}\/\d{4}/) &&
            !firstText.match(/Period of stay|Source of Booking|Booking of/i) &&
            !firstText.match(/Mr\.|Ms\.|Mrs\./i) &&
            !firstText.match(/Guest|guest/i) &&
            !firstText.match(/The |At |After |When |Once |Solution:/i) &&
            !firstText.match(/informed|delivered|completed|allowed|acknowledged/i);
          
          // ตรวจสอบว่ามีคำที่บ่งบอกว่าเป็นหัวข้อ
          const hasHeaderKeywords = 
            firstText.toLowerCase().includes('related') ||
            firstText.toLowerCase().includes('check') ||
            firstText.toLowerCase().includes('early') ||
            firstText.toLowerCase().includes('late') ||
            firstText.toLowerCase().includes('f & b') ||
            firstText.toLowerCase().includes('f&b') ||
            firstText.toLowerCase().includes('food') ||
            firstText.toLowerCase().includes('beverage') ||
            firstText.toLowerCase().includes('out');
          
          if (hasNoDataPattern || hasHeaderKeywords) {
            console.log(`  📌 ตรวจจับ section header (หลายช่องเหมือนกัน): "${firstText}" ในแถว ${row}`);
            return { isHeader: true, category: firstText };
          }
        }
      }
      
      // กรณี 3: ถ้า A, B, D ว่าง แต่ C มีข้อความ (กรณีเดิม)
      if (!textA && !textB && !textD && textC) {
        const text = textC;
        if (text.length < 60) {
          const hasNoDataPattern = 
            !text.match(/R\.\d+/i) &&
            !text.match(/\d{1,2}:\d{2}/) &&
            !text.match(/\d{1,2}\/\d{1,2}\/\d{4}/) &&
            !text.match(/Period of stay|Source of Booking|Booking of/i) &&
            !text.match(/Mr\.|Ms\.|Mrs\./i) &&
            !text.match(/Guest|guest/i) &&
            !text.match(/The |At |After |When |Once |Solution:/i);
          
          const hasHeaderKeywords = 
            text.toLowerCase().includes('related') ||
            text.toLowerCase().includes('check') ||
            text.toLowerCase().includes('early') ||
            text.toLowerCase().includes('late') ||
            text.toLowerCase().includes('f & b') ||
            text.toLowerCase().includes('f&b') ||
            text.toLowerCase().includes('food') ||
            text.toLowerCase().includes('beverage') ||
            text.toLowerCase().includes('out');
          
          if (hasNoDataPattern || hasHeaderKeywords) {
            console.log(`  📌 ตรวจจับ section header (C เท่านั้น): "${text}" ในแถว ${row}`);
            return { isHeader: true, category: text };
          }
        }
      }
      
      return { isHeader: false };
    };
    
    // Helper: Parse ตาราง A-D และสร้าง entries (ข้าม section header)
    const parseHotelTable = (ws: any, dateISO: string): DutyLog[] => {
      const logs: DutyLog[] = [];
      let currentCategory = '';
      
      // หา header row (มี "DM/Time", "Guest Name/Location", etc.)
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
      let headerRow = -1;
      
      // ตรวจสอบว่ามีคอลัมน์ Evidence หรือ ImageURL หรือไม่
      // วิธีใหม่: สแกนหา "Evidence" หรือ "ImageURL" ใน 20 แถวแรก (ไม่ fix แถว)
      let hasEvidenceColumn = false;
      let evidenceColumnIndex = -1;
      let evidenceHeaderRow = -1;
      
      // รายการคำที่ใช้ค้นหา Evidence column (case-insensitive) - เฉพาะ Evidence และ ImageURL
      const evidenceKeywords = ['evidence', 'imageurl'];
      
      // สแกน 20 แถวแรกเพื่อหา cell ที่มีคำว่า "Evidence" หรือ "ImageURL"
      for (let row = range.s.r; row <= Math.min(range.e.r, 20); row++) {
        for (let col = 0; col <= Math.min(range.e.c, 15); col++) { // ตรวจสอบถึงคอลัมน์ P (index 15)
          const cell = getCellValue(ws, XLSX.utils.encode_cell({ r: row, c: col }));
          const cellLower = cell ? String(cell).toLowerCase() : '';
          if (cell && evidenceKeywords.some(keyword => cellLower.includes(keyword))) {
            hasEvidenceColumn = true;
            evidenceColumnIndex = col;
            evidenceHeaderRow = row;
            // Debug log ตามข้อกำหนด: 📸 Found Evidence column at row=<headerRow> col=<colIndex>
            console.log(`  📸 Found Evidence column at row=${row} col=${col}`);
            break;
          }
        }
        if (hasEvidenceColumn) break;
      }
      
      // หา header row มาตรฐาน (DM/Time, Guest Name/Location, Details/Issue, Action Taken)
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
      
      if (!hasEvidenceColumn) {
        console.warn(`  ⚠️ ไม่พบคอลัมน์ Evidence/ImageURL ใน 20 แถวแรก`);
        // ข้อความแจ้งผู้ใช้ตามข้อกำหนด
        console.warn(`  ⚠️ SheetJS ไม่สามารถอ่านรูป embed (floating images) จาก Excel ได้`);
        console.warn(`  💡 วิธีแก้: เพิ่มคอลัมน์ "Evidence" แล้วใส่ URL รูปในแต่ละแถว`);
      }
      
      if (headerRow === -1) headerRow = 5; // default
      
      // อ่านแถวถัดจาก header
      for (let row = headerRow + 1; row <= range.e.r; row++) {
        // ตรวจสอบ section header
        const headerCheck = isSectionHeader(row, ws);
        if (headerCheck.isHeader) {
          currentCategory = headerCheck.category || '';
          continue;
        }
        
        const cellA = getCellValue(ws, XLSX.utils.encode_cell({ r: row, c: 0 }));
        const cellB = getCellValue(ws, XLSX.utils.encode_cell({ r: row, c: 1 }));
        const cellC = getCellValue(ws, XLSX.utils.encode_cell({ r: row, c: 2 }));
        const cellD = getCellValue(ws, XLSX.utils.encode_cell({ r: row, c: 3 }));
        // อ่านค่า cell Evidence (ใช้ index ที่หาได้)
        const cellEvidence = hasEvidenceColumn ? getCellValue(ws, XLSX.utils.encode_cell({ r: row, c: evidenceColumnIndex })) : '';
        
        
        // ข้ามแถวว่าง
        if (!cellA && !cellB && !cellC && !cellD) continue;
        if (!cellC && !cellD) continue;
        
        // ตรวจสอบอีกครั้ง: ถ้าแถวนี้ดูเหมือน section header ให้ข้าม
        // (กรณีที่ isSectionHeader ไม่ตรวจจับได้)
        const textA = cellA.trim();
        const textB = cellB.trim();
        const textC = cellC.trim();
        const textD = cellD.trim();
        
        const nonEmptyCells = [textA, textB, textC, textD].filter(t => t.length > 0);
        const nonEmptyCount = nonEmptyCells.length;
        
        // ถ้ามีข้อความแค่ 1 ช่อง และเป็นข้อความสั้น ๆ ที่มี keywords
        if (nonEmptyCount === 1) {
          const text = nonEmptyCells[0];
          const lower = text.toLowerCase();
          const isHeaderLike = 
            (lower.includes('related') && text.length < 60) ||
            (lower.includes('check') && lower.includes('out') && text.length < 60) ||
            (lower.includes('early') && text.length < 60) ||
            (lower.includes('late') && text.length < 60) ||
            (lower.includes('f & b') && text.length < 60) ||
            (lower.includes('f&b') && text.length < 60) ||
            (lower.includes('food') && lower.includes('beverage') && text.length < 60);
          
          if (isHeaderLike && 
              !text.match(/R\.\d+/i) && 
              !text.match(/\d{1,2}:\d{2}/) && 
              !text.match(/\d{1,2}\/\d{1,2}\/\d{4}/) &&
              !text.match(/Period of stay|Source of Booking|Booking of/i) &&
              !text.match(/Mr\.|Ms\.|Mrs\./i) &&
              !text.match(/The |At |After |When |Once |Solution:/i)) {
            currentCategory = text;
            console.log(`  ⏭️ ข้าม section header (ตรวจสอบรอบ 2): "${text}" ในแถว ${row}`);
            continue; // ข้าม section header
          }
        }
        
        // ถ้าข้อความเหมือนกันในหลายคอลัมน์ และเป็นข้อความสั้น ๆ
        if (nonEmptyCount >= 2) {
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
            
            if (isHeaderLike && 
                !firstText.match(/R\.\d+/i) && 
                !firstText.match(/\d{1,2}:\d{2}/) && 
                !firstText.match(/\d{1,2}\/\d{1,2}\/\d{4}/) &&
                !firstText.match(/Period of stay|Source of Booking|Booking of/i) &&
                !firstText.match(/Mr\.|Ms\.|Mrs\./i) &&
                !firstText.match(/The |At |After |When |Once |Solution:/i)) {
              currentCategory = firstText;
              console.log(`  ⏭️ ข้าม section header (ข้อความเหมือนกัน): "${firstText}" ในแถว ${row}`);
              continue; // ข้าม section header
            }
          }
        }
        
        // ตรวจสอบว่า title หรือ description ไม่ใช่ section header
        const title = createShortTopic(cellC);
        const titleLower = title.toLowerCase();
        
        // ตรวจสอบว่า title ดูเหมือน section header
        const titleIsHeaderLike = 
          (titleLower.includes('related') && title.length < 60) ||
          (titleLower.includes('check') && titleLower.includes('out') && title.length < 60) ||
          (titleLower.includes('early') && title.length < 60) ||
          (titleLower.includes('late') && title.length < 60) ||
          (titleLower.includes('f & b') && title.length < 60) ||
          (titleLower.includes('f&b') && title.length < 60) ||
          (titleLower.includes('food') && titleLower.includes('beverage') && title.length < 60);
        
        if (titleIsHeaderLike &&
            !title.match(/R\.\d+/i) &&
            !title.match(/\d{1,2}:\d{2}/) &&
            !title.match(/\d{1,2}\/\d{1,2}\/\d{4}/)) {
          // ถ้า title ดูเหมือน section header และ guestText, actionTaken ว่างหรือเหมือนกัน
          // หรือถ้า cellA, cellB, cellD ว่างหรือเหมือนกับ cellC
          const isLikelyHeader = 
            (!textA || textA === textC) &&
            (!textB || textB === textC) &&
            (!textD || textD === textC);
          
          if (isLikelyHeader) {
            currentCategory = textC;
            console.log(`  ⏭️ ข้าม section header (title ดูเหมือน header): "${textC}" ในแถว ${row}`);
            continue; // ข้าม section header
          }
        }
        
        // ตรวจสอบเพิ่มเติม: ถ้า cellC มีข้อความสั้น ๆ และ cellA, cellB, cellD ว่างหรือเหมือนกับ cellC
        if (textC && textC.length < 60) {
          const lowerC = textC.toLowerCase();
          const hasHeaderKeywords = 
            lowerC.includes('related') ||
            (lowerC.includes('check') && lowerC.includes('out')) ||
            lowerC.includes('early') ||
            lowerC.includes('late') ||
            lowerC.includes('f & b') ||
            lowerC.includes('f&b') ||
            (lowerC.includes('food') && lowerC.includes('beverage'));
          
          if (hasHeaderKeywords &&
              !textC.match(/R\.\d+/i) &&
              !textC.match(/\d{1,2}:\d{2}/) &&
              !textC.match(/\d{1,2}\/\d{1,2}\/\d{4}/) &&
              !textC.match(/Period of stay|Source of Booking|Booking of/i) &&
              !textC.match(/Mr\.|Ms\.|Mrs\./i) &&
              !textC.match(/The |At |After |When |Once |Solution:/i)) {
            // ถ้า cellA, cellB, cellD ว่างหรือเหมือนกับ cellC → ถือว่าเป็น section header
            if ((!textA || textA === textC) &&
                (!textB || textB === textC) &&
                (!textD || textD === textC)) {
              currentCategory = textC;
              console.log(`  ⏭️ ข้าม section header (C มี keywords และ A,B,D ว่าง/เหมือน): "${textC}" ในแถว ${row}`);
              continue; // ข้าม section header
            }
          }
        }
        
        // ตรวจสอบสุดท้าย: ถ้าแถวนี้ดูเหมือน section header ให้ข้าม (ป้องกันการสร้าง log)
        // ตรวจสอบว่าทุก field มีข้อความเหมือนกันหรือไม่
        const allFieldsSame = 
          textA && textB && textC && textD &&
          textA === textB && textB === textC && textC === textD;
        
        if (allFieldsSame && textC.length < 60) {
          const lowerC = textC.toLowerCase();
          const isHeaderLike = 
            lowerC.includes('related') ||
            (lowerC.includes('check') && lowerC.includes('out')) ||
            lowerC.includes('early') ||
            lowerC.includes('late') ||
            lowerC.includes('f & b') ||
            lowerC.includes('f&b') ||
            (lowerC.includes('food') && lowerC.includes('beverage'));
          
          if (isHeaderLike &&
              !textC.match(/R\.\d+/i) &&
              !textC.match(/\d{1,2}:\d{2}/) &&
              !textC.match(/\d{1,2}\/\d{1,2}\/\d{4}/) &&
              !textC.match(/Period of stay|Source of Booking|Booking of/i) &&
              !textC.match(/Mr\.|Ms\.|Mrs\./i) &&
              !textC.match(/The |At |After |When |Once |Solution:/i)) {
            currentCategory = textC;
            console.log(`  ⏭️ ข้าม section header (ทุก field เหมือนกัน): "${textC}" ในแถว ${row}`);
            continue; // ข้าม section header
          }
        }
        
        // Parse DM/Time
        const dmTimeParts = cellA.split('/');
        const dmName = dmTimeParts[0]?.trim() || '';
        const incidentTime = dmTimeParts.length > 1 ? dmTimeParts.slice(1).join('/').trim() : '';
        
        // Parse Guest และข้อมูลอื่น ๆ (Period of stay, Source of Booking)
        const guestInfo = parseGuestInfo(cellB);
        
        // ตรวจสอบว่า guestName ไม่ใช่ section header
        // ถ้า guestName เป็น section header และทุก field เหมือนกัน → ข้าม
        if (guestInfo.guestName) {
          const guestLower = guestInfo.guestName.toLowerCase();
          const guestIsHeader = 
            (guestLower.includes('related') && guestInfo.guestName.length < 60) ||
            (guestLower.includes('check') && guestLower.includes('out') && guestInfo.guestName.length < 60) ||
            (guestLower.includes('early') && guestInfo.guestName.length < 60) ||
            (guestLower.includes('late') && guestInfo.guestName.length < 60) ||
            (guestLower.includes('f & b') && guestInfo.guestName.length < 60) ||
            (guestLower.includes('f&b') && guestInfo.guestName.length < 60);
          
          if (guestIsHeader &&
              !guestInfo.guestName.match(/R\.\d+/i) &&
              !guestInfo.guestName.match(/\d{1,2}:\d{2}/) &&
              guestInfo.guestName === textC &&
              (!textA || textA === textC) &&
              (!textD || textD === textC)) {
            currentCategory = guestInfo.guestName;
            console.log(`  ⏭️ ข้าม section header (guestName เป็น header): "${guestInfo.guestName}" ในแถว ${row}`);
            continue; // ข้าม section header
          }
        }
        
        // สร้าง createdAt ISO string
        const createdAtISO = `${dateISO}T00:00:00.000Z`;
        
        // อ่านรูปภาพจากคอลัมน์ Evidence/ImageURL (ถ้ามี)
        const images: string[] = [];
        if (hasEvidenceColumn && cellEvidence) {
          const imageUrl = String(cellEvidence).trim(); // แปลงเป็น string เพื่อความแน่ใจ
          if (imageUrl) {
            // แยก URL ด้วย "|" หรือ "\n" (newline)
            const imageUrls = imageUrl
              .split(/[|\n]/) // แยกด้วย | หรือ newline
              .map(url => url.trim())
              .filter(url => url.length > 0)
              .filter(url => {
                // Validate: ต้องขึ้นต้นด้วย http:// หรือ https:// เท่านั้น (ไม่รองรับ data URL)
                const isHttpUrl = url.startsWith('http://') || url.startsWith('https://');
                
                if (!isHttpUrl && url.length > 0) {
                  // Debug log ตามข้อกำหนด: ⚠️ Row <r>: invalid url skipped: <value>
                  console.warn(`  ⚠️ Row ${row}: invalid url skipped: ${url}`);
                  return false; // ข้าม URL ที่ไม่ถูกต้อง (รวมถึง data URL)
                }
                return isHttpUrl;
              });
            
            images.push(...imageUrls);
            // Debug log ตามข้อกำหนด: 📸 Row <r>: parsed <n> images
            console.log(`  📸 Row ${row}: parsed ${imageUrls.length} images`);
          }
        }
        
        // หมายเหตุ: SheetJS (xlsx) ไม่สามารถอ่านรูปที่ embed ใน Excel ได้โดยตรง
        // รูปที่ embed อยู่ใน Excel จะถูกเก็บใน xl/drawings/ และ xl/media/ ซึ่ง SheetJS ไม่เข้าถึง
        // ดังนั้นถ้าต้องการให้รูปแสดงในเว็บ ต้องใส่ URL (http:// หรือ https://) ใน cell Evidence แทน
        
        const log: DutyLog = {
          id: `imported-${Date.now()}-${row}-${Math.random()}`,
          title: title,
          description: cellC,
          images: images, // เก็บรูปจากคอลัมน์ Evidence/ImageURL
          createdBy: 'imported',
          createdByName: dmName || 'Unknown',
          createdAt: createdAtISO,
          updatedAt: createdAtISO,
          guestName: guestInfo.guestName,
          roomNumber: guestInfo.roomNumber,
          guestNameLocation: guestInfo.guestNameLocation,
          incidentTime: incidentTime,
          actionTaken: cellD,
          category: currentCategory || undefined, // ผูกกับ category จาก section header
          periodOfStay: guestInfo.periodOfStay || undefined,
          sourceOfBooking: guestInfo.sourceOfBooking || undefined
        };
        
        
        logs.push(log);
      }
      
      return logs;
    };
    
    // วนอ่านทุก sheet
    for (const sheetName of wb.SheetNames) {
      const ws = wb.Sheets[sheetName];
      
      // 1) อ่าน date จาก cell ที่มี "Date: ..."
      const dateText = findCellContains(ws, "Date:");
      const dateISO = parseHotelDateToISO(dateText);
      
      if (!dateISO) {
        console.warn(`  ⚠️ Sheet "${sheetName}": ไม่พบวันที่, ข้าม`);
        continue;
      }
      
      // 2) Parse header (MOD, DM shifts, Arrival, Departure, Occupancy)
      const header = parseHeaderFromSheet(ws, dateISO);
      dailyHeaders[dateISO] = header;
      console.log(`  📋 Sheet "${sheetName}": Header parsed`, dateISO, header);
      
      // 3) อ่านตาราง A-D แล้วสร้าง entries (ข้าม section header)
      const entries = parseHotelTable(ws, dateISO);
      
      dutyLogsByDate[dateISO] = entries;
      console.log(`  ✅ Sheet "${sheetName}": ${entries.length} logs, วันที่ ${dateISO}`);
    }
    
    // 3) สร้าง availableDates
    const availableDates = Object.keys(dutyLogsByDate).sort();
    
    console.log("Imported dates:", availableDates);
    if (availableDates.length > 0) {
      console.log("Selected date after import:", availableDates[0]);
    }
    
    // นับจำนวน logs ที่มีรูป
    let logsWithImages = 0;
    let totalImages = 0;
    Object.values(dutyLogsByDate).forEach(logs => {
      logs.forEach(log => {
        if (log.images && log.images.length > 0) {
          logsWithImages++;
          totalImages += log.images.length;
        }
      });
    });
    
    const totalLogs = Object.values(dutyLogsByDate).flat().length;
    console.log(`✅ Import เสร็จ: ${availableDates.length} วัน, ${totalLogs} logs`);
    if (logsWithImages > 0) {
      console.log(`📸 พบรูป: ${logsWithImages} logs มีรูป (รวม ${totalImages} รูป)`);
    } else {
      // ข้อความแจ้งผู้ใช้ตามข้อกำหนด
      console.warn(`⚠️ SheetJS ไม่สามารถอ่านรูป embed (floating images) จาก Excel ได้`);
      console.warn(`💡 วิธีแก้: เพิ่มคอลัมน์ "Evidence" แล้วใส่ URL รูปในแต่ละแถว`);
    }
    
    // แปลง dutyLogsByDate เป็น array ของ logs สำหรับ backward compatibility
    const allLogs: DutyLog[] = [];
    Object.values(dutyLogsByDate).forEach(logs => {
      allLogs.push(...logs);
    });
    
    return { dutyLogsByDate, dailyHeaders, dates: availableDates };
  } catch (error) {
    console.error('❌ Error importing Excel:', error);
    throw new Error(`เกิดข้อผิดพลาดในการนำเข้าไฟล์: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
