const express = require('express');
const multer = require('multer');
const { importXlsxWithImages } = require('../utils/excelImporter');

const router = express.Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.mimetype === 'application/octet-stream' ||
        file.originalname.endsWith('.xlsx')) {
      cb(null, true);
    } else {
      cb(new Error('Only .xlsx files are allowed'), false);
    }
  }
});

/**
 * POST /api/import-xlsx
 * Import Excel file with embedded images
 * 
 * Request: multipart/form-data
 *   - file: Excel file (.xlsx)
 * 
 * Response:
 *   {
 *     days: {
 *       "2025-10-26": {
 *         header: {...},
 *         entries: [
 *           {
 *             id: "...",
 *             dmTime: "...",
 *             guestText: "...",
 *             details: "...",
 *             actionTaken: "...",
 *             images: ["/uploads/..."]
 *           }
 *         ]
 *       }
 *     },
 *     unassignedImages?: [...]
 *   }
 */
router.post('/import-xlsx', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded. Please use field name "file"' });
    }

    console.log(`📥 Received file: ${req.file.originalname} (${(req.file.size / 1024 / 1024).toFixed(2)} MB)`);

    const result = await importXlsxWithImages(req.file.buffer, req.file.originalname);

    res.json(result);
  } catch (error) {
    console.error('❌ Import error:', error);
    next(error);
  }
});

module.exports = router;

