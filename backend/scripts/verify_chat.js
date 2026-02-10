// backend/scripts/verify_chat.js
require('dotenv').config();
const { chat } = require('../src/services/chat/chatService');

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function testChat() {
    console.log('--- Starting Chat Verification (gemini-2.0-flash) ---');

    try {
        // 1. Test General Intent
        console.log('\n[1/3] Testing "hii" (General Intent)...');
        const response1 = await chat(null, 'hii');
        if (response1.reply.includes("I'm sorry")) {
            console.warn('API Error (Handled):', response1.reply);
        } else {
            console.log('Response:', response1.reply);
        }
        console.log('Intent:', response1.intent);
    } catch (err) {
        console.error('Test 1 Failed UNHANDLED:', err.message);
    }

    await delay(1000);

    try {
        // 2. Test Concept Intent
        console.log('\n[2/3] Testing "What is LCP?" (Concept Intent)...');
        const response2 = await chat(null, 'What is LCP?');
        if (response2.reply.includes("I'm sorry")) {
            console.warn('API Error (Handled):', response2.reply);
        } else {
            console.log('Response:', response2.reply);
        }
        console.log('Intent:', response2.intent);
    } catch (err) {
        console.error('Test 2 Failed UNHANDLED:', err.message);
    }

    await delay(1000);

    try {
        // 3. Test Report Intent
        console.log('\n[3/3] Testing "Why is my score low?" (Report Intent, No Report)...');
        const response3 = await chat(null, 'Why is my score low?');
        console.log('Response:', response3.reply);
        console.log('Intent:', response3.intent);
    } catch (err) {
        console.error('Test 3 Failed UNHANDLED:', err.message);
    }

    console.log('\n--- Verification Complete ---');
    process.exit(0);
}

testChat();
