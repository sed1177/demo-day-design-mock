/*
I used googles AI to get recommendations on which AI platforms to use for my website for free, and 
it gave me hugging face (https://huggingface.co/)

*/

// Bad words filter (case-insensitive; expand as needed for your use case)
const BAD_WORDS = [
    "bad word"

    // ill be populating this for my real project. I didn't want to put actual horrible words 
    // here in the mock project, but I did test it out and it works. 
]

function hasBadWords(text) {
    const lowerText = text.toLowerCase() // lowerCase 
    return BAD_WORDS.some(word => lowerText.includes(word.toLowerCase()))
}

// hidden key
const HF_TOKEN = ''


// handling CORS through a proxy
const CORS_PROXY = 'https://corsproxy.io/?';

const form = document.getElementById('summarizeForm')
const textarea = document.getElementById('articleText')
const loading = document.getElementById('loading')
const results = document.getElementById('results')
const errorDiv = document.getElementById('error')


form.addEventListener('submit', async (e) => {
    e.preventDefault()
    const text = textarea.value.trim()
    if (!text) {
        showError('Please enter some text to analyze.')
        return
    }

    // Content filter: Check for bad words in the bad words array
    if (hasBadWords(text)) {
        showError('Content Warning!: Detected potentially harmful or dehumanizing language (e.g., slurs). Please review and edit your input to ensure it\'s appropriate before using the analyzing tool! We aim to keep this tool respectful!');
        return
    }

    showLoading()
    try {

        // Fetch summary and sentiment in parallel for better UX
        const [summary, sentimentData] = await Promise.all([
            getSummary(text),
            getSentiment(text)
        ])

        displayResults(summary, sentimentData)
    } catch (err) {
        console.error(err)
        showError(`Oops! Something went wrong: ${err.message}`)
    } finally {
        hideLoading()
    }
});

// gettin summary of the article using facebooks BART (lol bart) model via Hugging Face Inference API (with CORS proxy)
async function getSummary(text) {
    const model = 'facebook/bart-large-cnn'
    const apiUrl = `https://router.huggingface.co/hf-inference/models/${model}`
    const proxyUrl = CORS_PROXY + encodeURIComponent(apiUrl)

    const response = await fetch(proxyUrl, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${HF_TOKEN}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            inputs: text,
            parameters: {
                max_length: 130,
                min_length: 30,
                do_sample: false
            }
        })
    });

    if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Summary API failed: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    if (!data || !data[0]) {
        throw new Error('No summary generated. Try shorter text.')
    }
    return data[0].summary_text
}

// using sentiment analysis using Twitter RoBERTa model via Hugging Face Inference API (with CORS proxy)
// i used googles AI to give me a recommendation on how to get sentiment and it took me to huggingface roberta base sentiment
// https://huggingface.co/cardiffnlp/twitter-roberta-base-sentiment
async function getSentiment(text) {
    const model = 'cardiffnlp/twitter-roberta-base-sentiment-latest';
    const apiUrl = `https://router.huggingface.co/hf-inference/models/${model}`;
    const proxyUrl = CORS_PROXY + encodeURIComponent(apiUrl);

    const response = await fetch(proxyUrl, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${HF_TOKEN}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            inputs: text,
            parameters: {
                return_all_scores: true
            }
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Sentiment API failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    if (!data) {
        throw new Error('No sentiment data generated.');
    }

    // mapping the labels negative -> neutral -> positive!
    const labelMap = {
        'LABEL_0': 'negative',
        'LABEL_1': 'neutral',
        'LABEL_2': 'positive'
    };

    return data[0].map(item => ({
        label: labelMap[item.label] || item.label.toLowerCase(),
        score: Math.round(item.score * 100)
    }));
}

// takes in a summary article and a sentiment
function displayResults(summary, sentiments) {
    document.getElementById('summaryText').textContent = summary

    const section = document.getElementById('sentimentSection')
    let html = ''
    sentiments.forEach(s => {
        html += `
            <div class="sentiment-item ${s.label}">
                <div class="sentiment-label">${s.label.toUpperCase()}</div>
                <div class="sentiment-value">${s.score}%</div>
            </div>
        `
    })
    section.innerHTML = html

    results.style.display = 'block'
    textarea.value = '' // Clear the textarea after its successful!!
}

function showLoading() {
    loading.style.display = 'block'
    results.style.display = 'none'
    errorDiv.style.display = 'none'
}

function hideLoading() {
    loading.style.display = 'none'
}

function showError(message) {
    errorDiv.textContent = message
    errorDiv.style.display = 'block'
}

// Handle the "Analyze Another Article" button
document.addEventListener('DOMContentLoaded', () => {
    const analyzeAnotherBtn = document.getElementById('analyzeAnother')
    analyzeAnotherBtn.addEventListener('click', () => {
        document.getElementById('summarizeForm').reset()

        results.style.display = 'none'
        errorDiv.style.display = 'none'
        textarea.focus()
    })
})