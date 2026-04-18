/**
 * SECTION 1: FORM SYNCING & UI LOGIC
 */

// Synchronizes the names and dates between the input fields and the signature lines
function syncForm() {
    document.getElementById('displayEmpName').innerText = document.getElementById('empName').value;
    document.getElementById('displayHeadName').innerText = document.getElementById('headName').value;
    const dateVal = document.getElementById('evalDate').value;
    document.getElementById('displayEmpDate').innerText = dateVal;
    document.getElementById('displayHeadDate').innerText = dateVal;
}

// Converts percentage to performance status text
function getStatus(pct) {
    if (pct >= 90) return "EXCELLENT";
    if (pct >= 80) return "GOOD";
    if (pct >= 60) return "SATISFACTORY";
    return "NEEDS IMPROVEMENT";
}

// Calculates subtotals for sections A & B and determines the overall total
function calculateScores() {
    let sumA = 0, sumB = 0;
    document.querySelectorAll('.calc-group-a').forEach(s => sumA += parseInt(s.value));
    document.querySelectorAll('.calc-group-b').forEach(s => sumB += parseInt(s.value));
    
    let pctA = (sumA / 30) * 100;
    let pctB = (sumB / 30) * 100;
    
    // Update Section A UI
    document.getElementById('subtotal-a').innerText = sumA;
    document.getElementById('pct-a').innerText = "(" + pctA.toFixed(0) + "%)";
    document.getElementById('status-a').innerText = getStatus(pctA);
    
    // Update Section B UI
    document.getElementById('subtotal-b').innerText = sumB;
    document.getElementById('pct-b').innerText = "(" + pctB.toFixed(0) + "%)";
    document.getElementById('status-b').innerText = getStatus(pctB);
    
    // Update Overall Summary UI
    let total = sumA + sumB;
    let totalPct = (total / 60) * 100;
    document.getElementById('overall-score').innerText = total;
    document.getElementById('overall-pct').innerText = "(" + totalPct.toFixed(0) + "%)";
    document.getElementById('overall-status').innerText = getStatus(totalPct);
}

// Validation wrapper to ensure required fields are filled before AI or PDF action
function validateAndAction(actionFunction) {
    const required = document.querySelectorAll('.required-field');
    for (let input of required) {
        if (!input.value.trim()) {
            alert("Please fill out all required header fields first (Branch, Date, Name, etc.).");
            input.focus();
            return;
        }
    }
    actionFunction();
}

// Resets the saved API Key in the browser
function clearApiKey() {
    localStorage.removeItem('GEMINI_KEY');
    alert("API Key cleared. You will be prompted for a new one next time you generate remarks.");
}

/**
 * SECTION 2: AI INTEGRATION (GEMINI 3 FLASH)
 */

async function generateSmartRemarks() {
    const btn = document.querySelector('.btn-generate');
    const originalText = btn.innerText;

    // LEAK PREVENTION: Retrieve key from browser memory, not code
    let API_KEY = localStorage.getItem('GEMINI_KEY');

    // If no key is found, prompt the user
    if (!API_KEY) {
        API_KEY = prompt("Please enter your Gemini API Key (This is saved only in your browser's memory):");
        if (API_KEY) {
            localStorage.setItem('GEMINI_KEY', API_KEY);
        } else {
            return; // User cancelled
        }
    }

    // Model Endpoint: Using Gemini 3 Flash for fast text generation
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${API_KEY}`;

    btn.innerText = "Analyzing...";
    btn.disabled = true;

    const name = document.getElementById('empName').value;
    const pos = document.getElementById('empPosition').value;
    const total = document.getElementById('overall-score').innerText;

    // Optimized prompt for structural data extraction
    const promptText = `Analyze performance for ${name}, holding position ${pos}. Score: ${total}/60. Return ONLY a JSON object with keys "strengths", "improvements", and "plan", each containing 1 professional sentence.`;

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] })
        });
        
        const data = await response.json();
        
        // Handle invalid API Keys or Errors
        if (data.error) {
            if (data.error.code === 400 || data.error.message.toLowerCase().includes("key")) {
                localStorage.removeItem('GEMINI_KEY');
                throw new Error("Invalid API Key detected. Please re-enter a valid key.");
            }
            throw new Error(data.error.message);
        }

        // Clean and parse the AI text response
        let aiText = data.candidates[0].content.parts[0].text.replace(/```json|```/g, "").trim();
        const result = JSON.parse(aiText);

        // Map AI results to textarea fields
        document.getElementById('box-strengths').value = result.strengths || "";
        document.getElementById('box-improvements').value = result.improvements || "";
        document.getElementById('box-plan').value = result.plan || "";

    } catch (error) {
        alert("AI Error: " + error.message);
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
    }
}

/**
 * SECTION 3: EXPORT LOGIC
 */

function downloadPDF() {
    const element = document.getElementById('evaluation-content');
    const buttons = document.getElementById('pdf-buttons');
    const empName = document.getElementById('empName').value || "Employee_Evaluation";
    
    // Hide buttons during PDF generation so they don't appear in the document
    buttons.style.display = 'none';

    const options = {
        margin: [0.15, 0.15, 0.15, 0.15], 
        filename: `Evaluation_${empName.replace(/\s+/g, '_')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 3, useCORS: true, letterRendering: true },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
        pagebreak: { mode: 'avoid-all' }
    };

    html2pdf().from(element).set(options).save().then(() => {
        // Restore buttons after PDF is ready
        buttons.style.display = 'flex';
    });
}

/**
 * SECTION 4: INITIALIZATION
 */

// Add listeners to all dropdown selects to update the total score automatically
document.querySelectorAll('select').forEach(s => {
    s.addEventListener('change', calculateScores);
});

// Run initial calculation to set defaults
calculateScores();
