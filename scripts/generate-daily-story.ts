import { createClient } from "@supabase/supabase-js"
import { HfInference } from "@huggingface/inference"

const HF_TOKEN = process.env.HF_TOKEN
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const TEXT_MODEL = "mistralai/Mistral-7B-Instruct-v0.2"
const IMAGE_MODEL = "stabilityai/stable-diffusion-2-1"

interface StoryData {
  title: string
  text: string
  imageUrl: string | null
}

async function generateStoryWithHF(prompt: string): Promise<StoryData> {
  console.log("Generando cuento con Hugging Face...")
  
  const hf = new HfInference(HF_TOKEN)
  
  // 1. Generar texto del cuento
  console.log("Generando texto...")
  try {
    const result = await hf.textGeneration({
      model: TEXT_MODEL,
      inputs: `Genera un cuento infantil corto y mágico para niños de 3-8 años sobre ${prompt}. El cuento debe ser alegre, con personajes amigables y un final feliz. No uses asteriscos ni markdown.`,
      parameters: {
        max_new_tokens: 800,
        temperature: 0.8,
      }
    })
    
    let fullText = result.generated_text || ""
    fullText = fullText.replace(/\*/g, "").replace(/#{1,6}\s/g, "").trim()
    
    const storyText = fullText.trim().substring(0, 2000)
    const title = `El mágico ${prompt}`
    
    // 2. Generar imagen (opcional)
    let imageUrl: string | null = null
    
    try {
      console.log("Generando imagen...")
      const imageBlob = await hf.textToImage({
        model: IMAGE_MODEL,
        inputs: `Ilustración de cuento infantil mágica y colorida para niños: ${prompt}, estilo Disney Pixar, colores brillantes, personajes amigables, arte digital`,
        parameters: {
          negative_prompt: "ugly, distorted, dark, scary",
          num_inference_steps: 30,
          guidance_scale: 7.5,
        }
      })
      
      if (imageBlob && SUPABASE_URL && SUPABASE_KEY) {
        const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
        const fileName = `story_${Date.now()}.png`
        
        const { data, error } = await supabase.storage
          .from("story-images")
          .upload(fileName, imageBlob, { contentType: "image/png" })
        
        if (!error && data) {
          const { data: urlData } = supabase.storage.from("story-images").getPublicUrl(fileName)
          imageUrl = urlData.publicUrl
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
  } catch (error) {
    console.error("Error completo:", error)
    throw new Error(`Error generando cuento: ${error}`)
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
