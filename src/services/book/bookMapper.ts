import { Book } from "@/types/book";
import { BookQueryResult } from "./bookTypes";

export const mapBookFromDatabase = (bookData: BookQueryResult): Book => {
  const profile = bookData.profiles;

  if (import.meta.env.DEV) {
    console.log("Mapping book data");
  }

  // Ensure we have required fields
  if (!bookData.id || !bookData.seller_id) {
    throw new Error("Invalid book data: missing required fields");
  }

  return {
    id: bookData.id,
    title: bookData.title || "Unknown Title",
    author: bookData.author || "Unknown Author",
    description: bookData.description || "",
    price: bookData.price || 0,
    category: bookData.category || "Other",
    condition:
      (bookData.condition as
        | "New"
        | "Good"
        | "Better"
        | "Average"
        | "Below Average") || "Good",
    imageUrl:
      bookData.front_cover ||
      bookData.image_url ||
      (Array.isArray(bookData.additional_images) && bookData.additional_images[0]) ||
      "https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?w=400&h=300&fit=crop&auto=format&q=80",
    frontCover: bookData.front_cover || undefined,
    backCover: bookData.back_cover || undefined,
    insidePages: bookData.inside_pages || undefined,
    additionalImages: Array.isArray(bookData.additional_images) ? bookData.additional_images : [],
    sold: bookData.sold || false,
    createdAt: bookData.created_at || new Date().toISOString(),
    itemType: (bookData.item_type as 'textbook' | 'reader') || 'textbook',
    grade: bookData.grade,
    universityYear: bookData.university_year,
    university: bookData.university,
    curriculum: (bookData as any).curriculum || undefined,
    province: bookData.province || null,
    // Quantity fields
    initialQuantity: bookData.initial_quantity ?? undefined,
    availableQuantity: bookData.available_quantity ?? undefined,
    soldQuantity: bookData.sold_quantity ?? undefined,
    seller: {
      id: bookData.seller_id,
      name: (profile && (profile as any).name) || `User ${bookData.seller_id.slice(0, 8)}`,
      email: profile?.email || "",
    },
  };
};
