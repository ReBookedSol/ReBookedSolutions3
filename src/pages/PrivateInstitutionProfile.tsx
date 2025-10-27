import React, { useMemo, useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate, useSearchParams } from "react-router-dom";
import Layout from "@/components/Layout";
import GoogleAd from "@/components/ads/GoogleAd";
import { getPrivateInstitutionById } from "@/constants/private-institutions";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PrivateProgramDetailModal from "@/components/private-institutions/PrivateProgramDetailModal";
import type { Program } from "@/types/privateInstitution";
import {
  ArrowLeft,
  Award,
  Building2,
  Calendar,
  ExternalLink,
  Globe,
  GraduationCap,
  MapPin,
  TrendingUp,
  Eye,
  BookOpen,
} from "lucide-react";

const PrivateInstitutionProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("programs");

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab) setActiveTab(tab);
  }, [searchParams]);

  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value);
    const params = new URLSearchParams(searchParams);
    params.set("tab", value);
    setSearchParams(params, { replace: true });
    setTimeout(() => window.location.reload(), 0);
  }, [searchParams, setSearchParams]);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [isProgramDialogOpen, setIsProgramDialogOpen] = useState(false);
  const [expandedTypes, setExpandedTypes] = useState<Record<string, boolean>>({});

  const institution = useMemo(() => (id ? getPrivateInstitutionById(id) : null), [id]);

  if (!institution) {
    return (
      <Layout>
        <div className="container mx-auto px-6 py-10">
          <Card className="border-0 shadow-sm">
            <CardContent className="py-10 text-center space-y-4">
              <div className="inline-flex items-center gap-2 bg-gray-100 text-gray-800 px-3 py-1.5 rounded-full text-xs font-medium">
                <Building2 className="w-4 h-4" />
                Private Institution
              </div>
              <h1 className="text-2xl font-bold">Institution not found</h1>
              <p className="text-gray-600">The institution you’re looking for doesn’t exist or hasn’t been added yet.</p>
              <div className="flex justify-center">
                <a href="/university-info?tool=private-institutions">
                  <Button variant="outline" className="hover:bg-book-50 hover:border-book-300 text-book-600 border-book-200">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Private Institutions
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  const totalPrograms = institution.programs?.length || 0;
  const locations = institution.locations || [];
  const hasAccreditation = !!institution.accreditation?.length;
  const distinctModes = Array.from(
    new Set(
      (institution.programs || [])
        .flatMap((p) => (Array.isArray(p.mode) ? p.mode : p.mode ? [p.mode] : []))
        .map((m) => (m || "").toString())
    )
  );
  const nqfLevels = (institution.programs || [])
    .map((p) => (typeof p.nqfLevel === "number" ? p.nqfLevel : undefined))
    .filter((n): n is number => typeof n === "number");
  const nqfRange = nqfLevels.length ? `${Math.min(...nqfLevels)}–${Math.max(...nqfLevels)}` : "N/A";

  const programsByType = useMemo(() => {
    const map = new Map<string, Program[]>();
    (institution.programs || []).forEach((p) => {
      const key = p.type;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    });
    const order: string[] = [
      "short-course",
      "certificate",
      "advanced-certificate",
      "higher-certificate",
      "diploma",
      "advanced-diploma",
      "bachelor",
      "honours",
      "postgraduate-certificate",
      "postgraduate-diploma",
      "masters",
      "phd",
    ];
    const label = (t: string) => {
      switch (t) {
        case "short-course":
          return "Short Courses";
        case "certificate":
          return "Certificates";
        case "advanced-certificate":
          return "Advanced Certificates";
        case "higher-certificate":
          return "Higher Certificates";
        case "diploma":
          return "Diplomas";
        case "advanced-diploma":
          return "Advanced Diplomas";
        case "bachelor":
          return "Bachelor's Degrees";
        case "honours":
          return "Honours Degrees";
        case "postgraduate-certificate":
          return "Postgraduate Certificates";
        case "postgraduate-diploma":
          return "Postgraduate Diplomas";
        case "masters":
          return "Master's Degrees";
        case "phd":
          return "Doctoral Degrees (PhD)";
        default:
          return t;
      }
    };
    return order
      .filter((t) => map.has(t))
      .map((t) => ({ type: t, label: label(t), programs: map.get(t)! }));
  }, [institution.programs]);

  return (
    <Layout>
      <div className="bg-white min-h-screen">
        <div className="container mx-auto px-4 py-4">
          <GoogleAd />
        </div>
        {/* Header */}
        <div className="bg-gradient-to-b from-book-100 via-book-50 to-white border-b border-book-200">
          <div className="container mx-auto px-6 py-8">
            {/* Back */}
            <div className="mb-8">
              <button
                type="button"
                aria-label="Back to Overview"
                onClick={() => navigate("/university-info?tool=private-institutions")}
                className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors group"
              >
                <ArrowLeft className="h-5 w-5 transition-transform duration-200 group-hover:-translate-x-0.5" />
                <span className="text-sm font-medium">Back to Overview</span>
              </button>
            </div>

            {/* Header grid */}
            <div className="grid lg:grid-cols-4 gap-6 lg:gap-8">
              {/* Main info */}
              <div className="lg:col-span-3">
                <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6 mb-6 sm:mb-8">
                  <div className="relative mx-auto sm:mx-0 flex-shrink-0">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white border-4 border-book-200 rounded-2xl flex items-center justify-center shadow-lg overflow-hidden">
                      {institution.logo ? (
                        <img
                          src={institution.logo}
                          alt={`${institution.name} logo`}
                          className="w-12 h-12 sm:w-16 sm:h-16 object-contain"
                          onError={(e) => {
                            const img = e.currentTarget;
                            img.style.display = "none";
                            const fallback = img.nextElementSibling as HTMLElement;
                            if (fallback) fallback.style.display = "flex";
                          }}
                        />
                      ) : null}
                      <span className={`w-12 h-12 sm:w-16 sm:h-16 ${institution.logo ? "hidden" : "flex"} items-center justify-center text-lg sm:text-2xl font-bold bg-gradient-to-br from-book-500 to-book-600 text-white rounded-lg`}>
                        {(institution.abbreviation || institution.name.substring(0, 3)).toUpperCase()}
                      </span>
                    </div>
                    <div className="absolute -bottom-2 -right-2 w-5 h-5 sm:w-6 sm:h-6 bg-book-500 rounded-full flex items-center justify-center">
                      <Award className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-white" />
                    </div>
                  </div>

                  <div className="flex-1 space-y-3 sm:space-y-4 text-center sm:text-left">
                    <div>
                      <Badge variant="secondary" className="mb-3 bg-book-50 text-book-700 border-book-200">
                        Private Institution
                      </Badge>
                      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 sm:mb-3 leading-tight">
                        {institution.name}
                      </h1>
                      {locations.length > 0 && (
                        <div className="flex items-center justify-center sm:justify-start text-gray-600 mb-3 sm:mb-4">
                          <MapPin className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-gray-400" />
                          <span className="text-base sm:text-lg">{locations.join(" • ")}</span>
                        </div>
                      )}
                    </div>

                    {institution.description ? (
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base lg:text-lg max-w-3xl">
                        {institution.description}
                      </p>
                    ) : null}

                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                      <Link to={`/books?search=${encodeURIComponent(institution.abbreviation || institution.name)}`} className="w-full sm:w-auto">
                        <Button size="lg" className="w-full bg-book-600 hover:bg-book-700 text-white">
                          <BookOpen className="h-5 w-5 mr-2" />
                          Find Textbooks
                        </Button>
                      </Link>
                      {institution.contact?.website && (
                        <Button size="lg" variant="outline" className="border-2 hover:border-book-500 hover:text-book-600 w-full sm:w-auto" asChild>
                          <a href={institution.contact.website} target="_blank" rel="noopener noreferrer">
                            <Globe className="h-5 w-5 mr-2" />
                            Official Website
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="lg:col-span-1">
                <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-book-50 border-book-200">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg flex items-center text-gray-800">
                      <TrendingUp className="h-5 w-5 mr-2 text-book-500" />
                      Quick Stats
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-600 font-medium">Programs</span>
                      <div className="flex items-center">
                        <GraduationCap className="h-4 w-4 mr-1 text-book-500" />
                        <span className="font-bold text-gray-900">{totalPrograms}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-600 font-medium">Modes</span>
                      <div className="flex items-center">
                        <span className="font-bold text-gray-900">{distinctModes.length ? distinctModes.join(" • ") : "N/A"}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-600 font-medium">NQF Range</span>
                      <div className="flex items-center">
                        <span className="font-bold text-gray-900">{nqfRange}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-600 font-medium">Accredited</span>
                      <div className="flex items-center">
                        <span className={`font-bold ${hasAccreditation ? "text-green-700" : "text-gray-700"}`}>{hasAccreditation ? "Yes" : "Unknown"}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-6 py-8">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            {/* Tabs List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
              <div className="block md:hidden">
                <TabsList className="bg-transparent p-2 h-auto w-full flex flex-col space-y-2 rounded-xl">
                  <TabsTrigger value="programs" className="w-full rounded-lg py-3 px-4 data-[state=active]:bg-book-50 data-[state=active]:text-book-700 data-[state=active]:shadow-sm font-medium transition-all justify-start">
                    <GraduationCap className="h-5 w-5 mr-3" />
                    Programs
                  </TabsTrigger>
                  <TabsTrigger value="admissions" className="w-full rounded-lg py-3 px-4 data-[state=active]:bg-book-50 data-[state=active]:text-book-700 data-[state=active]:shadow-sm font-medium transition-all justify-start">
                    <Calendar className="h-5 w-5 mr-3" />
                    Admissions
                  </TabsTrigger>
                  <TabsTrigger value="resources" className="w-full rounded-lg py-3 px-4 data-[state=active]:bg-book-50 data-[state=active]:text-book-700 data-[state=active]:shadow-sm font-medium transition-all justify-start">
                    <Building2 className="h-5 w-5 mr-3" />
                    Resources
                  </TabsTrigger>
                </TabsList>
              </div>
              <div className="hidden md:block">
                <TabsList className="bg-transparent p-1 h-auto w-full grid grid-cols-3 rounded-xl">
                  <TabsTrigger value="programs" className="rounded-lg py-4 px-6 data-[state=active]:bg-book-50 data-[state=active]:text-book-700 data-[state=active]:shadow-sm font-medium transition-all">
                    <GraduationCap className="h-5 w-5 mr-2" /> Programs
                  </TabsTrigger>
                  <TabsTrigger value="admissions" className="rounded-lg py-4 px-6 data-[state=active]:bg-book-50 data-[state=active]:text-book-700 data-[state=active]:shadow-sm font-medium transition-all">
                    <Calendar className="h-5 w-5 mr-2" /> Admissions
                  </TabsTrigger>
                  <TabsTrigger value="resources" className="rounded-lg py-4 px-6 data-[state=active]:bg-book-50 data-[state=active]:text-book-700 data-[state=active]:shadow-sm font-medium transition-all">
                    <Building2 className="h-5 w-5 mr-2" /> Resources
                  </TabsTrigger>
                </TabsList>
              </div>
            </div>

            {/* Programs */}
            <TabsContent value="programs" className="mt-0">
              <div className="space-y-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Programs</h2>
                    <p className="text-gray-600">All programs offered by {institution.name}</p>
                  </div>
                </div>

                {totalPrograms > 0 ? (
                  <div className="space-y-8">
                    {programsByType.map(({ type, label, programs }) => (
                      <Card key={type} className="border-0 shadow-lg">
                        <CardHeader className="bg-gradient-to-r from-gray-50 to-white">
                          <CardTitle className="text-xl flex items-center justify-between text-gray-900">
                            <div className="flex items-center">
                              <GraduationCap className="h-6 w-6 mr-3 text-book-500" />
                              {label}
                            </div>
                          </CardTitle>
                          <p className="text-gray-600 mt-2">{programs.length} program{programs.length > 1 ? "s" : ""}</p>
                        </CardHeader>
                        <CardContent className="pt-6">
                          <div className="grid gap-4">
                            {(expandedTypes[type] ? programs : programs.slice(0, 3)).map((p) => (
                              <div key={p.id} className="group bg-white border rounded-xl p-5 hover:shadow-md transition-all duration-200 border-gray-200 hover:border-book-200">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <h5 className="font-semibold mb-1 text-gray-900 group-hover:text-book-700 transition-colors">
                                      {p.name}
                                    </h5>
                                    {p.description ? (
                                      <p className="text-sm leading-relaxed mb-3 text-gray-600 line-clamp-2">{p.description}</p>
                                    ) : null}
                                    <div className="flex flex-wrap gap-2">
                                      <Badge variant="secondary" className="bg-book-100 text-book-800 border-book-200 capitalize">
                                        {p.type.replace(/-/g, " ")}
                                      </Badge>
                                      {p.mode ? (
                                        <Badge variant="outline" className="border-book-200 text-book-700 bg-book-50 capitalize">
                                          {Array.isArray(p.mode) ? p.mode.join(" • ") : p.mode}
                                        </Badge>
                                      ) : null}
                                      {p.duration ? (
                                        <Badge variant="outline" className="border-gray-200 text-gray-700">
                                          {p.duration}
                                        </Badge>
                                      ) : null}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    {p.nqfLevel ? (
                                      <Badge className="bg-book-100 text-book-800 border-book-200">NQF {p.nqfLevel}</Badge>
                                    ) : typeof p.credits === "number" ? (
                                      <Badge className="bg-book-100 text-book-800 border-book-200">{p.credits} credits</Badge>
                                    ) : null}
                                    <Button size="sm" variant="outline" className="border-book-200 text-book-600 hover:bg-book-50" onClick={() => { setSelectedProgram(p); setIsProgramDialogOpen(true); }}>
                                      <Eye className="h-4 w-4 mr-1" />
                                      View More
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                          {programs.length > 3 && (
                            <div className="text-center py-4">
                              <Button
                                variant="outline"
                                className="border-book-200 text-book-600 hover:bg-book-50"
                                onClick={() => {
                                  setExpandedTypes((prev) => ({ ...prev, [type]: !prev[type] }));
                                  setTimeout(() => window.location.reload(), 0);
                                }}
                              >
                                <TrendingUp className={`h-4 w-4 mr-2 ${expandedTypes[type] ? "rotate-180" : ""}`} />
                                {expandedTypes[type] ? "Show Less" : `View ${programs.length - 3} more programs`}
                              </Button>
                            </div>
                          )}
                          <div className="pt-6">
                            <GoogleAd />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="border-0 shadow-lg">
                    <CardContent className="text-center py-16">
                      <GraduationCap className="h-20 w-20 mx-auto text-gray-300 mb-6" />
                      <h3 className="text-xl font-semibold text-gray-700 mb-3">No Programs Available</h3>
                      <p className="text-gray-500 max-w-md mx-auto">
                        Program information for this institution is not yet available. Please check back later.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* Admissions */}
            <TabsContent value="admissions" className="mt-0">
              <div className="space-y-8">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Admissions</h2>
                  <p className="text-gray-600">How to apply to {institution.name}</p>
                </div>

                <Card className="border-0 shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-book-50 to-white">
                    <CardTitle className="text-xl flex items-center text-gray-900">
                      <Calendar className="h-6 w-6 mr-3 text-book-500" />
                      Application & Contact
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {institution.contact ? (
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          {institution.contact.website && (
                            <div className="flex items-center">
                              <span className="font-medium w-24">Website:</span>
                              <a href={institution.contact.website} target="_blank" rel="noopener noreferrer" className="text-book-600 hover:text-book-700 underline">
                                {institution.contact.website}
                              </a>
                            </div>
                          )}
                          {institution.contact.email && (
                            <div className="flex items-center">
                              <span className="font-medium w-24">Email:</span>
                              <span className="text-gray-700">{institution.contact.email}</span>
                            </div>
                          )}
                          {institution.contact.phone && (
                            <div className="flex items-center">
                              <span className="font-medium w-24">Phone:</span>
                              <span className="text-gray-700">{institution.contact.phone}</span>
                            </div>
                          )}
                          {institution.contact.address && (
                            <div className="flex items-center">
                              <span className="font-medium w-24">Address:</span>
                              <span className="text-gray-700">{institution.contact.address}</span>
                            </div>
                          )}
                        </div>
                        <div className="space-y-3">
                          <p className="text-gray-600">
                            Visit the official website for application dates, closing deadlines, and steps to submit your application online.
                          </p>
                          {institution.contact.website && (
                            <Button variant="outline" className="border-book-200 text-book-600 hover:bg-book-50" asChild>
                              <a href={institution.contact.website} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-5 w-5 mr-2" /> Visit Website
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="p-6 bg-gray-50 rounded-lg text-center">
                        <p className="text-gray-600">Admissions details will be provided soon. Please check the institution website for updates.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Resources */}
            <TabsContent value="resources" className="mt-0">
              <div className="space-y-8">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Resources</h2>
                  <p className="text-gray-600">Useful links and information for {institution.name}</p>
                </div>

                <Card className="border-0 shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-book-50 to-white">
                    <CardTitle className="text-xl flex items-center text-gray-900">
                      <Globe className="h-6 w-6 mr-3 text-book-500" />
                      Online Resources
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      {institution.contact?.website ? (
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="text-gray-700 truncate">{institution.contact.website}</div>
                          <Button variant="outline" className="border-book-200 text-book-600 hover:bg-book-50" asChild>
                            <a href={institution.contact.website} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4 mr-2" /> Open
                            </a>
                          </Button>
                        </div>
                      ) : (
                        <div className="p-6 bg-gray-50 rounded-lg text-center text-gray-600">No resources available yet.</div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <PrivateProgramDetailModal
        program={selectedProgram}
        institution={institution}
        isOpen={isProgramDialogOpen}
        onClose={() => setIsProgramDialogOpen(false)}
      />
    </Layout>
  );
};

export default PrivateInstitutionProfile;
