/**
 * REFI Microfinance MIS - Automated Evaluation
 * Optimized for Dynamic Model Selection (Gemini or Gemma)
 */

// ... (Keep syncForm, getStatus, calculateScores, and validateAndAction as they were)

// 2. AI GENERATION (Supports Gemini 1.5, Gemma 3 2B, etc.)
async function generateSmartRemarks(modelName = "gemini-1.5-flash") {
    const btn = document.querySelector('.btn-generate');
    const originalText = btn.innerText;

    // Pulls from config.js (ignored by GitHub for security)
    const API_KEY = window.GEMINI_CONFIG?.API_KEY; 
    
    if (!API_KEY) {
        alert("API Key not found in config.js. Please check your setup.");
        return;
    }

    // Dynamic URL: Automatically adjusts based on the modelName provided
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${API_KEY}`;

    btn.innerText = "Analyzing...";
    btn.disabled = true;

    const name = document.getElementById('empName').value;
    const pos = document.getElementById('empPosition').value;
    const total = document.getElementById('overall-score').innerText;

    // Robust prompt for any model size
    const promptText = `User: Analyze microfinance employee performance. 
    Name: ${name}, Position: ${pos}, Score: ${total}/60.
    Output ONLY JSON: {"strengths": "1 sentence", "improvements": "1 sentence", "plan": "1 sentence"}`;

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                contents: [{ parts: [{ text: promptText }] }],
                generationConfig: {
                    temperature: 0.4, // Lower temperature for more consistent JSON structure
                    topP: 0.8
                }
            })
        });
        
        const data = await response.json();
        
        // Error handling if the model name is incorrect or key is invalid
        if (data.error) {
            throw new Error(`${data.error.message} (Model: ${modelName})`);
        }
        
        // Clean JSON response
        let aiText = data.candidates[0].content.parts[0].text.replace(/```json|```/g, "").trim();
        const result = JSON.parse(aiText);
        
        document.getElementById('box-strengths').value = result.strengths;
        document.getElementById('box-improvements').value = result.improvements;
        document.getElementById('box-plan').value = result.plan;
        
    } catch (error) {
        console.error("AI Generation Error:", error);
        alert("System Error: " + error.message);
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
    }
}

// ... (Keep downloadPDF and event listeners as they were)
