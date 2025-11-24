import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  User,
  MapPin,
  Calendar,
  BookOpen,
  Star,
  ArrowLeft,
  Share2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { Book } from "@/types/book";
import { toast } from "sonner";
import { useCart } from "@/contexts/CartContext";
import Layout from "@/components/Layout";

interface SellerProfile {
  id: string;
  name: string;
  email: string;
  bio?: string;
  profile_picture_url?: string;
  created_at: string;
  province?: string;
  hasName?: boolean;
}

const SellerProfile = () => {
  const { sellerId } = useParams<{ sellerId: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [seller, setSeller] = useState<SellerProfile | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sellerId) {
      setError("Seller ID not provided");
      setLoading(false);
      return;
    }

    fetchSellerData();
  }, [sellerId]);

  const fetchSellerData = async () => {
    try {
      setLoading(true);

      // Fetch seller profile
      const { data: sellerData, error: sellerError } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, email, bio, profile_picture_url, created_at")
        .eq("id", sellerId)
        .maybeSingle();

      const displayName = [sellerData?.first_name, sellerData?.last_name].filter(Boolean).join(" ") || (sellerData as any)?.name || (sellerData as any)?.full_name || sellerData?.email?.split("@")[0] || "";
      if (sellerData) {
        setSeller({ ...(sellerData as any), name: displayName, province: undefined, hasName: Boolean(displayName) });
      } else {
        setSeller({ id: sellerId!, name: displayName, email: "", created_at: new Date().toISOString(), province: undefined, hasName: false });
      }

      // Fetch seller's books
      const { data: booksData, error: booksError } = await supabase
        .from("books")
        .select(
          `
          id, title, author, description, price, category, condition,
          image_url, front_cover, back_cover, inside_pages, sold,
          created_at, grade, university_year, province
        `,
        )
        .eq("seller_id", sellerId)
        .eq("sold", false)
        .order("created_at", { ascending: false });

      if (booksError) {
        throw new Error("Failed to fetch seller's books");
      }

      // Transform books data to match Book interface
      const transformedBooks: Book[] = (booksData || []).map((book) => ({
        id: book.id,
        title: book.title,
        author: book.author,
        description: book.description,
        price: book.price,
        category: book.category,
        condition: book.condition as Book["condition"],
        imageUrl: book.image_url,
        frontCover: book.front_cover,
        backCover: book.back_cover,
        insidePages: book.inside_pages,
        sold: book.sold,
        createdAt: book.created_at,
        grade: book.grade,
        universityYear: book.university_year,
        province: book.province,
        seller: {
          id: sellerId!,
          name: displayName,
          email: sellerData?.email || "",
        },
      }));

      setBooks(transformedBooks);

      // Fallback province from books if profile missing it
      const fallbackProvince = transformedBooks.find((b) => !!b.province)?.province;
      if (fallbackProvince) {
        setSeller((prev) => (prev ? { ...prev, province: fallbackProvince } : prev));
      }

      if (!sellerData && transformedBooks.length === 0) {
        throw new Error("Seller not found");
      }
    } catch (err) {
      console.error("Error fetching seller data:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (book: Book) => {
    addToCart(book);
  };

  const handleBookClick = (bookId: string) => {
    navigate(`/books/${bookId}`);
  };

  const handleBackToMarketplace = () => {
    navigate("/books");
  };

  const handleShareProfile = async () => {
    if (!seller) return;

    const profileUrl = `${window.location.origin}/seller/${seller.id}`;
    const titleText = seller.name && seller.name.trim().length > 0 ? `${seller.name} ReBooked Mini` : "ReBooked Mini";
    const shareData = {
      title: titleText,
      text: seller.hasName && seller.name
        ? `Check out ${seller.name}'s books on ReBooked! They have ${books.length} books available.`
        : `Check out this seller's books on ReBooked! They have ${books.length} books available.`,
      url: profileUrl,
    };

    try { await navigator.clipboard.writeText(profileUrl); } catch {}

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        toast.success("Link copied • Share sheet opened");
        return;
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          return;
        }
      }
    }

    toast.success("Profile link copied to clipboard!");
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-book-600"></div>
        </div>
      </Layout>
    );
  }

  if (error || !seller) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="p-6 text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Seller Not Found
              </h2>
              <p className="text-gray-600 mb-4">
                {error ||
                  "The seller profile you're looking for doesn't exist."}
              </p>
              <Button onClick={() => navigate("/books")} variant="outline">
                Browse All Books
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  const memberSince = new Date(seller.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
  });

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 pb-16">
        {/* Back to Marketplace Button */}
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Button
              onClick={handleBackToMarketplace}
              variant="outline"
              className="flex items-center gap-2 hover:bg-book-50 hover:border-book-300 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Marketplace
            </Button>
          </div>
        </div>

        {/* Header */}
        <div className="bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70 border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="rounded-xl border shadow-sm p-4 sm:p-6 bg-gradient-to-br from-book-50 to-white">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 items-start">
                {/* Avatar + Info */}
                <div className="flex items-start md:items-start gap-4 md:col-span-2 min-w-0 text-left">
                  <Avatar className="h-16 w-16 sm:h-20 sm:w-20 flex-shrink-0">
                    <AvatarImage src={seller.profile_picture_url} />
                    <AvatarFallback className="bg-book-100 text-book-700 text-lg">
                      {(seller.name || "?").charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 text-left">
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 break-words md:text-left">
                      {seller.name && seller.name.trim().length > 0 ? seller.name : "ReBooked"}
                    </h1>
                    <div className="text-sm sm:text-base font-semibold text-book-800 mt-0.5 md:text-left">ReBooked Mini</div>
                    <div className="mt-2 flex flex-col gap-1.5 text-sm text-gray-600 md:text-left">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 flex-shrink-0" />
                        <span className="break-words">Member since {memberSince}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 flex-shrink-0" />
                        <span className="break-words">{seller.province || "Province not set"}</span>
                      </div>
                    </div>
                    {seller.bio && (
                      <p className="text-gray-700 mt-2 max-w-none whitespace-pre-line break-words">
                        {seller.bio}
                      </p>
                    )}
                  </div>
                </div>

                {/* Stats + Actions */}
                <div className="flex flex-col sm:flex-row md:flex-col items-stretch sm:items-start md:items-start gap-3 md:gap-4">
                  <div className="flex sm:block justify-between text-left sm:text-left">
                    <div>
                      <div className="text-xs sm:text-sm text-gray-500">Books Available</div>
                      <div className="text-xl sm:text-2xl font-bold text-book-700">{books.length}</div>
                    </div>
                  </div>
                  <Button
                    onClick={handleShareProfile}
                    variant="outline"
                    className="justify-center sm:justify-start flex items-center gap-2 hover:bg-book-50 hover:border-book-300 transition-colors"
                  >
                    <Share2 className="h-4 w-4" />
                    <span className="hidden sm:inline">Share Profile</span>
                    <span className="sm:hidden">Share</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {books.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Books Available
                </h3>
                <p className="text-gray-600 mb-4">
                  {seller.name} doesn't have any books for sale at the moment.
                </p>
                <Button onClick={() => navigate("/books")} variant="outline">
                  Browse Other Books
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Books for Sale ({books.length})
                </h2>
                <p className="text-gray-600">
                  All books listed by {seller.name}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {books.map((book) => (
                  <Card
                    key={book.id}
                    className="hover:shadow-lg transition-shadow cursor-pointer group"
                    onClick={() => handleBookClick(book.id)}
                  >
                    <CardContent className="p-4">
                      <img
                        src={book.frontCover || book.imageUrl}
                        alt={book.title}
                        className="w-full h-48 object-cover rounded-lg mb-4 group-hover:scale-105 transition-transform duration-200"
                      />

                      <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                        {book.title}
                      </h3>

                      <p className="text-gray-600 text-sm mb-3">
                        by {book.author}
                      </p>

                      <div className="flex flex-wrap gap-2 mb-4">
                        <Badge variant="secondary" className="text-xs">
                          {book.condition} {book.itemType === "reader" && "reader"}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {book.category}
                        </Badge>
                        {book.grade && (
                          <Badge variant="outline" className="text-xs">
                            Grade {book.grade}
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-book-600">
                          R{book.price}
                        </span>
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToCart(book);
                          }}
                          className="bg-book-600 hover:bg-book-700"
                        >
                          Add to Cart
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default SellerProfile;
