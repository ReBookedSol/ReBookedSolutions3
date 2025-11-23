import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import BookFilters from "@/components/book-listing/BookFilters";
import BookGrid from "@/components/book-listing/BookGrid";
import { getBooks } from "@/services/book/bookQueries";
import { Book } from "@/types/book";
import { toast } from "sonner";
import { useCommit } from "@/hooks/useCommit";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";


const BookListing = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(
    parseInt(searchParams.get("page") || "1", 10)
  );
  const [totalBooks, setTotalBooks] = useState(0);
  const booksPerPage = 12;
  const pageTopRef = useRef<HTMLDivElement>(null);

  // Commit functionality
  const { commitBook } = useCommit();
  const { user } = useAuth();

  // Filter states
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("search") || "",
  );
  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get("category") || "",
  );
  const [selectedCondition, setSelectedCondition] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("");
  const [selectedCurriculum, setSelectedCurriculum] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("");
  const [selectedUniversityYear, setSelectedUniversityYear] = useState("");
  const [selectedUniversity, setSelectedUniversity] = useState("");
  const [selectedProvince, setSelectedProvince] = useState(
    searchParams.get("province") || "",
  );
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [bookType, setBookType] = useState<"all" | "school" | "university" | "reader">(
    "all",
  );

  // Helper function to filter books based on book type requirements
  const filterBooksByType = (booksToFilter: Book[], type: "all" | "school" | "university" | "reader"): Book[] => {
    if (type === "all") {
      return booksToFilter;
    }

    return booksToFilter.filter((book) => {
      if (type === "school") {
        // School books: must have a grade OR be a study guide/course book
        const hasGrade = book.grade && book.grade.trim() !== "";
        const isSchoolTextType = book.universityBookType === "Study Guide" || book.universityBookType === "Course Book";
        return hasGrade || isSchoolTextType;
      }

      if (type === "university") {
        // University books: must have a university year
        return book.universityYear && book.universityYear.trim() !== "";
      }

      if (type === "reader") {
        // Reader books: must have a genre
        return book.genre && book.genre.trim() !== "";
      }

      return true;
    });
  };

  // Memoize loadBooks function to prevent infinite loops
  const loadBooks = useCallback(async () => {
    console.log("🔍 BookListing: Starting to load books...");
    setIsLoading(true);
    setError(null);

    try {
      const searchQuery = searchParams.get("search") || "";
      const category = searchParams.get("category") || "";
      const grade = searchParams.get("grade") || "";
      const genre = searchParams.get("genre") || "";
      const curriculum = searchParams.get("curriculum") || "";
      const universityYear = searchParams.get("universityYear") || "";
      const province = searchParams.get("province") || "";

      const filters: {
        search?: string;
        category?: string;
        condition?: string;
        grade?: string;
        genre?: string;
        curriculum?: 'CAPS' | 'Cambridge' | 'IEB';
        universityYear?: string;
        university?: string;
        province?: string;
        minPrice?: number;
        maxPrice?: number;
        itemType?: 'textbook' | 'reader' | 'all';
      } = {};

      if (searchQuery) filters.search = searchQuery;
      if (category) filters.category = category;
      if (selectedCondition) filters.condition = selectedCondition;
      if (grade) filters.grade = grade;
      if (genre || selectedGenre) filters.genre = genre || selectedGenre;
      if (curriculum || selectedCurriculum) filters.curriculum = (curriculum || selectedCurriculum) as any;
      if (universityYear) filters.universityYear = universityYear;
      if (selectedUniversity) filters.university = selectedUniversity;
      if (province || selectedProvince) filters.province = province || selectedProvince;

      if (priceRange[0] > 0) filters.minPrice = priceRange[0];
      if (priceRange[1] < 1000) filters.maxPrice = priceRange[1];

      console.log("📋 BookListing: Applying filters:", filters);

      const loadedBooks = await getBooks(filters);
      console.log("📚 BookListing: Received books from service:", loadedBooks?.length || 0);

      // Ensure we have an array
      let booksArray = Array.isArray(loadedBooks) ? loadedBooks : [];

      // Apply book type specific filtering
      if (bookType !== "all") {
        console.log(`🔍 BookListing: Filtering ${bookType} books (before: ${booksArray.length})`);
        booksArray = filterBooksByType(booksArray, bookType);
        console.log(`🔍 BookListing: Filtered ${bookType} books (after: ${booksArray.length})`);
      }

      setTotalBooks(booksArray.length);
      console.log("📊 BookListing: Total books set to:", booksArray.length);

      // Calculate pagination
      const startIndex = (currentPage - 1) * booksPerPage;
      const endIndex = startIndex + booksPerPage;
      const paginatedBooks = booksArray.slice(startIndex, endIndex);
      console.log("📄 BookListing: Paginated books for display:", paginatedBooks.length);

      setBooks(paginatedBooks);
      console.log("✅ BookListing: Books loaded successfully, displaying:", paginatedBooks.length, "books");

      if (booksArray.length === 0) {
        console.log("��️ BookListing: No books found with current filters");
      }
    } catch (error) {
      const errorDetails = {
        message: error instanceof Error ? error.message : String(error),
        name: error instanceof Error ? error.name : "Unknown",
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString(),
      };



      const userMessage =
        error instanceof Error && error.message.includes("Failed to fetch")
          ? "Unable to connect to the book database. Please check your internet connection and try again."
          : "Failed to load books. Please try again later.";

      toast.error(userMessage);
      setBooks([]);
      setError(error instanceof Error ? error.message : String(error));
      console.error("❌ BookListing: Error loading books:", errorDetails);
    } finally {
      setIsLoading(false);
      console.log("🏁 BookListing: Loading complete, isLoading set to false");
    }
  }, [searchParams, selectedCondition, selectedUniversity, selectedProvince, selectedCurriculum, selectedGenre, priceRange, currentPage, bookType]);

  // Initial load
  useEffect(() => {
    console.log("🎬 BookListing: Component mounted, starting initial book load...");
    loadBooks();
  }, [loadBooks]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters();
  };

  const updateFilters = useCallback(() => {
    const newSearchParams = new URLSearchParams();

    if (searchQuery.trim()) {
      newSearchParams.set("search", searchQuery.trim());
    }
    if (selectedCategory) {
      newSearchParams.set("category", selectedCategory);
    }
    if (selectedGrade) {
      newSearchParams.set("grade", selectedGrade);
    }
    if (selectedGenre) {
      newSearchParams.set("genre", selectedGenre);
    }
    if (selectedUniversityYear) {
      newSearchParams.set("universityYear", selectedUniversityYear);
    }
    if (selectedCurriculum) {
      newSearchParams.set("curriculum", selectedCurriculum);
    }
    if (selectedProvince) {
      newSearchParams.set("province", selectedProvince);
    }

    newSearchParams.set("page", "1"); // Reset to first page when filters change
    setCurrentPage(1);
    setSearchParams(newSearchParams);
  }, [
    searchQuery,
    selectedCategory,
    selectedGrade,
    selectedGenre,
    selectedUniversityYear,
    selectedCurriculum,
    selectedProvince,
    setSearchParams,
  ]);

  const clearFilters = useCallback(() => {
    setSearchQuery("");
    setSelectedCategory("");
    setSelectedCondition("");
    setSelectedGrade("");
    setSelectedGenre("");
    setSelectedUniversityYear("");
    setSelectedCurriculum("");
    setSelectedUniversity("");
    setSelectedProvince("");
    setPriceRange([0, 1000]);
    setBookType("all");
    setCurrentPage(1); // Reset to first page when clearing filters
    const newSearchParams = new URLSearchParams();
    newSearchParams.set("page", "1");
    setSearchParams(newSearchParams);
  }, [setSearchParams]);

  const handleCommitBook = async (bookId: string) => {
    try {
      await commitBook(bookId);
      // Reload books after commit
      loadBooks();
    } catch (error) {
      console.error(
        "Failed to commit book:",
        error instanceof Error ? error.message : String(error),
      );
      toast.error("Failed to commit sale. Please try again.");
    }
  };

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);

    // Update URL params with new page number
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set("page", page.toString());
    setSearchParams(newSearchParams);

    // Quick scroll to top without smooth behavior for better performance
    requestAnimationFrame(() => {
      if (pageTopRef.current) {
        pageTopRef.current.scrollIntoView({
          behavior: 'auto',
          block: 'start'
        });
      } else {
        window.scrollTo({
          top: 0,
          behavior: 'auto'
        });
      }
    });
  }, [searchParams, setSearchParams]);



  return (
    <Layout>
      <SEO
        title="Browse Textbooks - ReBooked Solutions"
        description="Find affordable used textbooks for your studies. Browse our collection of university and school books from verified sellers."
        keywords="textbooks, used books, university books, school books, study materials"
        url="https://www.rebookedsolutions.co.za/books"
      />

      <div ref={pageTopRef} className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-8 px-2 sm:px-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-book-800 mb-4 sm:mb-0">
            Browse Books
          </h1>
        </div>


        <div className="flex flex-col lg:flex-row gap-4 sm:gap-8">
          <BookFilters
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            selectedCondition={selectedCondition}
            setSelectedCondition={setSelectedCondition}
            selectedGrade={selectedGrade}
            setSelectedGrade={setSelectedGrade}
            selectedCurriculum={selectedCurriculum}
            setSelectedCurriculum={setSelectedCurriculum}
            selectedGenre={selectedGenre}
            setSelectedGenre={setSelectedGenre}
            selectedUniversityYear={selectedUniversityYear}
            setSelectedUniversityYear={setSelectedUniversityYear}
            selectedUniversity={selectedUniversity}
            setSelectedUniversity={setSelectedUniversity}
            selectedProvince={selectedProvince}
            setSelectedProvince={setSelectedProvince}
            priceRange={priceRange}
            setPriceRange={setPriceRange}
            bookType={bookType}
            setBookType={setBookType}
            showFilters={showFilters}
            setShowFilters={setShowFilters}
            onSearch={handleSearch}
            onUpdateFilters={updateFilters}
            onClearFilters={clearFilters}
          />

          <BookGrid
            books={books}
            isLoading={isLoading}
            onClearFilters={clearFilters}
            currentUserId={user?.id}
            onCommitBook={handleCommitBook}
            currentPage={currentPage}
            totalBooks={totalBooks}
            booksPerPage={booksPerPage}
            onPageChange={handlePageChange}
          />
        </div>
      </div>
    </Layout>
  );
};

export default BookListing;
