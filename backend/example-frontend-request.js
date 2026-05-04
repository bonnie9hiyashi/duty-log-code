/**
 * ตัวอย่างการเรียกใช้ API จาก Frontend
 * 
 * วิธีใช้งาน:
 * 1. Copy code นี้ไปใส่ใน component ของคุณ
 * 2. เปลี่ยน BACKEND_URL เป็น URL ของ backend server
 * 3. ใช้ file input หรือ drag & drop เพื่อเลือกไฟล์
 */

// ============================================
// วิธีที่ 1: ใช้ Fetch API
// ============================================

async function importExcelWithFetch(file) {
  const BACKEND_URL = 'http://localhost:3001';
  
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch(`${BACKEND_URL}/api/import-xlsx`, {
      method: 'POST',
      body: formData
      // ไม่ต้องใส่ Content-Type header, browser จะ set ให้อัตโนมัติ
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    console.log('✅ Import สำเร็จ!');
    console.log('Days:', result.days);
    console.log('Unassigned images:', result.unassignedImages);
    
    return result;
  } catch (error) {
    console.error('❌ Import failed:', error);
    throw error;
  }
}

// ============================================
// วิธีที่ 2: ใช้ Axios
// ============================================

import axios from 'axios';

async function importExcelWithAxios(file) {
  const BACKEND_URL = 'http://localhost:3001';
  
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await axios.post(
      `${BACKEND_URL}/api/import-xlsx`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );

    console.log('✅ Import สำเร็จ!');
    console.log('Days:', response.data.days);
    console.log('Unassigned images:', response.data.unassignedImages);
    
    return response.data;
  } catch (error) {
    console.error('❌ Import failed:', error);
    throw error;
  }
}

// ============================================
// ตัวอย่าง React Component
// ============================================

import React, { useState } from 'react';

function ExcelImportComponent() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.xlsx')) {
      setError('กรุณาเลือกไฟล์ .xlsx เท่านั้น');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const BACKEND_URL = 'http://localhost:3001';
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${BACKEND_URL}/api/import-xlsx`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
      
      // Process entries
      Object.entries(data.days).forEach(([date, dayData]) => {
        dayData.entries.forEach(entry => {
          console.log(`Entry ${entry.id}:`, entry);
          console.log(`Images:`, entry.images);
          
          // entry.images เป็น array ของ URL เช่น ["/uploads/1698765432_abc123_image1.png"]
          // ใช้ URL เหล่านี้แสดงรูปใน UI
        });
      });
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept=".xlsx"
        onChange={handleFileChange}
        disabled={loading}
      />
      
      {loading && <p>กำลัง import...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      
      {result && (
        <div>
          <h3>Import สำเร็จ!</h3>
          <p>จำนวนวัน: {Object.keys(result.days).length}</p>
          {result.unassignedImages && result.unassignedImages.length > 0 && (
            <p>รูปที่ยังไม่ได้ map: {result.unassignedImages.length}</p>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================
// ตัวอย่างการแสดงรูปใน Entry
// ============================================

function DutyLogEntry({ entry }) {
  return (
    <div className="duty-log-entry">
      <h4>{entry.dmTime}</h4>
      <p>{entry.guestText}</p>
      <p>{entry.details}</p>
      <p>{entry.actionTaken}</p>
      
      {/* แสดงรูป */}
      {entry.images && entry.images.length > 0 && (
        <div className="images">
          {entry.images.map((imageUrl, index) => (
            <img
              key={index}
              src={`http://localhost:3001${imageUrl}`} // ใส่ backend URL prefix
              alt={`Evidence ${index + 1}`}
              style={{ maxWidth: '200px', margin: '5px' }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// ตัวอย่าง Response JSON
// ============================================

const exampleResponse = {
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
          "id": "imported-1698765432123-6-0.123456",
          "dmTime": "Alice/14:30",
          "guestText": "R.101 (John Smith)\nPeriod of stay: 2 nights",
          "details": "Room service request - late dinner",
          "actionTaken": "Delivered at 22:00",
          "category": "F & B related",
          "images": [
            "/uploads/1698765432_abc123_image1.png",
            "/uploads/1698765432_def456_image2.png"
          ],
          "excelRow": 6,
          "sheetName": "22"
        },
        {
          "id": "imported-1698765432123-7-0.789012",
          "dmTime": "Bob/16:45",
          "guestText": "R.205 (Jane Doe)",
          "details": "Complaint about noise",
          "actionTaken": "Moved to quiet room",
          "images": [
            "/uploads/1698765432_ghi789_image3.png"
          ],
          "excelRow": 7,
          "sheetName": "22"
        }
      ]
    }
  },
  "unassignedImages": [
    {
      "url": "/uploads/1698765432_jkl012_image4.png",
      "sheetName": "22",
      "anchorRow": 10,
      "anchorCol": 5
    }
  ]
};

export {
  importExcelWithFetch,
  importExcelWithAxios,
  ExcelImportComponent,
  DutyLogEntry,
  exampleResponse
};

