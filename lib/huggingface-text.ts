const HF_API_URL = "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2"
const HF_TOKEN = process.env.HF_TOKEN

export async function generateStory(prompt: string): Promise<string> {
  const response = await fetch(HF_API_URL, {
    headers: {
      "Authorization": `Bearer ${HF_TOKEN}`,
      "Content-Type": "application/json",
    },
    method: "POST",
    body: JSON.stringify({
      inputs: `Genera un cuento infantil corto y mágico para niños de 3-8 años. ${prompt}. El cuento debe ser alegre, con personajes amigables y un final feliz. No uses asteriscos.`,
      parameters: {
        max_new_tokens: 500,
        temperature: 0.8,
        top_p: 0.9,
      }
    })
  })

  if (!response.ok) {
    throw new Error(`HF API error: ${response.status}`)
  }

  const data = await response.json()
  const generatedText = data[0]?.generated_text || ""
  
  // Limpiar asteriscos del resultado
  return generatedText.replace(/\*/g, "").trim()
}
