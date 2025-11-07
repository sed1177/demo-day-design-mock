export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  try {
    const { text } = req.body;
    const response = await fetch(
     "https://router.huggingface.co/hf-inference/models/cardiffnlp/twitter-roberta-base-sentiment-latest",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.HF_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputs: text }),
      }
    );

    const data = await response.json();
    console.log("HF sentiment response:", data);

    if (data.error) {
      return res.status(500).json({ error: data.error });
    }

    if (!Array.isArray(data) || !Array.isArray(data[0])) {
      return res.status(500).json({ error: "Unexpected response format" });
    }

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
