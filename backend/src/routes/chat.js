/**
 * Chat Route
 * POST /api/chat — Chatbot endpoint
 */

const express = require('express');
const router = express.Router();
const { chat } = require('../services/chat/chatService');

/**
 * POST /api/chat
 * Send a message to the WebAudit AI chatbot
 * 
 * Body:
 *   - reportId (string, optional): MongoDB report ID for context
 *   - message (string, required): User's message
 *   - history (array, optional): Previous messages [{role, text}]
 * 
 * Response:
 *   - success (boolean)
 *   - reply (string): AI response
 *   - intent (string): Detected intent
 *   - sources (string[]): Referenced modules
 */
router.post('/chat', async (req, res) => {
    try {
        const { reportId, message, history = [] } = req.body;

        if (!message || !message.trim()) {
            return res.status(400).json({
                success: false,
                error: 'Message is required'
            });
        }

        console.log(`[Chat API] Message: "${message.substring(0, 80)}..." | Report: ${reportId || 'none'}`);

        const result = await chat(reportId, message.trim(), history);

        res.json({
            success: true,
            reply: result.reply,
            intent: result.intent,
            sources: result.sources
        });

    } catch (error) {
        console.error('[Chat API] Error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Chat failed'
        });
    }
});

module.exports = router;
