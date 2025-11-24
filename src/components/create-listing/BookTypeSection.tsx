import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { School, GraduationCap, BookOpen } from "lucide-react";
import { UNIVERSITY_YEARS, SOUTH_AFRICAN_UNIVERSITIES_SIMPLE } from "@/constants/universities";
import { getCategoriesByBookType } from "@/constants/bookTypeCategories";
import { ALL_READER_GENRES, GENRE_CATEGORIES } from "@/constants/readerGenres";
import { BookFormData } from "@/types/book";

interface BookTypeSectionProps {
  bookType: "school" | "university" | "reader";
  formData: BookFormData;
  errors: Record<string, string>;
  onBookTypeChange: (type: "school" | "university" | "reader") => void;
  onSelectChange: (name: string, value: string) => void;
}

export const BookTypeSection = ({
  bookType,
  formData,
  errors,
  onBookTypeChange,
  onSelectChange,
}: BookTypeSectionProps) => {
  // Get categories based on selected book type
  const categories = getCategoriesByBookType(bookType);

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
          <button
            type="button"
            onClick={() => onBookTypeChange("reader")}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all border-l ${
              bookType === "reader"
                ? "bg-book-600 text-white shadow-inner"
                : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
            aria-pressed={bookType === "reader"}
          >
            <BookOpen className="h-4 w-4" />
            Reader
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
      ) : bookType === "university" ? (
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
      ) : bookType === "reader" ? (
        <div>
          <Label htmlFor="genre" className="text-base font-medium">
            Genre <span className="text-red-500">*</span>
          </Label>
          <Select
            value={(formData as any).genre || ""}
            onValueChange={(value) => onSelectChange("genre", value)}
          >
            <SelectTrigger className={errors.genre ? "border-red-500" : ""}>
              <SelectValue placeholder="Select a genre" />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              <div className="space-y-1 p-1">
                {Object.entries(GENRE_CATEGORIES).map(([category, genres]) => (
                  <div key={category}>
                    <div className="px-2 py-1.5 text-sm font-semibold text-gray-700 sticky top-0 bg-white">
                      {category}
                    </div>
                    {genres.map((genre) => (
                      <SelectItem key={genre} value={genre} className="ml-2">
                        {genre}
                      </SelectItem>
                    ))}
                  </div>
                ))}
              </div>
            </SelectContent>
          </Select>
          {errors.genre && (
            <p className="text-sm text-red-500 mt-1">{errors.genre}</p>
          )}
        </div>
      ) : null}
    </div>
  );
};
