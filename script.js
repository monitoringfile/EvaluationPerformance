// ... [Keep your syncForm, calculateScores, and downloadPDF functions exactly as they were] ...

async function generateSmartRemarks() {
    const btn = document.querySelector('.btn-generate');
    const originalText = btn.innerText;

    // LEAK PREVENTION: Get key from browser memory, not code
    let API_KEY = localStorage.getItem('GEMINI_KEY');

    if (!API_KEY) {
        API_KEY = prompt("Please enter your Gemini API Key:");
        if (API_KEY) {
            localStorage.setItem('GEMINI_KEY', API_KEY);
        } else {
            return;
        }
    }

    // CORRECT MODEL: Gemini 3 Flash (Fastest text generation model)
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${API_KEY}`;

    btn.innerText = "Analyzing...";
    btn.disabled = true;

    const name = document.getElementById('empName').value;
    const pos = document.getElementById('empPosition').value;
    const total = document.getElementById('overall-score').innerText;

    const promptText = `Analyze performance for ${name}, ${pos}. Score: ${total}/60. Return ONLY JSON: {"strengths": "1 sentence", "improvements": "1 sentence", "plan": "1 sentence"}`;

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] })
        });
        
        const data = await response.json();
        
        if (data.error) {
            // If the key is invalid, clear it so the user can re-enter it
            if (data.error.code === 400 || data.error.message.includes("API key")) {
                localStorage.removeItem('GEMINI_KEY');
                throw new Error("Invalid API Key. Please click the button again to re-enter.");
            }
            throw new Error(data.error.message);
        }

        // Parse AI response
        let aiText = data.candidates[0].content.parts[0].text.replace(/```json|```/g, "").trim();
        const result = JSON.parse(aiText);

        // Fill original boxes
        document.getElementById('box-strengths').value = result.strengths;
        document.getElementById('box-improvements').value = result.improvements;
        document.getElementById('box-plan').value = result.plan;

    } catch (error) {
        alert("System Error: " + error.message);
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
    }
}

// Add event listeners to keep the score updating live
document.querySelectorAll('select').forEach(s => s.addEventListener('change', calculateScores));
