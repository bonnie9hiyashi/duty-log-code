# Duty Log Backend - Excel Import Service

Backend service สำหรับ import ไฟล์ Excel (.xlsx) พร้อมดึงรูป embed (floating images) ออกมา

## Features

- ✅ Parse ข้อมูล duty log จาก Excel (ข้อความ)
- ✅ Extract รูป embed จาก xl/media/
- ✅ Map รูป -> entry ด้วย heuristic (exact match, nearest above, unassigned)
- ✅ Serve static files จาก /uploads

## Installation

```bash
cd backend
npm install
```

## Dependencies

- `express` - Web framework
- `multer` - File upload handling
- `jszip` - Extract files from .xlsx (which is a zip)
- `fast-xml-parser` - Parse XML (drawing anchors, rels)
- `xlsx` - Read Excel cell values
- `cors` - CORS support

## Usage

### Start Server

```bash
npm start
# หรือ development mode
npm run dev
```

Server จะรันที่ `http://localhost:3001`

### API Endpoint

**POST /api/import-xlsx**

รับไฟล์ Excel (.xlsx) และส่งกลับ JSON พร้อม entries และ images

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Field name: `file`
- File: Excel file (.xlsx)

**Response:**
```json
{
  "days": {
    "2025-10-26": {
      "header": {
        "dateISO": "2025-10-26",
        "mod": "John Doe",
        "dmMorning": "Alice",
        "dmAfternoon": "Bob",
        "dmNight": "Charlie",
        "arrivalRooms": 10,
        "departureRooms": 5,
        "occupancyPercent": 85
      },
      "entries": [
        {
          "id": "imported-...",
          "dmTime": "Alice/14:30",
          "guestText": "R.101 (John Smith)",
          "details": "Room service request",
          "actionTaken": "Delivered",
          "category": "F & B related",
          "images": [
            "/uploads/1698765432_abc123_image1.png"
          ],
          "excelRow": 6,
          "sheetName": "22"
        }
      ]
    }
  },
  "unassignedImages": [
    {
      "url": "/uploads/1698765432_def456_image2.png",
      "sheetName": "22",
      "anchorRow": 10,
      "anchorCol": 5
    }
  ]
}
```

## Example: Frontend Request

### Using Fetch

```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);

const response = await fetch('http://localhost:3001/api/import-xlsx', {
  method: 'POST',
  body: formData
});

const result = await response.json();
console.log('Days:', result.days);
console.log('Unassigned images:', result.unassignedImages);
```

### Using Axios

```javascript
import axios from 'axios';

const formData = new FormData();
formData.append('file', fileInput.files[0]);

const response = await axios.post(
  'http://localhost:3001/api/import-xlsx',
  formData,
  {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }
);

console.log('Days:', response.data.days);
console.log('Unassigned images:', response.data.unassignedImages);
```

## Image Mapping Logic

1. **Exact Match**: ถ้า `entry.excelRow === anchor.fromRow1Based` → ผูกรูปให้ entry นั้น
2. **Nearest Above**: ถ้าไม่มี exact match → ผูกกับ entry ล่าสุดด้านบนที่มี `excelRow < fromRow1Based`
3. **Unassigned**: ถ้ายังหาไม่ได้ → ใส่ใน `unassignedImages` เพื่อให้ UI ผูกเองได้

## File Structure

```
backend/
├── server.js              # Main server
├── routes/
│   └── import.js          # Import endpoint
├── utils/
│   ├── excelImporter.js   # Main import function
│   ├── excelParser.js     # Parse duty log entries
│   ├── imageExtractor.js  # Extract media files
│   └── imageMapper.js     # Map images to entries
├── uploads/               # Saved images (gitignored)
└── package.json
```

## Environment Variables

- `PORT` - Server port (default: 3001)
- `FRONTEND_URL` - CORS origin (default: http://localhost:5173)
- `NODE_ENV` - Environment (development/production)

## Debug Logs

Server จะแสดง debug logs ตาม spec:
- 🗜️ Zip media files found: N
- 🖼️ Saved media <mediaPath> -> <url>
- 🧩 Drawing <drawingFile> anchors found: N
- 🔗 rid <rId> -> <mediaPath> -> <url>
- 🧷 Mapped image <url> to sheet <sheetName> entryRow <excelRow> (mode=exact|nearest|unassigned)

## Error Handling

- ถ้า parsing drawing/rels fail → ยัง import ข้อความได้ และส่ง `unassignedImages` เป็นว่าง
- ถ้ารูป 1 รูปพัง → ไม่ทำให้ API ล่มทั้งก้อน (try/catch ต่อรูป)
- CORS เปิดเฉพาะที่จำเป็น

## Notes

- รูปที่ extract จะถูก save ใน `/uploads` และ serve static ที่ `/uploads`
- Frontend ต้องใช้ URL จาก response (`/uploads/...`) เพื่อแสดงรูป
- ถ้า mapping ไม่แม่น 100% → ใช้ `unassignedImages` เพื่อให้ UI ผูกเองได้

