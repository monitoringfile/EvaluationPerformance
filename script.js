// --- CONFIGURATION ---
const CONFIG = {
    // API KEY: When uploading to GitHub, leave this empty 
    // and use Google Cloud "Browser Restrictions" for security.
    API_KEY: "AIzaSyDi-VVIcQ3e49VebkdxrvtqNuKgCuE8vYE", 
    MODEL_URL: "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"
};

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    // Auto-calculate when dropdowns change
    document.querySelectorAll('select').forEach(el => {
        el.addEventListener('change', calculateScores);
    });

    // Sync names for signature
    document.getElementById('empName').addEventListener('input', syncSignatures);
    document.getElementById('headName').addEventListener('input', syncSignatures);

    // Button Listeners
    document.getElementById('btnAI').addEventListener('click', () => validateAndRun(generateAI));
    document.getElementById('btnPDF').addEventListener('click', () => validateAndRun(downloadPDF));
});

// --- FUNCTIONS ---

function syncSignatures() {
    document.getElementById('displayEmpName').innerText = document.getElementById('empName').value;
    document.getElementById('displayHeadName').innerText = document.getElementById('headName').value;
}

function calculateScores() {
    let sumA = 0;
    document.querySelectorAll('.calc-group-a').forEach(s => sumA += parseInt(s.value));
    
    const pctA = (sumA / 30) * 100;
    document.getElementById('subtotal-a').innerText = sumA;
    document.getElementById('status-a').innerText = pctA >= 80 ? "GOOD" : "NEEDS IMPROVEMENT";
    // Add logic for B and Overall similar to above
}

async function generateAI() {
    const btn = document.getElementById('btnAI');
    if (!CONFIG.API_KEY) return alert("API Key missing!");

    btn.innerText = "Analyzing...";
    btn.disabled = true;

    const context = {
        name: document.getElementById('empName').value,
        score: document.getElementById('subtotal-a').innerText
    };

    const prompt = `Review performance for ${context.name} with score ${context.score}/30. Return JSON: {"strengths": "...", "improvements": "...", "plan": "..."}`;

    try {
        const resp = await fetch(`${CONFIG.MODEL_URL}?key=${CONFIG.API_KEY}`, {
            method: 'POST',
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const data = await resp.json();
        const result = JSON.parse(data.candidates[0].content.parts[0].text.replace(/```json|```/g, ""));

        document.getElementById('box-strengths').value = result.strengths;
        document.getElementById('box-improvements').value = result.improvements;
        document.getElementById('box-plan').value = result.plan;
    } catch (err) {
        console.error(err);
        alert("AI Failed to generate.");
    } finally {
        btn.innerText = "Generate AI Remarks";
        btn.disabled = false;
    }
}

function downloadPDF() {
    const element = document.getElementById('evaluation-content');
    const buttons = document.getElementById('pdf-buttons');
    buttons.style.display = 'none';

    html2pdf().from(element).save().then(() => {
        buttons.style.display = 'flex';
    });
}

function validateAndRun(fn) {
    const emp = document.getElementById('empName').value;
    if (!emp) return alert("Please enter Employee Name.");
    fn();
}
