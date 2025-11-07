export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  try {
    // extract the text from the requests body
    const { text } = req.body;
    // fetch
    const response = await fetch(
      "https://router.huggingface.co/hf-inference/models/facebook/bart-large-cnn",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.HF_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: text,
          parameters: { max_length: 130, min_length: 30, do_sample: false },
        }),
      }
    );

    const data = await response.json();

    console.log("Hugging face data summary response:", data);

    if (data.error) {
      return res.status(500).json({ error: data.error });
    }

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
