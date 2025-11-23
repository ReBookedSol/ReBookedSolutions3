import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Search, BookOpen, Laptop, Sigma, Dna, FlaskConical, Telescope, TrendingUp } from "lucide-react";
import FeaturedBooks from "@/components/home/FeaturedBooks";
import HowItWorks from "@/components/home/HowItWorks";
import ReadyToGetStarted from "@/components/home/ReadyToGetStarted";

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Check if this is actually a verification link that ended up on the homepage
  useEffect(() => {
    const hasVerificationParams =
      searchParams.has("token") ||
      searchParams.has("token_hash") ||
      (searchParams.has("type") && searchParams.has("email"));

    if (hasVerificationParams) {
      console.log("🔄 Detected verification parameters on homepage, redirecting to /verify");
      // Preserve all search parameters and redirect to verify page
      navigate(`/verify?${searchParams.toString()}`, { replace: true });
      return;
    }
  }, [searchParams, navigate]);
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {

      navigate(`/books?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const categories = [
    { name: "Computer Science", icon: <Laptop className="h-7 w-7 sm:h-10 sm:w-10 text-book-700" /> },
    { name: "Mathematics", icon: <Sigma className="h-7 w-7 sm:h-10 sm:w-10 text-book-700" /> },
    { name: "Biology", icon: <Dna className="h-7 w-7 sm:h-10 sm:w-10 text-book-700" /> },
    { name: "Chemistry", icon: <FlaskConical className="h-7 w-7 sm:h-10 sm:w-10 text-book-700" /> },
    { name: "Physics", icon: <Telescope className="h-7 w-7 sm:h-10 sm:w-10 text-book-700" /> },
    { name: "Economics", icon: <TrendingUp className="h-7 w-7 sm:h-10 sm:w-10 text-book-700" /> },
  ];

  return (
    <Layout>
      <SEO
        title="ReBooked Solutions - Buy and Sell Used Textbooks"
        description="South Africa's trusted platform for buying and selling used textbooks. Find affordable academic books, sell your old textbooks, and connect with students across the country."
        keywords="textbooks, used books, academic books, sell books, buy books, student books, South Africa"
        url="https://www.rebookedsolutions.co.za/"
      />

      {/* Hero Section - image right on desktop, below text on mobile/tablet */}
      <section className="py-12 sm:py-16 bg-gradient-to-r from-book-100 to-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-8 lg:gap-12">
            {/* Copy */}
            <div className="order-1">
              <div className="inline-block rounded-full bg-book-200 text-book-800 text-xs sm:text-sm px-3 py-1 mb-4">
                Pre-Loved Pages, New Adventures
              </div>
              <h1 className="text-3xl sm:text-5xl font-bold text-gray-900 mb-4 leading-tight">
                Buy and Sell Textbooks with Ease
              </h1>
              <p className="text-base sm:text-lg text-gray-700 mb-6 sm:mb-8 max-w-xl">
                Buy affordable secondhand textbooks and give your old ones a new home—
                all handled securely through ReBooked Solutions.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <Button size="lg" className="bg-book-600 hover:bg-book-700" onClick={() => navigate("/books")}>
                  Browse Books
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-book-600 text-book-700 hover:bg-book-100"
                  onClick={() => navigate("/create-listing")}
                >
                  Sell Your Books
                </Button>
              </div>
            </div>

            {/* Image */}
            <div className="order-2">
              <img
                src="/lovable-uploads/bd1bff70-5398-480d-ab05-1a01e839c2d0.png"
                alt="Three students smiling with textbooks"
                className="w-full rounded-xl shadow-lg object-cover aspect-[4/3]"
                loading="eager"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Mobile-Optimized Search Section */}
      <section className="py-8 sm:py-12 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-6 sm:mb-8 text-book-800">
            Find Your Textbooks
          </h2>
          <form onSubmit={handleSearch} className="max-w-3xl mx-auto relative">
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-0">
              <input
                type="text"
                placeholder="Search by title, author, or subject..."
                className="w-full p-3 sm:p-4 sm:pr-16 rounded-lg sm:rounded-r-none border border-gray-300 focus:outline-none focus:ring-2 focus:ring-book-500 focus:border-transparent text-base sm:text-lg"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button
                type="submit"
                className="bg-book-600 text-white p-3 sm:p-2 rounded-lg sm:rounded-l-none sm:absolute sm:right-2 sm:top-2 hover:bg-book-700 transition duration-200 flex items-center justify-center"
              >
                <Search className="h-5 w-5 sm:h-6 sm:w-6 sm:mr-2" />
                <span className="sm:hidden">Search</span>
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Mobile-Optimized Categories Section */}
      <section className="py-8 sm:py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-6 sm:mb-8 text-book-800">
            Browse by Category
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {categories.map((category) => (
              <Link
                key={category.name}
                to={`/books?category=${encodeURIComponent(category.name)}`}
                className="bg-white rounded-lg shadow-md p-4 sm:p-6 text-center hover:shadow-lg transition-shadow duration-200"
              >
                <span className="mb-2 sm:mb-4 block flex items-center justify-center">
                  {category.icon}
                </span>
                <h3 className="font-semibold text-book-800 text-xs sm:text-base leading-tight">
                  {category.name}
                </h3>
              </Link>
            ))}
          </div>
        </div>
      </section>


      {/* Featured Books Section */}
      <FeaturedBooks />


      {/* ReBooked Campus Promotion Section */}
      <section className="py-8 sm:py-12 bg-gradient-to-r from-book-600 to-book-700">
        <div className="container mx-auto px-4">
          <div className="text-center text-white space-y-4 sm:space-y-6">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 bg-white/20 rounded-full">
                <BookOpen className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold">
                Introducing ReBooked Campus
              </h2>
            </div>

            <p className="text-lg sm:text-xl max-w-2xl mx-auto text-white/90">
              Your complete university guide! Calculate your APS score, explore
              degree programs, find bursaries, and buy textbooks from students
              at your campus.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 max-w-4xl mx-auto text-sm sm:text-base">
              <div className="bg-white/10 rounded-lg p-3 sm:p-4">
                <GraduationCap className="h-6 w-6 sm:h-7 sm:w-7 mb-2 text-white" />
                <div className="font-semibold">APS Calculator</div>
                <div className="text-white/80 text-xs sm:text-sm">Calculate your score</div>
              </div>
              <div className="bg-white/10 rounded-lg p-3 sm:p-4">
                <School className="h-6 w-6 sm:h-7 sm:w-7 mb-2 text-white" />
                <div className="font-semibold">26 universities</div>
                <div className="text-white/80 text-xs sm:text-sm">Explore programs</div>
              </div>
              <div className="bg-white/10 rounded-lg p-3 sm:p-4">
                <TrendingUp className="h-6 w-6 sm:h-7 sm:w-7 mb-2 text-white" />
                <div className="font-semibold">Find Bursaries</div>
                <div className="text-white/80 text-xs sm:text-sm">Get funding</div>
              </div>
              <div className="bg-white/10 rounded-lg p-3 sm:p-4">
                <BookOpen className="h-6 w-6 sm:h-7 sm:w-7 mb-2 text-white" />
                <div className="font-semibold">Campus Books</div>
                <div className="text-white/80 text-xs sm:text-sm">From your university</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
              <Button
                onClick={() => navigate("/university-info")}
                size="lg"
                className="bg-white text-book-600 hover:bg-gray-100 font-semibold"
              >
                Explore ReBooked Campus →
              </Button>
              <Link
                to="/university-info"
                className="text-white/90 hover:text-white text-sm underline"
              >
                Calculate your APS score now
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <HowItWorks />

      {/* Ready to Get Started Section */}
      <ReadyToGetStarted />
    </Layout>
  );
};

export default Index;
