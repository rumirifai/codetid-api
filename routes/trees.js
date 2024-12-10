const Trees = require('../models/Trees');
const authMiddleware = require('../middleware/auth');
const express = require('express');
const axios = require('axios');
const FormData = require('form-data');
const multer = require('multer');
const upload = multer();
const router = express.Router();


router.post('/result', authMiddleware, upload.single('file'), async (req, res) => {
    try {
        const file = req.file;
        if (!file) {
            return res.status(404).json({ message: "File is required" });
        }

        const form = new FormData();
        form.append('file', file.buffer, file.originalname);

        const modelResponse = await axios.post(
            "https://model-api-854314759095.asia-southeast2.run.app/predict",
            form,
            {
                headers: {
                    ...form.getHeaders(),
                },
            }
        );

        const disease_id = modelResponse.data.prediction;
        const predictResult = await Trees.disease({disease_id});

        const { predict, details } = predictResult;    
        const image_url = modelResponse.data.file_url;
        const status = predict;
        const user_id = req.user.id;

        const saved = await Trees.saved({ status, details, image_url, user_id, disease_id })
        return res.status(201).json({ message: "Here's the analyze result", predictResult, saved });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/history', authMiddleware, async (req, res) => {
    const user_id = req.user.id;
    try {
        const userHistory = await Trees.history({ user_id });
        if (!userHistory) {
            return res.status(404).json({ message: "There's no history. Try analyze image!" });
        }
        res.status(201).json({ messgae: userHistory });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;