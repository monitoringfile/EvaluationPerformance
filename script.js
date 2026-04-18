function syncForm() {
    document.getElementById('displayEmpName').innerText = document.getElementById('empName').value;
    document.getElementById('displayHeadName').innerText = document.getElementById('headName').value;
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
    document.querySelectorAll('.calc-group-a').forEach(s => sumA += parseInt(s.value));
    document.querySelectorAll('.calc-group-b').forEach(s => sumB += parseInt(s.value));
    
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

async function generateSmartRemarks() {
    const btn = document.querySelector('.btn-generate');
    const originalText = btn.innerText;
    const RAW_KEY = "AIzaSyCCeoixOssCd_tAjlwyhQHe-MUqKH6k2iM"; 
    const API_KEY = RAW_KEY.trim(); 
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${API_KEY}`;

    btn.innerText = "Analyzing...";
    btn.disabled = true;

    const name = document.getElementById('empName').value;
    const pos = document.getElementById('empPosition').value;
    const total = document.getElementById('overall-score').innerText;

    const promptText = `Analyze performance: ${name}, ${pos}. Score: ${total}/60. Return ONLY JSON: {"strengths": "1 sentence", "improvements": "1 sentence", "plan": "1 sentence"}`;

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] })
        });
        const data = await response.json();
        if (data.error) throw new Error(data.error.message);
        let aiText = data.candidates[0].content.parts[0].text.replace(/```json|```/g, "").trim();
        const result = JSON.parse(aiText);
        document.getElementById('box-strengths').value = result.strengths;
        document.getElementById('box-improvements').value = result.improvements;
        document.getElementById('box-plan').value = result.plan;
    } catch (error) {
        alert("Error: " + error.message);
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
    }
}

function downloadPDF() {
    const element = document.getElementById('evaluation-content');
    const buttons = document.getElementById('pdf-buttons');
    const empName = document.getElementById('empName').value || "Evaluation";
    
    buttons.style.display = 'none';

    const options = {
        margin: [0.15, 0.15, 0.15, 0.15], 
        filename: `Evaluation_${empName}.pdf`,
        image: { type: 'jpeg', quality: 1 },
        html2canvas: { scale: 3, useCORS: true, letterRendering: true },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
        pagebreak: { mode: 'avoid-all' }
    };

    html2pdf().from(element).set(options).save().then(() => {
        buttons.style.display = 'flex';
    });
}

document.querySelectorAll('select').forEach(s => s.addEventListener('change', calculateScores));
