import { useState, useMemo } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Search,
  ExternalLink,
  Calendar,
  DollarSign,
  Users,
  MapPin,
  Info,
  CheckCircle,
  AlertCircle,
  GraduationCap,
  BookOpen,
  Star,
  Heart,
  Target,
  TrendingUp,
  Award,
  Banknote,
  Filter,
} from "lucide-react";
import {
  BURSARIES,
  BURSARY_FIELDS_OF_STUDY,
} from "@/constants/enhancedBursaries";
import { PROVINCES } from "@/constants/bursaries";
import { BursaryFilters } from "@/types/university";

const EnhancedBursaryListing = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<BursaryFilters>({});
  const [expandedBursary, setExpandedBursary] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Filter university bursaries only
  const filteredBursaries = useMemo(() => {
    const universityBursaries = BURSARIES.filter(
      (b) =>
        !b.studyLevel?.includes("grade-11") &&
        !b.studyLevel?.includes("matric"),
    );

    return universityBursaries.filter((bursary) => {
      // Search filter
      const matchesSearch =
        !searchTerm ||
        bursary.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bursary.provider.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bursary.description.toLowerCase().includes(searchTerm.toLowerCase());

      // Field of study filter
      const matchesField =
        !filters.fieldOfStudy ||
        bursary.fieldsOfStudy.includes("All fields") ||
        bursary.fieldsOfStudy.includes(filters.fieldOfStudy);

      // Province filter
      const matchesProvince =
        !filters.province ||
        bursary.provinces.includes("All provinces") ||
        bursary.provinces.includes(filters.province);

      // Financial need filter
      const matchesFinancialNeed =
        filters.financialNeed === undefined ||
        bursary.requirements.financialNeed === filters.financialNeed;

      // Minimum marks filter
      const matchesMinMarks = (() => {
        if (!filters.minMarks) return true;

        if (bursary.requirements.minimumMarks !== undefined) {
          return bursary.requirements.minimumMarks <= filters.minMarks;
        }

        const academicTexts = [
          ...(bursary.requirements?.academicRequirement
            ? [bursary.requirements.academicRequirement]
            : []),
          ...bursary.eligibilityCriteria.filter(
            (criteria) =>
              criteria.toLowerCase().includes("%") ||
              criteria.toLowerCase().includes("average") ||
              criteria.toLowerCase().includes("minimum") ||
              criteria.toLowerCase().includes("academic"),
          ),
        ];

        for (const text of academicTexts) {
          const marksMatch = text.match(/(\d+)%/);
          if (marksMatch) {
            const extractedMarks = parseInt(marksMatch[1]);
            return extractedMarks <= filters.minMarks;
          }
        }

        return true;
      })();

      // Maximum household income filter
      const matchesHouseholdIncome = (() => {
        if (!filters.maxHouseholdIncome) return true;

        if (bursary.requirements.maxHouseholdIncome !== undefined) {
          return (
            bursary.requirements.maxHouseholdIncome >=
            filters.maxHouseholdIncome
          );
        }

        const incomeText = bursary.eligibilityCriteria.find(
          (criteria) =>
            criteria.toLowerCase().includes("income") ||
            criteria.toLowerCase().includes("household") ||
            criteria.toLowerCase().includes("r"),
        );

        if (incomeText) {
          const incomeMatch = incomeText.match(/R?[\s]*(\d[\d,\s]*)/);
          if (incomeMatch) {
            const extractedIncome = parseInt(
              incomeMatch[1].replace(/[,\s]/g, ""),
            );
            return extractedIncome >= filters.maxHouseholdIncome;
          }
        }

        return true;
      })();

      // Gender filter
      const matchesGender =
        !filters.genderSpecific ||
        filters.genderSpecific === "any" ||
        !bursary.requirements.genderSpecific ||
        bursary.requirements.genderSpecific === filters.genderSpecific;

      // Race filter
      const matchesRace =
        !filters.raceSpecific ||
        filters.raceSpecific === "any" ||
        !bursary.requirements.raceSpecific ||
        bursary.requirements.raceSpecific === filters.raceSpecific;

      // Special criteria filters
      const matchesDisabilitySupport =
        !filters.disabilitySupport ||
        bursary.requirements.disabilitySupport === true;

      const matchesRuralBackground =
        !filters.ruralBackground ||
        bursary.requirements.ruralBackground === true;

      const matchesFirstGeneration =
        !filters.firstGeneration ||
        bursary.requirements.firstGeneration === true;

      return (
        matchesSearch &&
        matchesField &&
        matchesProvince &&
        matchesFinancialNeed &&
        matchesMinMarks &&
        matchesHouseholdIncome &&
        matchesGender &&
        matchesRace &&
        matchesDisabilitySupport &&
        matchesRuralBackground &&
        matchesFirstGeneration
      );
    });
  }, [searchTerm, filters]);

  const updateFilter = (
    key: keyof BursaryFilters,
    value: string | boolean | undefined,
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setSearchTerm("");
    setFilters({});
  };

  const anyFiltersActive = useMemo(() => {
    const hasFilterValues = Object.values(filters).some((v) => v !== undefined && v !== "" && v !== "any");
    return !!searchTerm || hasFilterValues;
  }, [searchTerm, filters]);

  const getApplicationStatus = (deadline: string) => {
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const timeDiff = deadlineDate.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

    if (daysDiff < 0) {
      return { status: "closed", message: "Application closed", color: "red" };
    } else if (daysDiff <= 30) {
      return {
        status: "closing",
        message: `${daysDiff} days left`,
        color: "orange",
      };
    } else {
      return { status: "open", message: "Application open", color: "green" };
    }
  };

  // Helper function to get high school requirements for university bursaries
  const getHighSchoolRequirements = (bursary: {
    requirements?: {
      academicRequirement?: string;
      apsScore?: string;
      subjects?: string[];
    };
  }) => {
    const requirements = [];

    // Extract academic requirements
    if (bursary.requirements?.academicRequirement) {
      const marksMatch =
        bursary.requirements.academicRequirement.match(/(\d+)%/);
      if (marksMatch) {
        requirements.push({
          type: "academic",
          grade11: `Aim for ${Math.max(parseInt(marksMatch[1]) - 5, 60)}%+ average in Grade 11`,
          matric: `Minimum ${marksMatch[1]}% average in Matric`,
        });
      }
    }

    // Extract from eligibility criteria
    bursary.eligibilityCriteria.forEach((criteria: string) => {
      const marksMatch = criteria.match(/(\d+)%/);
      if (marksMatch && criteria.toLowerCase().includes("average")) {
        requirements.push({
          type: "academic",
          grade11: `Target ${Math.max(parseInt(marksMatch[1]) - 5, 60)}%+ in Grade 11`,
          matric: `Need ${marksMatch[1]}% Matric average`,
        });
      }

      if (
        criteria.toLowerCase().includes("nsc") ||
        criteria.toLowerCase().includes("matric")
      ) {
        requirements.push({
          type: "nsc",
          requirement: criteria,
        });
      }
    });

    return requirements;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 sm:p-8">
        <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-emerald-200/40 blur-3xl" aria-hidden="true" />
        <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-green-200/40 blur-3xl" aria-hidden="true" />
        <div className="relative text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium">Updated Weekly</div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            <span className="bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">University Bursaries</span>
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Discover verified funding opportunities for your studies. Filter by field, province, requirements, and more.
          </p>
        </div>
      </div>

      {/* Info */}
      <Card className="relative overflow-hidden border border-gray-200 bg-white rounded-2xl">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500" aria-hidden="true" />
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-base sm:text-lg text-gray-900 flex items-center justify-center gap-2">
            <BookOpen className="h-5 w-5 text-emerald-600" /> Tips & Updates
          </CardTitle>
          <CardDescription className="text-gray-600">
            Quick pointers to improve your chances. Get the latest on <a href="https://news.rebookedsolutions.co.za" target="_blank" rel="noopener noreferrer" className="text-emerald-700 hover:text-emerald-900 underline">ReBooked News</a>.
          </CardDescription>
          <ul className="text-sm text-gray-700 grid sm:grid-cols-3 gap-2 sm:gap-4 mt-1">
            <li className="px-3 py-2 rounded-lg bg-gray-50 border border-gray-200">Apply early and track deadlines</li>
            <li className="px-3 py-2 rounded-lg bg-gray-50 border border-gray-200">Prepare documents (ID, results, proof of income)</li>
            <li className="px-3 py-2 rounded-lg bg-gray-50 border border-gray-200">Tailor your motivation letter</li>
          </ul>
        </CardHeader>
      </Card>

      {/* Controls */}
      <Card className="border border-gray-200 rounded-2xl shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            {/* Search */}
            <div className="relative w-full sm:max-w-xl">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by name, provider, or field of study..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-11"
              />
            </div>
            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="border-gray-300"
                onClick={() => setShowFilters((v) => !v)}
              >
                <Filter className="h-4 w-4 mr-2" /> {showFilters ? "Hide Filters" : "Show Filters"}
              </Button>
              {!showFilters && anyFiltersActive && (
                <Badge variant="outline" className="text-xs">Filters active</Badge>
              )}
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="border-gray-300">
                    <Info className="h-4 w-4 mr-2" /> Help
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Understanding Bursaries & Requirements</DialogTitle>
                    <DialogDescription>Your guide to applications and preparation</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 text-sm">
                    <p>Bursaries help fund your studies and usually don't need to be repaid. Read requirements carefully and apply early.</p>
                    <div className="bg-emerald-50 p-3 rounded border border-emerald-200">
                      <h4 className="font-semibold text-emerald-800 mb-1">Quick Tips</h4>
                      <ul className="text-emerald-800 text-xs space-y-1">
                        <li>• Apply ahead of deadlines</li>
                        <li>• Prepare documents in advance</li>
                        <li>• Apply to multiple opportunities</li>
                      </ul>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>

        {showFilters && (
          <CardContent className="space-y-6 pt-4">
            {/* Primary Filters */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900">Primary Filters</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Field of Study</label>
                  <Select
                    value={filters.fieldOfStudy || "all"}
                    onValueChange={(value) => updateFilter("fieldOfStudy", value === "all" ? undefined : value)}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select field of study" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All fields</SelectItem>
                      {BURSARY_FIELDS_OF_STUDY.map((field) => (
                        <SelectItem key={field} value={field}>{field}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Province</label>
                  <Select
                    value={filters.province || "all"}
                    onValueChange={(value) => updateFilter("province", value === "all" ? undefined : value)}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select province" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All provinces</SelectItem>
                      {PROVINCES.map((province) => (
                        <SelectItem key={province} value={province}>{province}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Min. Academic Average (%)</label>
                  <Input
                    type="number"
                    placeholder="e.g. 65"
                    min="0"
                    max="100"
                    value={filters.minMarks || ""}
                    onChange={(e) => updateFilter("minMarks", e.target.value ? parseInt(e.target.value) : undefined)}
                    className="h-11"
                  />
                </div>
              </div>
            </div>

            {/* Financial & Demographics */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900">Financial & Demographics</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Max. Household Income (R)</label>
                  <Input
                    type="number"
                    placeholder="e.g. 350,000"
                    min="0"
                    value={filters.maxHouseholdIncome || ""}
                    onChange={(e) => updateFilter("maxHouseholdIncome", e.target.value ? parseInt(e.target.value) : undefined)}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Gender Requirements</label>
                  <Select
                    value={filters.genderSpecific || "any"}
                    onValueChange={(value) => updateFilter("genderSpecific", value === "any" ? undefined : value)}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Any gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any Gender</SelectItem>
                      <SelectItem value="female">Female Only</SelectItem>
                      <SelectItem value="male">Male Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Race Requirements</label>
                  <Select
                    value={filters.raceSpecific || "any"}
                    onValueChange={(value) => updateFilter("raceSpecific", value === "any" ? undefined : value)}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Any race" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any Race</SelectItem>
                      <SelectItem value="african">African</SelectItem>
                      <SelectItem value="coloured">Coloured</SelectItem>
                      <SelectItem value="indian">Indian</SelectItem>
                      <SelectItem value="white">White</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              <div className="text-sm text-muted-foreground">Use filters to narrow down {filteredBursaries.length} bursaries</div>
              <Button variant="outline" onClick={clearFilters} className="border-gray-300">Clear All Filters</Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between bg-muted/50 p-3 rounded-lg">
        <span className="text-sm text-muted-foreground">
          Found <strong>{filteredBursaries.length}</strong> university bursaries
        </span>
        {filteredBursaries.length > 0 && (
          <Badge variant="outline">
            {
              filteredBursaries.filter((b) => b.requirements?.financialNeed)
                .length
            }{" "}
            need-based
          </Badge>
        )}
      </div>

      {/* Modern Bursary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredBursaries.map((bursary) => {
          const applicationStatus = getApplicationStatus(bursary.applicationDeadline);
          const isExpanded = expandedBursary === bursary.id;
          return (
            <Card
              key={bursary.id}
              className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all hover:shadow-lg hover:border-green-200"
            >
              {/* Accent gradient bar */}
              <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500" />

              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <CardTitle className="text-lg font-semibold text-gray-900 break-words leading-snug">
                      {bursary.name}
                    </CardTitle>
                    <CardDescription className="mt-1 text-gray-600 truncate">
                      {bursary.provider}
                    </CardDescription>
                  </div>
                  <Badge
                    variant={
                      applicationStatus.status === 'open'
                        ? 'default'
                        : applicationStatus.status === 'closing'
                        ? 'destructive'
                        : 'secondary'
                    }
                    className="whitespace-nowrap"
                  >
                    {applicationStatus.message}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Amount */}
                <div className="inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-3 py-1.5 text-sm font-medium text-green-800">
                  <DollarSign className="h-4 w-4" /> {bursary.amount}
                </div>

                {/* Description */}
                <p className="text-sm text-gray-700 line-clamp-2">{bursary.description}</p>

                {/* Meta */}
                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
                  <div className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-2.5 py-1 border border-gray-200">
                    <Calendar className="h-3.5 w-3.5 text-gray-500" />
                    <span>{bursary.applicationDeadline}</span>
                  </div>
                  <div className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-2.5 py-1 border border-gray-200">
                    <MapPin className="h-3.5 w-3.5 text-gray-500" />
                    <span>
                      {bursary.provinces.includes('All provinces')
                        ? 'All provinces'
                        : bursary.provinces.slice(0, 2).join(', ')}
                      {bursary.provinces.length > 2 && !bursary.provinces.includes('All provinces') && ' +more'}
                    </span>
                  </div>
                </div>

                {/* Fields of study */}
                <div className="flex flex-wrap gap-1.5">
                  {bursary.fieldsOfStudy.slice(0, 3).map((field, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {field}
                    </Badge>
                  ))}
                  {bursary.fieldsOfStudy.length > 3 && (
                    <Badge variant="outline" className="text-xs">+{bursary.fieldsOfStudy.length - 3}</Badge>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-gray-200 hover:bg-gray-50"
                    onClick={() => setExpandedBursary(isExpanded ? null : bursary.id)}
                  >
                    {isExpanded ? 'Hide details' : 'View details'}
                  </Button>
                  {bursary.website && (
                    <a
                      href={bursary.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-green-700 hover:text-green-900 font-medium"
                    >
                      Apply <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="mt-3 space-y-3 border-t pt-3">
                    {/* Eligibility */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-1 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" /> Eligibility Criteria
                      </h4>
                      <ul className="space-y-1">
                        {bursary.eligibilityCriteria.slice(0, 6).map((c, idx) => (
                          <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                            <span className="text-green-600 mt-1">•</span>
                            <span>{c}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Application Process */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-1">Application Process</h4>
                      <p className="text-sm text-gray-700">{bursary.applicationProcess}</p>
                    </div>

                    {/* Contact */}
                    <div className="bg-muted/50 p-3 rounded-lg">
                      <h4 className="text-sm font-semibold text-gray-900 mb-1">Contact</h4>
                      <p className="text-sm text-gray-700">{bursary.contactInfo}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* No Results */}
      {filteredBursaries.length === 0 && (
        <div className="text-center py-12">
          <div className="text-muted-foreground mb-4">
            <Search className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No bursaries found
          </h3>
          <p className="text-muted-foreground mb-4">
            Try adjusting your search terms or filters to find more bursaries.
          </p>
          <Button variant="outline" onClick={clearFilters}>
            Clear All Filters
          </Button>
        </div>
      )}

      {/* Important Notice */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Important:</strong> Application deadlines and requirements may
          change. Always verify information directly with the bursary provider
          before applying. Start your applications early to avoid missing
          deadlines.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default EnhancedBursaryListing;
