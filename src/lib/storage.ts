import { supabase } from "./supabase";

const BUCKET = "produtos";

export async function uploadImagemProduto(
  file: File
): Promise<{ url: string } | { erro: string }> {
  const ext = file.name.split(".").pop() || "jpg";
  const nome = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`;

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(nome, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    console.error("Erro upload:", error);
    return { erro: error.message };
  }

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(data.path);
  return { url: urlData.publicUrl };
}
