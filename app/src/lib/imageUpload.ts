import { getSupabaseClient } from "./supabaseClient";

const supabase = getSupabaseClient();

export async function uploadProductImage(
  file: File,
  tenantId: string,
): Promise<string> {
  if (!file) {
    throw new Error("No file provided");
  }

  // Validate file type
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    throw new Error(
      "Invalid file type. Only JPEG, PNG, and WebP images are allowed.",
    );
  }

  // Validate file size (max 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    throw new Error("File size too large. Maximum size is 5MB.");
  }

  // Generate unique file name
  const fileExt = file.name.split(".").pop();
  const fileName = `${tenantId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from("product-images")
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from("product-images").getPublicUrl(data.path);

  return publicUrl;
}

export async function deleteProductImage(imageUrl: string): Promise<void> {
  try {
    // Extract file path from URL
    const url = new URL(imageUrl);
    const pathMatch = url.pathname.match(/\/product-images\/(.+)/);

    if (!pathMatch) {
      console.warn("Could not extract file path from URL");
      return;
    }

    const filePath = pathMatch[1];

    const { error } = await supabase.storage
      .from("product-images")
      .remove([filePath]);

    if (error) {
      console.warn("Failed to delete image:", error.message);
    }
  } catch (error) {
    console.warn("Error deleting image:", error);
  }
}

export function getImageUrl(imagePath: string): string {
  if (!imagePath) return "";

  // If it's already a full URL, return as is
  if (imagePath.startsWith("http")) {
    return imagePath;
  }

  // Otherwise, get public URL from Supabase
  const {
    data: { publicUrl },
  } = supabase.storage.from("product-images").getPublicUrl(imagePath);

  return publicUrl;
}
