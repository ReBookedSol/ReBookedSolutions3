import {
  useState,
  useEffect,
  useMemo,
  useCallback,
  lazy,
  Suspense,
  useRef,
} from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  University,
  GraduationCap,
  BookOpen,
  MapPin,
  Building,
  Users,
  Award,
  Calculator,
  DollarSign,
  TrendingUp,
  Calendar,
  Clock,
  CreditCard,
  Info,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Star,
  CheckCircle,
  Home,
  Lock,
  Bell,
} from "lucide-react";
import { ALL_SOUTH_AFRICAN_UNIVERSITIES as SOUTH_AFRICAN_UNIVERSITIES } from "@/constants/universities/index";
import {
  UNIVERSITY_APPLICATIONS_2025,
  getApplicationInfo,
} from "@/constants/universities/university-applications-2025";
import SEO from "@/components/SEO";
import CampusNavbar from "@/components/CampusNavbar";
import LoadingSpinner from "@/components/LoadingSpinner";
import GoogleAd from "@/components/ads/GoogleAd";
import { useAuth } from "@/contexts/AuthContext";
import { NotificationRequestService } from "@/services/notificationRequestService";
import { toast } from "sonner";
import { useThrottleCallback } from "@/hooks/useDebounceCallback";

// Direct import for APS calculator to fix loading issues
import APSCalculatorSection from "@/components/university-info/APSCalculatorSection";

// Keep lazy loading for other components
const EnhancedBursaryListing = lazy(
  () => import("@/components/university-info/EnhancedBursaryListing"),
);
const CampusBooksSection = lazy(
  () => import("@/components/university-info/CampusBooksSection"),
);
const PrivateInstitutionExplorer = lazy(
  () => import("@/components/private-institutions/PrivateInstitutionExplorer"),
);

// Preload components for better performance
const preloadBursarySection = () =>
  import("@/components/university-info/EnhancedBursaryListing");
const preloadBooksSection = () =>
  import("@/components/university-info/CampusBooksSection");

const UniversityInfo = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const currentTool = searchParams.get("tool") || "overview";
  const selectedUniversityId = searchParams.get("university");
  const [showAllUniversities, setShowAllUniversities] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notifyLoading, setNotifyLoading] = useState(false);
  const topAdRef = useRef<any>(null);

  // Early return for testing
  if (import.meta.env.DEV) {
    console.log("UniversityInfo component loading...");
    console.log(
      "SOUTH_AFRICAN_UNIVERSITIES length:",
      SOUTH_AFRICAN_UNIVERSITIES?.length,
    );
    console.log(
      "UNIVERSITY_APPLICATIONS_2025 length:",
      UNIVERSITY_APPLICATIONS_2025?.length,
    );
  }

  // Find selected university if one is specified
  const selectedUniversity = useMemo(() => {
    if (!selectedUniversityId) return null;

    try {
      if (
        !SOUTH_AFRICAN_UNIVERSITIES ||
        !Array.isArray(SOUTH_AFRICAN_UNIVERSITIES)
      ) {
        console.error(
          "SOUTH_AFRICAN_UNIVERSITIES is not an array:",
          typeof SOUTH_AFRICAN_UNIVERSITIES,
        );
        setError("University data is corrupted");
        return null;
      }
      return (
        SOUTH_AFRICAN_UNIVERSITIES.find(
          (uni) => uni.id === selectedUniversityId,
        ) || null
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("Error finding university:", {
        message: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
        selectedUniversityId
      });
      const safeMsg = errorMessage === '[object Object]' ? 'University data processing failed' : errorMessage;
      setError(`Error processing university data: ${safeMsg}`);
      return null;
    }
  }, [selectedUniversityId]);

  // Handle automatic redirect to APS calculator if coming from specific links
  useEffect(() => {
    if (window.location.hash === "#aps-calculator") {
      setSearchParams({ tool: "aps-calculator" });
    }
  }, [setSearchParams]);

  // Redirect to new university profile route if university parameter is present
  useEffect(() => {
    if (selectedUniversityId) {
      navigate(`/university/${selectedUniversityId}`, {
        replace: true,
      });
    }
  }, [selectedUniversityId, navigate]);

  const handleTabChange = useCallback(
    (value: string) => {
      requestAnimationFrame(() => {
        const newParams = new URLSearchParams();
        newParams.set("tool", value);
        setSearchParams(newParams, { replace: true });
      });
    },
    [setSearchParams],
  );

  // Throttled handlers for better performance
  const throttledTabChange = useThrottleCallback(handleTabChange, 100);

  // Refresh top ad when tab changes
  useEffect(() => {
    if (topAdRef.current?.refresh) {
      topAdRef.current.refresh();
    }
  }, [currentTool]);

  // Memoized statistics calculation for better performance
  const stats = useMemo(() => {
    try {
      // Ensure SOUTH_AFRICAN_UNIVERSITIES is defined and is an array
      if (
        !SOUTH_AFRICAN_UNIVERSITIES ||
        !Array.isArray(SOUTH_AFRICAN_UNIVERSITIES)
      ) {
        console.warn("SOUTH_AFRICAN_UNIVERSITIES is not properly defined");
        setError("University data failed to load");
        return {
          universities: 0,
          students: "0",
          programs: "0",
          resources: "Error loading data",
        };
      }

      let totalPrograms = 0;
      try {
        totalPrograms = SOUTH_AFRICAN_UNIVERSITIES.reduce((total, uni) => {
          // Safely handle undefined or null universities
          if (!uni) {
            return total;
          }

          // Safely handle undefined or null faculties
          if (!uni.faculties || !Array.isArray(uni.faculties)) {
            return total;
          }

          return (
            total +
            uni.faculties.reduce((facTotal, fac) => {
              // Safely handle undefined or null degrees
              if (!fac || !fac.degrees || !Array.isArray(fac.degrees)) {
                return facTotal;
              }
              return facTotal + fac.degrees.length;
            }, 0)
          );
        }, 0);
      } catch (programError) {
        const errorMessage = programError instanceof Error ? programError.message : String(programError);
        console.error("Error calculating programs:", {
          message: errorMessage,
          stack: programError instanceof Error ? programError.stack : undefined
        });
        totalPrograms = 0;
      }

      return {
        universities: 26, // Official count of South African public universities
        students: "1M+",
        programs: `${totalPrograms}+`,
        resources: "Growing Daily",
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("Error calculating university statistics:", {
        message: errorMessage,
        stack: error instanceof Error ? error.stack : undefined
      });
      return {
        universities: 0,
        students: "Error",
        programs: "Error",
        resources: "Error",
      };
    }
  }, []);

  // Handle notification request for accommodation
  const handleNotifyRequest = async () => {
    if (!isAuthenticated || !user) {
      toast.error("Please log in to get notified");
      navigate("/login");
      return;
    }

    setNotifyLoading(true);
    try {
      // Check if user already has a pending request
      const { exists, error: checkError } =
        await NotificationRequestService.hasExistingRequest(
          user.id,
          "accommodation",
          "general", // General accommodation notification
        );

      if (checkError) {
        throw new Error(checkError);
      }

      if (exists) {
        toast.info("You're already on the notification list!");
        return;
      }

      // Submit notification request
      const { success, error } =
        await NotificationRequestService.requestAccommodationNotification(
          user.id,
          user.email || "",
          "general",
          "General Accommodation Services",
        );

      if (!success) {
        throw new Error(error || "Failed to submit request");
      }

      toast.success(
        "You'll be notified when accommodation services are available!",
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("Error submitting notification request:", {
        message: errorMessage,
        stack: error instanceof Error ? error.stack : undefined
      });
      toast.error("Failed to submit notification request. Please try again.");
    } finally {
      setNotifyLoading(false);
    }
  };

  // Loading component for lazy-loaded sections
  const LoadingSection = () => (
    <div className="flex flex-col justify-center items-center py-12 space-y-4">
      <LoadingSpinner />
      <p className="text-sm text-gray-500 animate-pulse">Loading content...</p>
    </div>
  );

  // Modern Hero Component with subtle green theming
  const ModernHero = () => (
    <div className="relative overflow-hidden bg-gradient-to-br from-gray-50 via-white to-book-50">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div
          className={
            'absolute inset-0 bg-[url(\'data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%2344ab83" fill-opacity="0.3"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\')]'
          }
        />
      </div>

      <div className="relative container mx-auto px-4 py-16 lg:py-24">
        <div className="text-center space-y-8">
          {/* Main Heading */}
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 bg-book-100 text-book-800 px-4 py-2 rounded-full text-sm font-medium">
              <GraduationCap className="w-4 h-4" />
              Your Educational Journey Starts Here
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
              Find Your
              <span className="block text-book-600">Perfect University</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Explore all {stats.universities} South African public
              universities, calculate your APS score, discover {stats.programs}{" "}
              programs, and find the perfect path to your future.
            </p>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6 hover:shadow-md transition-shadow">
              <Building className="w-8 h-8 mx-auto mb-3 text-book-600" />
              <div className="text-2xl md:text-3xl font-bold text-gray-900">
                {stats.universities}
              </div>
              <div className="text-sm text-gray-600">Universities</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6 hover:shadow-md transition-shadow">
              <BookOpen className="w-8 h-8 mx-auto mb-3 text-book-600" />
              <div className="text-2xl md:text-3xl font-bold text-gray-900">
                {stats.programs}
              </div>
              <div className="text-sm text-gray-600">Programs</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6 hover:shadow-md transition-shadow">
              <Users className="w-8 h-8 mx-auto mb-3 text-book-600" />
              <div className="text-2xl md:text-3xl font-bold text-gray-900">
                {stats.students}
              </div>
              <div className="text-sm text-gray-600">Students</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6 hover:shadow-md transition-shadow">
              <Award className="w-8 h-8 mx-auto mb-3 text-book-600" />
              <div className="text-2xl md:text-3xl font-bold text-gray-900">
                40+
              </div>
              <div className="text-sm text-gray-600">Bursaries</div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-md mx-auto">
            <Button
              onClick={() => throttledTabChange("aps-calculator")}
              className="w-full sm:w-auto bg-book-600 hover:bg-book-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              <Calculator className="w-4 h-4 mr-2" />
              Calculate APS Score
            </Button>
            <Button
              onClick={() => throttledTabChange("bursaries")}
              variant="outline"
              className="w-full sm:w-auto border-book-300 text-book-700 hover:bg-book-50 px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              <DollarSign className="w-4 h-4 mr-2" />
              Find Bursaries
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  // University Application Card Component
  const UniversityApplicationCard = ({
    applicationInfo,
  }: {
    applicationInfo: any;
  }) => {
    const [showMore, setShowMore] = useState(false);
    const universityData = SOUTH_AFRICAN_UNIVERSITIES.find(
      (uni) => uni.id === applicationInfo.id,
    );

    return (
      <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer group border-0 shadow-md">
        <CardHeader className="pb-3 px-4 sm:px-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              {/* University Logo */}
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white border-2 border-book-200 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0">
                {universityData?.logo ? (
                  <img
                    src={universityData.logo}
                    alt={`${applicationInfo.name} logo`}
                    className="w-10 h-10 sm:w-12 sm:h-12 object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                      e.currentTarget.nextElementSibling.style.display =
                        "block";
                    }}
                  />
                ) : null}
                <div
                  className={`w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-book-500 to-book-600 rounded-lg flex items-center justify-center text-white font-bold text-xs sm:text-sm ${universityData?.logo ? "hidden" : "block"}`}
                >
                  {applicationInfo.abbreviation}
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <CardTitle className="text-base sm:text-lg group-hover:text-book-600 transition-colors line-clamp-2">
                  {applicationInfo.name}
                </CardTitle>
                <CardDescription className="flex items-center gap-1 mt-1 text-xs sm:text-sm">
                  <Building className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="truncate">{applicationInfo.type}</span>
                </CardDescription>
              </div>
            </div>
            {applicationInfo.isFree && (
              <Badge className="bg-book-100 text-book-800 border-book-200 font-semibold text-xs flex-shrink-0">
                No Fee
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6">
          {/* Opening Date */}
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-book-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-sm text-gray-900">Opens</p>
              <p className="text-sm text-gray-600">
                {applicationInfo.openingDate}
              </p>
            </div>
          </div>

          {/* Closing Date */}
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-sm text-gray-900">Closes</p>
              <p className="text-sm text-gray-600">
                {applicationInfo.closingDate}
              </p>
              {applicationInfo.closingDateNotes && (
                <p className="text-xs text-gray-500 mt-1 italic">
                  {applicationInfo.closingDateNotes}
                </p>
              )}
            </div>
          </div>

          {/* Application Fee */}
          <div className="flex items-start gap-3">
            <CreditCard className="w-5 h-5 text-book-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-sm text-gray-900">
                Application Fee
              </p>
              <p className="text-sm font-medium text-book-700">
                {applicationInfo.applicationFee}
              </p>
              {applicationInfo.feeNotes && (
                <p className="text-xs text-gray-500 mt-1">
                  {applicationInfo.feeNotes}
                </p>
              )}
            </div>
          </div>

          {/* Special Notes - Only show when expanded */}
          {showMore && applicationInfo.specialNotes && (
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-book-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-sm text-gray-900">
                  Special Notes
                </p>
                <p className="text-sm text-gray-600">
                  {applicationInfo.specialNotes}
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            {applicationInfo.specialNotes && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full sm:w-auto text-book-600 hover:bg-book-50 text-xs sm:text-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMore(!showMore);
                }}
              >
                {showMore ? (
                  <>
                    <ChevronUp className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                    <span className="truncate">View Less</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                    <span className="truncate">View More</span>
                  </>
                )}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="flex-1 hover:bg-book-50 hover:border-book-300 text-book-600 border-book-200 text-xs sm:text-sm min-h-[36px]"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/university/${applicationInfo.id}`);
              }}
            >
              <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 flex-shrink-0" />
              <span className="truncate">University Profile</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Universities Grid with Application Information
  const UniversitiesApplicationGrid = () => {
    if (
      !UNIVERSITY_APPLICATIONS_2025 ||
      !Array.isArray(UNIVERSITY_APPLICATIONS_2025)
    ) {
      setError("University applications data failed to load");
      return null;
    }

    const displayedUniversities = showAllUniversities
      ? UNIVERSITY_APPLICATIONS_2025
      : UNIVERSITY_APPLICATIONS_2025.slice(0, 6);

    return (
      <div className="py-12">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2">
              🇿🇦 South African Public Universities – 2025 Application Info
            </h2>
            <p className="text-gray-600">
              Complete application information for all 26 public universities
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
            {displayedUniversities.map((applicationInfo) => (
              <UniversityApplicationCard
                key={applicationInfo.id}
                applicationInfo={applicationInfo}
              />
            ))}
          </div>

          {/* View More / View Less Button */}
          {UNIVERSITY_APPLICATIONS_2025.length > 6 && (
            <div className="text-center px-4">
              <Button
                onClick={() => setShowAllUniversities(!showAllUniversities)}
                className="bg-book-600 hover:bg-book-700 text-white px-6 sm:px-8 py-3 text-base sm:text-lg w-full sm:w-auto max-w-sm mx-auto"
                size="lg"
              >
                {showAllUniversities ? (
                  <>
                    <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" />
                    <span className="truncate">View Less Universities</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" />
                    <span className="truncate">
                      <span className="hidden sm:inline">
                        View More Universities (
                      </span>
                      <span className="sm:hidden">View More (</span>
                      {UNIVERSITY_APPLICATIONS_2025.length - 6} more)
                    </span>
                  </>
                )}
              </Button>

              {!showAllUniversities && (
                <p className="text-sm text-gray-500 mt-3">
                  Showing 6 of {UNIVERSITY_APPLICATIONS_2025.length}{" "}
                  universities
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Error boundary for debugging
  if (error) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md text-center">
          <h2 className="text-xl font-bold text-red-800 mb-4">
            Error Loading Page
          </h2>
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Reload Page</Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO
        title="ReBooked Campus - Your Complete University Guide"
        description="Explore South African universities, calculate your APS, find bursaries, and discover textbooks. Your one-stop platform for higher education in South Africa."
        keywords="South African universities, APS calculator, university bursaries, student textbooks, higher education, NSFAS"
        url="https://www.rebookedsolutions.co.za/university-info"
      />

      <CampusNavbar />

      <div className="container mx-auto px-4 py-4">
        <GoogleAd ref={topAdRef} />
      </div>

      <div className="min-h-screen bg-gray-50">
        {/* Main Content with Tabs */}
        <div className="container mx-auto px-4 py-6">
          <Tabs
            value={currentTool}
            onValueChange={throttledTabChange}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 gap-1 mb-8 h-auto rounded-xl bg-gray-100 p-1 shadow-inner">
              <TabsTrigger
                value="overview"
                className="flex flex-col items-center gap-1 py-3 px-2 text-center rounded-lg border border-transparent data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow data-[state=active]:border-gray-200 transition-all duration-200 hover:bg-white/60"
              >
                <University className="h-3 w-3 sm:h-4 sm:w-4 transition-colors" />
                <span className="text-xs sm:text-sm font-medium">Overview</span>
              </TabsTrigger>
              <TabsTrigger
                value="aps-calculator"
                className="flex flex-col items-center gap-1 py-3 px-2 text-center rounded-lg border border-transparent data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow data-[state=active]:border-gray-200 transition-all duration-200 hover:bg-white/60"
              >
                <Calculator className="h-3 w-3 sm:h-4 sm:w-4 transition-colors" />
                <span className="text-xs sm:text-sm font-medium">APS</span>
              </TabsTrigger>
              <TabsTrigger
                value="bursaries"
                className="flex flex-col items-center gap-1 py-3 px-2 text-center rounded-lg border border-transparent data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow data-[state=active]:border-gray-200 transition-all duration-200 hover:bg-white/60"
                onMouseEnter={preloadBursarySection}
              >
                <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 transition-colors" />
                <span className="text-xs sm:text-sm font-medium">
                  Bursaries
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="books"
                className="flex flex-col items-center gap-1 py-3 px-2 text-center rounded-lg border border-transparent data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow data-[state=active]:border-gray-200 transition-all duration-200 hover:bg-white/60"
                onMouseEnter={preloadBooksSection}
              >
                <BookOpen className="h-3 w-3 sm:h-4 sm:w-4 transition-colors" />
                <span className="text-xs sm:text-sm font-medium">Books</span>
              </TabsTrigger>
              <TabsTrigger
                value="private-institutions"
                className="flex flex-col items-center gap-1 py-3 px-2 text-center rounded-lg border border-transparent data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow data-[state=active]:border-gray-200 transition-all duration-200 hover:bg-white/60"
              >
                <Building className="h-3 w-3 sm:h-4 sm:w-4 transition-colors" />
                <span className="text-xs sm:text-sm font-medium">
                  Private Institutions
                </span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Hero Section */}
              <ModernHero />

              {/* Universities with Application Information */}
              <UniversitiesApplicationGrid />

              {/* Quick Tools Section */}
              <div className="grid md:grid-cols-2 gap-6">
                <Card
                  className="hover:shadow-lg transition-shadow cursor-pointer border-0 shadow-sm hover:border-book-200"
                  onClick={() => throttledTabChange("aps-calculator")}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calculator className="h-5 w-5 text-book-600" />
                      APS Calculator
                    </CardTitle>
                    <CardDescription>
                      Calculate your Admission Point Score and find qualifying
                      programs
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Badge
                      variant="secondary"
                      className="bg-book-100 text-book-700 border-book-200"
                    >
                      Most Popular
                    </Badge>
                  </CardContent>
                </Card>

                <Card
                  className="hover:shadow-lg transition-shadow cursor-pointer border-0 shadow-sm hover:border-book-200"
                  onClick={() => throttledTabChange("bursaries")}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-book-600" />
                      Find Bursaries
                    </CardTitle>
                    <CardDescription>
                      Discover funding opportunities for your university studies
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Badge
                      variant="outline"
                      className="border-book-200 text-book-700 bg-book-50"
                    >
                      40+ Available
                    </Badge>
                  </CardContent>
                </Card>
              </div>

              {/* About Section */}
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5 text-gray-600" />
                    About ReBooked Campus
                  </CardTitle>
                </CardHeader>
                <CardContent className="prose max-w-none">
                  <p className="text-gray-600 leading-relaxed">
                    ReBooked Campus is your comprehensive guide to South African
                    higher education. We provide tools and resources to help you
                    make informed decisions about your university journey, from
                    calculating your APS score to finding the right bursaries
                    and degree programs.
                  </p>
                  <div className="grid md:grid-cols-3 gap-4 mt-6">
                    <div className="flex items-start gap-3">
                      <Users className="h-5 w-5 text-blue-600 mt-1" />
                      <div>
                        <h4 className="font-semibold">For Students</h4>
                        <p className="text-sm text-gray-600">
                          Tools and guidance for university planning
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Award className="h-5 w-5 text-green-600 mt-1" />
                      <div>
                        <h4 className="font-semibold">Trusted Information</h4>
                        <p className="text-sm text-gray-600">
                          Accurate, up-to-date university data
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Bell className="h-5 w-5 text-orange-600 mt-1" />
                      <div>
                        <h4 className="font-semibold">Latest News</h4>
                        <p className="text-sm text-gray-600">
                          Stay updated with{" "}
                          <a
                            href="https://news.rebookedsolutions.co.za"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-book-600 hover:text-book-800 underline font-medium"
                          >
                            ReBooked News
                          </a>
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="aps-calculator" className="space-y-6">
              <APSCalculatorSection />
            </TabsContent>

            <TabsContent value="bursaries" className="space-y-6">
              <Suspense fallback={<LoadingSection />}>
                <EnhancedBursaryListing />
              </Suspense>
            </TabsContent>

            <TabsContent value="books" className="space-y-6">
              <Suspense fallback={<LoadingSection />}>
                <CampusBooksSection />
              </Suspense>
            </TabsContent>

            <TabsContent value="private-institutions" className="space-y-6">
              <Suspense fallback={<LoadingSection />}>
                <PrivateInstitutionExplorer />
              </Suspense>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
};

export default UniversityInfo;
