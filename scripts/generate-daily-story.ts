import { createClient } from "@supabase/supabase-js"

const HF_TOKEN = process.env.HF_TOKEN
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const HF_API_URL = "https://router.huggingface.co/hf-inference"
const TEXT_MODEL = "mistralai/Mistral-7B-Instruct-v0.2"
const IMAGE_MODEL = "stabilityai/stable-diffusion-2-1"

interface StoryData {
  title: string
  text: string
  imageUrl: string | null
}

async function generateStoryWithHF(prompt: string): Promise<StoryData> {
  console.log("Generando cuento con Hugging Face...")
  
  // 1. Generar texto del cuento
  const textResponse = await fetch(`${HF_API_URL}/text/generation`, {
    headers: {
      "Authorization": `Bearer ${HF_TOKEN}`,
      "Content-Type": "application/json",
    },
    method: "POST",
    body: JSON.stringify({
      model: TEXT_MODEL,
      inputs: `Genera un cuento infantil corto y mágico para niños de 3-8 años sobre ${prompt}. El cuento debe ser alegre, con personajes amigables y un final feliz. No uses asteriscos ni markdown.`,
      parameters: {
        max_new_tokens: 800,
        temperature: 0.8,
        top_p: 0.9,
      }
    })
  })

  if (!textResponse.ok) {
    throw new Error(`Error en API de texto: ${textResponse.status}`)
  }

  const textData = await textResponse.json()
  
  // El nuevo endpoint devuelve: { generated_text: "..." }
  let fullText = textData.generated_text || textData[0]?.generated_text || ""
  
  // Limpiar el resultado - quitar asteriscos y markdown
  fullText = fullText.replace(/\*/g, "").replace(/#{1,6}\s/g, "").trim()
  
  // Extraer solo el cuento (quitar el prompt si aparece)
  const storyStart = fullText.indexOf(prompt)
  let storyText = storyStart > -1 ? fullText.substring(storyStart + prompt.length) : fullText
  storyText = storyText.trim().substring(0, 2000) // Limitar a 2000 caracteres

  // Generar título del cuento
  const title = `El mágico ${prompt}`

  // 2. Generar imagen (opcional - puede fallar por rate limit)
  let imageUrl: string | null = null
  
  try {
    console.log("Generando imagen...")
    const imageResponse = await fetch(`${HF_API_URL}/text-to-image`, {
      headers: {
        "Authorization": `Bearer ${HF_TOKEN}`,
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify({
        model: IMAGE_MODEL,
        inputs: `Ilustración de cuento infantil mágica y colorida para niños: ${prompt}, estilo Disney Pixar, colores brillantes, personajes amigables, arte digital`,
        parameters: {
          negative_prompt: "ugly, distorted, dark, scary",
          num_inference_steps: 30,
          guidance_scale: 7.5,
        }
      })
    })

    if (imageResponse.ok) {
      const imageBlob = await imageResponse.blob()
      // Guardar la imagen en Supabase Storage
      const fileName = `story_${Date.now()}.png`
      
      if (SUPABASE_URL && SUPABASE_KEY) {
        const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
        const { data, error } = await supabase.storage
          .from("story-images")
          .upload(fileName, imageBlob, { contentType: "image/png" })
        
        if (!error && data) {
          const { data: urlData } = supabase.storage.from("story-images").getPublicUrl(fileName)
          imageUrl = urlData.publicUrl
        }
      }
    }
  } catch (imgError) {
    console.log("Error generando imagen (continuando sin ella):", imgError)
  }

  return {
    title,
    text: storyText,
    imageUrl
  }
}

async function saveStoryToSupabase(story: StoryData) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error("Faltan credenciales de Supabase")
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
  
  const { data, error } = await supabase
    .from("stories")
    .insert([
      {
        title: story.title,
        text: story.text,
        image_url: story.imageUrl,
        is_published: true,
        created_at: new Date().toISOString(),
      }
    ])

  if (error) {
    throw new Error(`Error guardando en Supabase: ${error.message}`)
  }

  return data
}

// Función principal
async function main() {
  const topic = process.env.STORY_TOPIC || "unicornios"
  
  try {
    const story = await generateStoryWithHF(topic)
    await saveStoryToSupabase(story)
    
    console.log("✅ Cuento diario generado y guardado exitosamente!")
    console.log(`Título: ${story.title}`)
    console.log(`Imagen: ${story.imageUrl ? "Sí" : "No"}`)
  } catch (error) {
    console.error("❌ Error:", error)
    process.exit(1)
  }
}

main()
