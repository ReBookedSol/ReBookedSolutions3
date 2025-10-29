import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { School, GraduationCap } from "lucide-react";
import { UNIVERSITY_YEARS, SOUTH_AFRICAN_UNIVERSITIES_SIMPLE } from "@/constants/universities";
import { CREATE_LISTING_CATEGORIES } from "@/constants/createListingCategories";
import { BookFormData } from "@/types/book";

interface BookTypeSectionProps {
  bookType: "school" | "university";
  formData: BookFormData;
  errors: Record<string, string>;
  onBookTypeChange: (type: "school" | "university") => void;
  onSelectChange: (name: string, value: string) => void;
}

export const BookTypeSection = ({
  bookType,
  formData,
  errors,
  onBookTypeChange,
  onSelectChange,
}: BookTypeSectionProps) => {
  // Use shared category list across app
  // Imported from constants to keep Create Listing and Books filters in sync


  const categories = CREATE_LISTING_CATEGORIES.slice().sort((a, b) => a.localeCompare(b));

  const conditions = ["New", "Good", "Better", "Average", "Below Average"];

  const grades = [
    "N/A",
    "Grade 1",
    "Grade 2",
    "Grade 3",
    "Grade 4",
    "Grade 5",
    "Grade 6",
    "Grade 7",
    "Grade 8",
    "Grade 9",
    "Grade 10",
    "Grade 11",
    "Grade 12",
    "Study Guide",
    "Course Book",
  ];

  const universityBookTypes = [
    "Study Guide",
    "Course Book",
  ];

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-base font-medium">
          Book Type <span className="text-red-500">*</span>
        </Label>
        <div className="mt-2 inline-flex rounded-lg overflow-hidden border border-gray-200">
          <button
            type="button"
            onClick={() => onBookTypeChange("school")}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all ${
              bookType === "school"
                ? "bg-book-600 text-white shadow-inner"
                : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
            aria-pressed={bookType === "school"}
          >
            <School className="h-4 w-4" />
            School
          </button>
          <button
            type="button"
            onClick={() => onBookTypeChange("university")}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all border-l ${
              bookType === "university"
                ? "bg-book-600 text-white shadow-inner"
                : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
            aria-pressed={bookType === "university"}
          >
            <GraduationCap className="h-4 w-4" />
            University
          </button>
        </div>
      </div>

      <div>
        <Label htmlFor="category" className="text-base font-medium">
          Category <span className="text-red-500">*</span>
        </Label>
        <Select
          value={formData.category}
          onValueChange={(value) => onSelectChange("category", value)}
        >
          <SelectTrigger className={errors.category ? "border-red-500" : ""}>
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.category && (
          <p className="text-sm text-red-500 mt-1">{errors.category}</p>
        )}
      </div>

      <div>
        <Label htmlFor="curriculum" className="text-base font-medium">
          Curriculum <span className="text-gray-400">(Optional)</span>
        </Label>
        <Select
          value={(formData as any).curriculum || ""}
          onValueChange={(value) => onSelectChange("curriculum", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select curriculum (optional)" />
          </SelectTrigger>
          <SelectContent>
            {['CAPS', 'Cambridge', 'IEB'].map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="condition" className="text-base font-medium">
          Condition <span className="text-red-500">*</span>
        </Label>
        <Select
          value={formData.condition}
          onValueChange={(value) => onSelectChange("condition", value)}
        >
          <SelectTrigger className={errors.condition ? "border-red-500" : ""}>
            <SelectValue placeholder="Select condition" />
          </SelectTrigger>
          <SelectContent>
            {conditions.map((condition) => (
              <SelectItem key={condition} value={condition}>
                {condition}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.condition && (
          <p className="text-sm text-red-500 mt-1">{errors.condition}</p>
        )}
      </div>

      {bookType === "school" ? (
        <div>
          <Label htmlFor="grade" className="text-base font-medium">
            Grade <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formData.grade}
            onValueChange={(value) => onSelectChange("grade", value)}
          >
            <SelectTrigger className={errors.grade ? "border-red-500" : ""}>
              <SelectValue placeholder="Select a grade" />
            </SelectTrigger>
            <SelectContent>
              {grades.map((grade) => (
                <SelectItem key={grade} value={grade}>
                  {grade}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.grade && (
            <p className="text-sm text-red-500 mt-1">{errors.grade}</p>
          )}
        </div>
      ) : (
        <>
          {/* University Year Selection - Required */}
          <div>
            <Label htmlFor="universityYear" className="text-base font-medium">
              University Year <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.universityYear || ""}
              onValueChange={(value) => onSelectChange("universityYear", value)}
            >
              <SelectTrigger className={errors.universityYear ? "border-red-500" : ""}>
                <SelectValue placeholder="Select university year" />
              </SelectTrigger>
              <SelectContent>
                {UNIVERSITY_YEARS.map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.universityYear && (
              <p className="text-sm text-red-500 mt-1">{errors.universityYear}</p>
            )}
          </div>

          {/* University Selection - Optional */}
          <div>
            <Label htmlFor="university" className="text-base font-medium">
              University <span className="text-gray-400">(Optional)</span>
            </Label>
            <Select
              value={formData.university || ""}
              onValueChange={(value) => onSelectChange("university", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select university (optional)" />
              </SelectTrigger>
              <SelectContent>
                {SOUTH_AFRICAN_UNIVERSITIES_SIMPLE.map((university) => (
                  <SelectItem key={university.id} value={university.id}>
                    {university.abbreviation} - {university.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </>
      )}
    </div>
  );
};
