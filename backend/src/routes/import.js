import express from 'express';
import multer from 'multer';
import { join } from 'path';
import { importExcelData } from '../utils/excelParser.js';
import db from '../db/database.js';

const router = express.Router();

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({
    storage: storage,
    fileFilter: function (req, file, cb) {
        if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
            cb(null, true);
        } else {
            cb(new Error('Only .xlsx files are allowed'));
        }
    }
});

/**
 * POST /api/import/excel
 * Import data from Excel file
 */
router.post('/excel', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No file uploaded' });
        }

        const filePath = req.file.path;
        const result = await importExcelData(filePath, db);

        res.json({
            success: true,
            message: 'Excel data imported successfully',
            data: result
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
