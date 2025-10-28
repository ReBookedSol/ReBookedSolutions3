import { useMemo, useState } from "react";
import { PRIVATE_INSTITUTIONS } from "@/constants/private-institutions";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building, Search, ExternalLink, Globe, CheckCircle, GraduationCap, School, Landmark, ArrowRight, Shield } from "lucide-react";
import { Link } from "react-router-dom";

const PrivateInstitutionExplorer = () => {
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState("");
  const [showAll, setShowAll] = useState(false);

  const LEVEL_OPTIONS = [
    "Bachelor",
    "Honours",
    "Master's",
    "PhD",
    "Diploma",
    "Higher Certificate",
    "Certificate",
    "Postgraduate Diploma",
  ];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const lev = level.trim().toLowerCase();
    return PRIVATE_INSTITUTIONS.filter((inst) => {
      const inName = q ? inst.name.toLowerCase().includes(q) : true;
      const inAbbr = q ? (inst.abbreviation?.toLowerCase().includes(q) ?? false) : true;
      const inProgName = q ? (inst.programs?.some((p) => p.name.toLowerCase().includes(q)) ?? false) : true;
      const matchesQuery = inName || inAbbr || inProgName;

      const matchesLevel = lev
        ? (inst.programs?.some((p) => {
            const t = `${p.qualification || p.type || ""}`.toLowerCase();
            return (
              t.includes(lev) ||
              (lev === "master's" && (t.includes("masters") || t.includes("master")))
            );
          }) ?? false)
        : true;

      return matchesQuery && matchesLevel;
    });
  }, [query, level]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 bg-book-100 text-book-800 px-4 py-2 rounded-full text-sm font-medium">
          <Building className="w-4 h-4" />
          Accredited Private Institutions
        </div>
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Private Institutions</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Explore accredited private institutions across South Africa. Each profile mirrors our university pages and lists all available programs.
        </p>
      </div>

      {/* Search */}
      <div className="max-w-3xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm flex-1">
            <Search className="w-5 h-5 text-gray-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search institutions or programs"
              className="flex-1 bg-transparent outline-none text-sm"
              aria-label="Search institutions or programs"
            />
          </div>
          <div className="w-full sm:w-64">
            <Select value={level} onValueChange={(v) => setLevel(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by level" />
              </SelectTrigger>
              <SelectContent>
                {LEVEL_OPTIONS.map((opt) => (
                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Grid */}
      {filtered.length > 0 ? (
        <>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {(showAll ? filtered : filtered.slice(0, 6)).map((inst) => (
            <Card key={inst.id} className="hover:shadow-lg transition-all duration-300 border-0 shadow-sm hover:border-book-200">
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-12 h-12 bg-white border-2 border-book-200 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0">
                    {inst.logo ? (
                      <img src={inst.logo} alt={`${inst.name} logo`} className="w-10 h-10 object-contain" />
                    ) : (
                      <div className="w-10 h-10 bg-gradient-to-br from-book-500 to-book-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                        {(inst.abbreviation || inst.name.substring(0, 3)).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <CardTitle className="text-lg line-clamp-2">{inst.name}</CardTitle>
                    {inst.locations?.length ? (
                      <CardDescription className="mt-1 line-clamp-1">
                        {inst.locations.join(" • ")}
                      </CardDescription>
                    ) : inst.contact?.website ? (
                      <CardDescription className="mt-1 line-clamp-1">
                        {inst.contact.website.replace(/^https?:\/\//, "")}
                      </CardDescription>
                    ) : null}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="bg-book-100 text-book-800 border-book-200">
                    {inst.programs?.length || 0} programs
                  </Badge>
                  {inst.accreditation?.length ? (
                    <Badge variant="outline" className="border-book-200 text-book-700 bg-book-50">
                      Accredited
                    </Badge>
                  ) : null}
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Link to={`/private-institution/${inst.id}`} className="sm:flex-1">
                    <Button variant="outline" className="w-full hover:bg-book-50 hover:border-book-300 text-book-600 border-book-200" asChild>
                      <span>
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View Profile
                      </span>
                    </Button>
                  </Link>
                  {inst.contact?.website && (
                    <a href={inst.contact.website} target="_blank" rel="noopener noreferrer" className="sm:flex-1">
                      <Button variant="outline" className="w-full border-book-200 text-book-600 hover:bg-book-50">
                        <Globe className="w-4 h-4 mr-2" />
                        Official Website
                      </Button>
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        {!showAll && filtered.length > 6 && (
          <div className="flex justify-center">
            <Button onClick={() => setShowAll(true)} variant="outline" className="mt-2">
              View More
            </Button>
          </div>
        )}
        </>
      ) : (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-10 text-center space-y-3">
            <div className="inline-flex items-center gap-2 bg-gray-100 text-gray-800 px-3 py-1.5 rounded-full text-xs font-medium">
              <Search className="w-4 h-4" />
              No results
            </div>
            <h3 className="text-xl font-semibold">No private institutions available yet</h3>
            <p className="text-gray-600 max-w-md mx-auto">
              We’re adding accredited private institutions. Check back soon or follow us for updates.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Educational Info Section */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2"><GraduationCap className="w-5 h-5 text-book-600" /> Study Paths: Private vs University</CardTitle>
          <CardDescription>Accreditation, outcomes, and how to transfer credits.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 text-gray-700">
          {/* Side-by-side comparison */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg border bg-white">
              <h4 className="font-semibold mb-2 flex items-center gap-2"><School className="w-4 h-4 text-book-700" /> Private Institutions</h4>
              <ul className="space-y-1 text-sm">
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-600 mt-0.5" /> Smaller classes and career‑focused programmes</li>
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-600 mt-0.5" /> Strong industry links and work‑integrated learning (WIL)</li>
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-600 mt-0.5" /> Must be CHE accredited and SAQA registered (NQF level/credits)</li>
              </ul>
            </div>
            <div className="p-4 rounded-lg border bg-white">
              <h4 className="font-semibold mb-2 flex items-center gap-2"><GraduationCap className="w-4 h-4 text-gray-800" /> Public Universities</h4>
              <ul className="space-y-1 text-sm">
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-600 mt-0.5" /> Research‑driven with broad academic depth</li>
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-600 mt-0.5" /> Wide range of postgraduate pathways</li>
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-600 mt-0.5" /> Recognised nationally when programmes meet SAQA/NQF standards</li>
              </ul>
            </div>
          </div>

          {/* Key guidance */}
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-book-50 border border-book-200">
              <h4 className="font-semibold text-book-900 mb-1 flex items-center gap-2"><Shield className="w-4 h-4 text-book-800" /> Accreditation checklist</h4>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>CHE‑accredited provider and programme</li>
                <li>SAQA registration with NQF level and credits</li>
                <li>DHET registration for private providers</li>
              </ul>
              <div className="text-xs mt-2">
                Verify on: <a href="https://www.che.ac.za/" className="text-book-600 hover:underline" target="_blank" rel="noreferrer">CHE</a> • <a href="https://www.saqa.org.za/" className="text-book-600 hover:underline" target="_blank" rel="noreferrer">SAQA</a>
              </div>
            </div>
            <div className="p-4 rounded-lg bg-green-50 border border-green-200">
              <h4 className="font-semibold text-green-900 mb-1">Employment tips</h4>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>Prioritise programmes with WIL/internships and portfolio projects</li>
                <li>Include accreditation codes (CHE/SAQA/NQF) on your CV</li>
              </ul>
            </div>
            <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-1">Costs & support</h4>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>Fees vary by institution; compare total cost (tuition + materials)</li>
                <li>Ask about bursaries, scholarships, and payment plans</li>
              </ul>
            </div>
          </div>

          {/* Transfer pathway */}
          <div className="p-4 rounded-lg bg-gray-50 border">
            <h4 className="font-semibold mb-2">Transfer pathway (credits)</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Request official transcript and module outlines</li>
              <li>Confirm NQF level, credits and SAQA registration</li>
              <li>Apply for RPL/credit transfer at the receiving university</li>
              <li>Complete bridging modules if required</li>
            </ol>
            <p className="text-xs mt-2 text-gray-600">Note: Final decisions rest with the receiving institution.</p>
          </div>

          {/* FAQs */}
          <Accordion type="single" collapsible className="border rounded-lg">
            <AccordionItem value="faq-1">
              <AccordionTrigger className="px-4">Are private qualifications recognised?</AccordionTrigger>
              <AccordionContent className="px-4 pb-4 text-sm">Yes — if CHE‑accredited and SAQA‑registered. Always verify provider and programme codes before enrolling.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="faq-2">
              <AccordionTrigger className="px-4">Which path is better for me?</AccordionTrigger>
              <AccordionContent className="px-4 pb-4 text-sm">Choose based on your goals: research/academia vs. career‑oriented learning with smaller classes and work‑integrated learning (WIL).</AccordionContent>
            </AccordionItem>
            <AccordionItem value="faq-3">
              <AccordionTrigger className="px-4">How do I verify accreditation?</AccordionTrigger>
              <AccordionContent className="px-4 pb-4 text-sm">Check the CHE (provider/programme accreditation), SAQA (qualification registration with NQF level/credits), and DHET (private provider registration) sites.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="faq-4">
              <AccordionTrigger className="px-4">Are online or hybrid programmes recognised?</AccordionTrigger>
              <AccordionContent className="px-4 pb-4 text-sm">Yes — delivery mode can be contact, distance, or hybrid. Recognition depends on accreditation and registration status, not just study mode.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="faq-5">
              <AccordionTrigger className="px-4">Can I transfer to a public university later?</AccordionTrigger>
              <AccordionContent className="px-4 pb-4 text-sm">Possibly. Request credit transfer/RPL with transcripts and module outlines. Final decisions rest with the receiving university.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="faq-6">
              <AccordionTrigger className="px-4">Do employers recognise private qualifications?</AccordionTrigger>
              <AccordionContent className="px-4 pb-4 text-sm">Employers recognise accredited, SAQA‑registered qualifications. Look for strong industry links, WIL, and graduate outcomes.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="faq-7">
              <AccordionTrigger className="px-4">What funding options are available?</AccordionTrigger>
              <AccordionContent className="px-4 pb-4 text-sm">Institutions may offer bursaries or payment plans; some employers sponsor studies. Explore our bursary tools for additional opportunities.</AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* ReBooked News promo */}
          <div className="mt-4 p-4 rounded-lg bg-white border flex items-start gap-3">
            <div className="text-sm text-gray-700">
              Stay updated on private education, careers, and student tips via
              {" "}
              <a href="https://news.rebookedsolutions.co.za" target="_blank" rel="noopener noreferrer" className="text-book-600 hover:text-book-800 underline font-medium">ReBooked News</a>.
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="bg-book-100 text-book-800 border-book-200">CHE</Badge>
            <Badge variant="secondary" className="bg-book-100 text-book-800 border-book-200">SAQA</Badge>
            <Badge variant="secondary" className="bg-book-100 text-book-800 border-book-200">NQF</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PrivateInstitutionExplorer;
