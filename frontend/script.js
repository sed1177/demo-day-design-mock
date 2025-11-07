/*
  ArticleOS - Secure + Stable Version
  Works with Node/Express backend that exposes:
    • POST /api/summarize
    • POST /api/sentiment
*/

// --- bad words array will contain more later ehen i hide this on the backend. i dont want to include bad words 
//  for other to see! ---
const BAD_WORDS = ["bad word"];

function hasBadWords(text) {
  const lowerText = text.toLowerCase();
  return BAD_WORDS.some((word) => lowerText.includes(word.toLowerCase()));
}

const SUMMARY_API = "/api/summarize";
const SENTIMENT_API = "/api/sentiment";

const form = document.getElementById("summarizeForm");
const textarea = document.getElementById("articleText");
const loading = document.getElementById("loading");
const results = document.getElementById("results");
const errorDiv = document.getElementById("error");


form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = textarea.value.trim();

  if (!text) {
    showError("Please enter some text to analyze.");
    return;
  }

  if (hasBadWords(text)) {
    showError(
      "⚠️ Content Warning: Detected potentially harmful language. Please edit your text before analyzing."
    );
    return;
  }

  showLoading();

  try {
    // Run summary + sentiment in parallel!
    const [summary, sentimentData] = await Promise.all([
      getSummary(text),
      getSentiment(text),
    ]);

    displayResults(summary, sentimentData);
  } catch (err) {
    console.error(err);
    showError(`Oops! Something went wrong: ${err.message}`);
  } finally {
    hideLoading();
  }
});

// --- Fetch summary from mys server---
async function getSummary(text) {
  const response = await fetch(SUMMARY_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });

  const data = await response.json();

  // Handle Hugging Face errors gracefully
  if (data.error) throw new Error(data.error);

  if (!Array.isArray(data) || !data[0]?.summary_text) {
    throw new Error("No summary generated.");
  }

  return data[0].summary_text;
}

// --- Fetch sentiment fromserver ---
async function getSentiment(text) {
  const response = await fetch(SENTIMENT_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });

  const data = await response.json();

  if (data.error) throw new Error(data.error);
  if (!Array.isArray(data) || !Array.isArray(data[0])) {
    throw new Error("No sentiment data returned.");
  }

  const labelMap = {
    LABEL_0: "negative",
    LABEL_1: "neutral",
    LABEL_2: "positive",
  };

  return data[0].map((item) => ({
    label: labelMap[item.label] || item.label.toLowerCase(),
    score: Math.round(item.score * 100),
  }));
}

// --- Display results on the page!---
function displayResults(summary, sentiments) {
  document.getElementById("summaryText").textContent = summary;

  const section = document.getElementById("sentimentSection");
  let html = "";
  sentiments.forEach((s) => {
    html += `
      <div class="sentiment-item ${s.label}">
        <div class="sentiment-label">${s.label.toUpperCase()}</div>
        <div class="sentiment-value">${s.score}%</div>
      </div>
    `;
  });
  section.innerHTML = html;

  results.style.display = "block";
  textarea.value = ""; // clear after success
}

// --- UI helpers ---
function showLoading() {
  loading.style.display = "block";
  results.style.display = "none";
  errorDiv.style.display = "none";
}

function hideLoading() {
  loading.style.display = "none";
}

function showError(message) {
  errorDiv.textContent = message;
  errorDiv.style.display = "block";
}

// --- “Analyze Another Article” button ---
document.addEventListener("DOMContentLoaded", () => {
  const analyzeAnotherBtn = document.getElementById("analyzeAnother");
  analyzeAnotherBtn.addEventListener("click", () => {
    document.getElementById("summarizeForm").reset();
    results.style.display = "none";
    errorDiv.style.display = "none";
    textarea.focus();
  });
});
