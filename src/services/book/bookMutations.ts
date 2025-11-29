import { supabase } from "@/integrations/supabase/client";
import { Book, BookFormData } from "@/types/book";
import { mapBookFromDatabase } from "./bookMapper";
import { handleBookServiceError } from "./bookErrorHandler";
import { BookQueryResult } from "./bookTypes";
import { ActivityService } from "@/services/activityService";

export const createBook = async (bookData: BookFormData): Promise<Book> => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("User not authenticated");
    }

    // Fetch province and pickup address from user profile
    let province = null;
    let pickupAddress = null;
    let affiliateRefId = null;

    try {
      // Get encrypted address from profile - required for book creation
      const { data: encryptedAddressData, error: decryptError } = await supabase.functions.invoke('decrypt-address', {
        body: {
          fetch: {
            table: 'profiles',
            target_id: user.id,
            address_type: 'pickup'
          }
        }
      });

      if (encryptedAddressData && encryptedAddressData.success && encryptedAddressData.data) {
        pickupAddress = encryptedAddressData.data;

        // Extract province from encrypted address
        if (pickupAddress?.province) {
          province = pickupAddress.province;
        }
      } else {
        throw new Error("You must set up your pickup address in your profile before listing a book. Please go to your profile and add your address.");
      }

      // Check if user was referred - if so, get the affiliate_ref_id
      try {
        const { data: referralData } = await supabase
          .from("affiliates_referrals")
          .select("affiliate_id")
          .eq("referred_user_id", user.id)
          .maybeSingle();

        if (referralData?.affiliate_id) {
          affiliateRefId = referralData.affiliate_id;
        }
      } catch (referralError) {
    }
    } catch (addressError) {
      // Re-throw error since address is required for book creation
      throw addressError;
    }

    // Create book data with all required fields (no plaintext address storage)
    const quantity = Math.max(1, Number((bookData as any).quantity || 1));

    const fullBookData = {
      seller_id: user.id,
      title: bookData.title,
      author: bookData.author,
      description: bookData.description,
      price: bookData.price,
      category: bookData.category,
      condition: bookData.condition,
      image_url: bookData.imageUrl || bookData.frontCover || bookData.backCover || bookData.insidePages,
      front_cover: bookData.frontCover,
      back_cover: bookData.backCover,
      inside_pages: bookData.insidePages,
      additional_images: (() => { const extras = (bookData.additionalImages || []).filter(Boolean); return extras.length > 0 ? extras : null; })(),
      item_type: bookData.itemType || 'textbook',
      grade: bookData.grade,
      university_year: bookData.universityYear,
      curriculum: (bookData as any).curriculum || null,
      genre: (bookData as any).genre || null,
      province: province,
      affiliate_ref_id: affiliateRefId,
      // Quantity fields at creation
      initial_quantity: quantity,
      available_quantity: quantity,
      sold_quantity: 0,
    };


    const { data: book, error } = await supabase
      .from("books")
      .insert([fullBookData])
      .select()
      .single();

    if (error) {
      handleBookServiceError(error, "create book");
    }

    // Encrypt and save pickup address to books table if we have an address
    if (pickupAddress && book.id) {
      try {
        const { data: encryptResult, error: encryptError } = await supabase.functions.invoke('encrypt-address', {
          body: {
            object: pickupAddress,
            save: {
              table: 'books',
              target_id: book.id,
              address_type: 'pickup'
            }
          }
        });

        if (encryptResult && encryptResult.success) {
        } else {
        }
      } catch (encryptError) {
      }
    }

    // Fetch seller profile
    const { data: seller } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, email")
      .eq("id", user.id)
      .single();

    const bookWithProfile: BookQueryResult = {
      ...book,
      profiles: seller
        ? {
            id: seller.id,
            name: [seller.first_name, seller.last_name].filter(Boolean).join(" ") || (seller as any).name || (seller.email ? seller.email.split("@")[0] : ""),
            email: seller.email,
          }
        : null,
    };

    const mappedBook = mapBookFromDatabase(bookWithProfile);

    // Log activity for book listing
    try {
      await ActivityService.logBookListing(
        user.id,
        book.id,
        bookData.title,
        bookData.price,
      );
    } catch (activityError) {
      // Don't throw here - book creation was successful, activity logging is secondary
    }

    return mappedBook;
  } catch (error) {
    handleBookServiceError(error, "create book");
    throw error; // This line will never be reached due to handleBookServiceError throwing, but TypeScript needs it
  }
};

export const updateBook = async (
  bookId: string,
  bookData: Partial<BookFormData>,
): Promise<Book | null> => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("User not authenticated");
    }

    // First verify the user owns this book
    const { data: existingBook, error: fetchError } = await supabase
      .from("books")
      .select("seller_id")
      .eq("id", bookId)
      .single();

    if (fetchError || !existingBook) {
      throw new Error("Book not found");
    }

    if (existingBook.seller_id !== user.id) {
      throw new Error("User not authorized to edit this book");
    }

    const updateData: any = {};

    if (bookData.title !== undefined) updateData.title = bookData.title;
    if (bookData.author !== undefined) updateData.author = bookData.author;
    if (bookData.description !== undefined)
      updateData.description = bookData.description;
    if (bookData.price !== undefined) updateData.price = bookData.price;
    if (bookData.category !== undefined)
      updateData.category = bookData.category;
    if (bookData.condition !== undefined)
      updateData.condition = bookData.condition;
    if ((bookData as any).curriculum !== undefined)
      updateData.curriculum = (bookData as any).curriculum;
    if ((bookData as any).genre !== undefined)
      updateData.genre = (bookData as any).genre;
    if (bookData.imageUrl !== undefined)
      updateData.image_url = bookData.imageUrl;
    if (bookData.frontCover !== undefined)
      updateData.front_cover = bookData.frontCover;
    if (bookData.backCover !== undefined)
      updateData.back_cover = bookData.backCover;
    if (bookData.insidePages !== undefined)
      updateData.inside_pages = bookData.insidePages;
    if (bookData.additionalImages !== undefined) {
      const extras = (bookData.additionalImages || []).filter(Boolean);
      updateData.additional_images = extras.length > 0 ? extras : null;
    }
    if (bookData.grade !== undefined) updateData.grade = bookData.grade;
    if (bookData.universityYear !== undefined)
      updateData.university_year = bookData.universityYear;
    if ((bookData as any).quantity !== undefined) {
      const qty = Math.max(1, Number((bookData as any).quantity));
      updateData.available_quantity = qty;
      // Do not reduce initial_quantity on edit; optionally increase if higher than initial
      updateData.initial_quantity = updateData.initial_quantity ?? undefined;
    }

    const { data: book, error } = await supabase
      .from("books")
      .update(updateData)
      .eq("id", bookId)
      .select()
      .single();

    if (error) {
      handleBookServiceError(error, "update book");
    }

    // Fetch seller profile
    const { data: seller } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, email")
      .eq("id", book.seller_id)
      .single();

    const bookWithProfile: BookQueryResult = {
      ...book,
      profiles: seller
        ? {
            id: seller.id,
            name: [seller.first_name, seller.last_name].filter(Boolean).join(" ") || (seller as any).name || (seller.email ? seller.email.split("@")[0] : ""),
            email: seller.email,
          }
        : null,
    };

    return mapBookFromDatabase(bookWithProfile);
  } catch (error) {
    handleBookServiceError(error, "update book");
    return null; // This line will never be reached due to handleBookServiceError throwing, but TypeScript needs it
  }
};

export const deleteBook = async (bookId: string, forceDelete: boolean = false): Promise<void> => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("User not authenticated");
    }

    // First verify the user owns this book or is an admin
    const { data: existingBook, error: fetchError } = await supabase
      .from("books")
      .select("seller_id, title")
      .eq("id", bookId)
      .single();

    if (fetchError || !existingBook) {
      handleBookServiceError(
        fetchError || new Error("Book not found"),
        "delete book - book not found",
      );
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    const isAdmin = profile?.is_admin || false;
    const isOwner = existingBook.seller_id === user.id;

    if (!isAdmin && !isOwner) {
      throw new Error("User not authorized to delete this book");
    }


    // Delete related records first to maintain referential integrity

    // Try to check for orders with book_id column first (if it exists)
    let relatedOrders: any[] = [];

    try {
      const { data: directOrders, error: directOrdersError } = await supabase
        .from("orders")
        .select("id, status, book_id")
        .eq("book_id", bookId);

      if (!directOrdersError && directOrders) {
        relatedOrders = directOrders;
      }
    } catch (error) {
    }

    // If no direct book_id column, check items JSON
    if (relatedOrders.length === 0) {
      const { data: allOrders, error: ordersCheckError } = await supabase
        .from("orders")
        .select("id, status, items");

      if (!ordersCheckError && allOrders) {
        relatedOrders = allOrders.filter(order => {
          if (!order.items || !Array.isArray(order.items)) return false;
          return order.items.some((item: any) => item.book_id === bookId);
        });
      }
    }

    // If there are active orders, handle based on force delete flag
    const activeOrders = relatedOrders.filter(order =>
      !["cancelled", "refunded", "declined", "completed"].includes(order.status)
    );

    if (activeOrders.length > 0) {
      if (!forceDelete) {
        throw new Error(
          `Cannot delete book: There are ${activeOrders.length} active order(s) for this book. ` +
          "Please wait for orders to complete or be cancelled before deleting."
        );
      }

      // Admin force delete: Cancel active orders first
      if (isAdmin && forceDelete) {
        for (const order of activeOrders) {
          try {
            // Cancel the order by updating its status
            const { error: cancelError } = await supabase
              .from("orders")
              .update({
                status: "cancelled",
                cancelled_at: new Date().toISOString(),
                cancellation_reason: `Book deleted by admin - Book ID: ${bookId}`
              })
              .eq("id", order.id);

            if (cancelError) {
            }
          } catch (error) {
          }
        }

      } else {
        throw new Error(
          `Cannot force delete: Only admins can force delete books with active orders.`
        );
      }
    }

    // Try to delete orders that reference this book (for cleanup)
    if (relatedOrders.length > 0) {
      try {
        const { error: ordersDeleteError } = await supabase
          .from("orders")
          .delete()
          .eq("book_id", bookId);
      } catch (error) {
      }
    }

    // Delete any reports related to this book
    const { error: reportsDeleteError } = await supabase
      .from("reports")
      .delete()
      .eq("book_id", bookId);

    // Continue with deletion even if reports cleanup fails

    // Delete any transactions related to this book
    const { error: transactionsDeleteError } = await supabase
      .from("transactions")
      .delete()
      .eq("book_id", bookId);

    // Continue with deletion even if transactions cleanup fails

    // Finally delete the book itself
    const { error: deleteError } = await supabase
      .from("books")
      .delete()
      .eq("id", bookId);

    if (deleteError) {
      throw new Error(`Failed to delete book: ${deleteError.message}`);
    }
  } catch (error) {
    handleBookServiceError(error, "delete book");
    throw error; // This line will never be reached due to handleBookServiceError throwing, but TypeScript needs it
  }
};
