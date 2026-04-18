/**
 * REFI Microfinance MIS - Automated Evaluation
 * Optimized for Gemma 3 2B 
 */

// 1. FORM SYNC & PERFORMANCE LOGIC
function syncForm() {
    document.getElementById('displayEmpName').innerText = document.getElementById('empName').value;
    document.getElementById('headName') ? document.getElementById('displayHeadName').innerText = document.getElementById('headName').value : null;
    const dateVal = document.getElementById('evalDate').value;
    document.getElementById('displayEmpDate').innerText = dateVal;
    document.getElementById('displayHeadDate').innerText = dateVal;
}

function getStatus(pct) {
    if (pct >= 90) return "EXCELLENT";
    if (pct >= 80) return "GOOD";
    if (pct >= 60) return "SATISFACTORY";
    return "NEEDS IMPROVEMENT";
}

function calculateScores() {
    let sumA = 0, sumB = 0;
    document.querySelectorAll('.calc-group-a').forEach(s => sumA += (parseInt(s.value) || 0));
    document.querySelectorAll('.calc-group-b').forEach(s => sumB += (parseInt(s.value) || 0));
    
    let pctA = (sumA / 30) * 100;
    let pctB = (sumB / 30) * 100;
    
    document.getElementById('subtotal-a').innerText = sumA;
    document.getElementById('pct-a').innerText = "(" + pctA.toFixed(0) + "%)";
    document.getElementById('status-a').innerText = getStatus(pctA);
    
    document.getElementById('subtotal-b').innerText = sumB;
    document.getElementById('pct-b').innerText = "(" + pctB.toFixed(0) + "%)";
    document.getElementById('status-b').innerText = getStatus(pctB);
    
    let total = sumA + sumB;
    let totalPct = (total / 60) * 100;
    document.getElementById('overall-score').innerText = total;
    document.getElementById('overall-pct').innerText = "(" + totalPct.toFixed(0) + "%)";
    document.getElementById('overall-status').innerText = getStatus(totalPct);
}

function validateAndAction(actionFunction) {
    const required = document.querySelectorAll('.required-field');
    for (let input of required) {
        if (!input.value.trim()) {
            alert("Please fill out all required fields first.");
            input.focus();
            return;
        }
    }
    actionFunction();
}

// 2. AI GENERATION (Updated for Gemma 3 2B)
async function generateSmartRemarks(modelName = "gemma-3-2b") {
    const btn = document.querySelector('.btn-generate');
    const originalText = btn.innerText;

    // Pulls from config.js (ignored by GitHub)
    const API_KEY = window.GEMINI_CONFIG?.API_KEY; 
    
    if (!API_KEY) {
        alert("API Key not found in config.js. Please check your setup.");
        return;
    }

    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${API_KEY}`;

    btn.innerText = "Analyzing...";
    btn.disabled = true;

    const name = document.getElementById('empName').value;
    const pos = document.getElementById('empPosition').value;
    const total = document.getElementById('overall-score').innerText;

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
                    temperature: 0.4, 
                    topP: 0.8
                }
            })
        });
        
        const data = await response.json();
        if (data.error) throw new Error(data.error.message);
        
        let aiText = data.candidates[0].content.parts[0].text.replace(/```json|```/g, "").trim();
        const result = JSON.parse(aiText);
        
        document.getElementById('box-strengths').value = result.strengths;
        document.getElementById('box-improvements').value = result.improvements;
        document.getElementById('box-plan').value = result.plan;
    } catch (error) {
        console.error("Gemma AI Error:", error);
        alert("Error generating remarks. Ensure the model name is available in your AI Studio region.");
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
    }
}

// 3. PDF EXPORT
function downloadPDF() {
    const element = document.getElementById('evaluation-content');
    const buttons = document.getElementById('pdf-buttons');
    const empName = document.getElementById('empName').value || "Evaluation";
    
    buttons.style.display = 'none';

    const options = {
        margin: [0.15, 0.15, 0.15, 0.15], 
        filename: `Evaluation_${empName}.pdf`,
        image: { type: 'jpeg', quality: 1 },
        html2canvas: { scale: 3, useCORS: true },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    html2pdf().from(element).set(options).save().then(() => {
        buttons.style.display = 'flex';
    });
}

// 4. LISTENERS
document.querySelectorAll('select').forEach(s => s.addEventListener('change', calculateScores));
