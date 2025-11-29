import { useState, useEffect, useMemo, useCallback } from "react";
import { APSSubject } from "@/types/university";
import {
  APSFilterOptions,
  CoursesForUniversityResult,
  getCoursesForUniversityWithAPS,
  getUniversityFacultiesWithAPS,
  APSAwareCourseSearchService,
} from "@/services/apsAwareCourseAssignmentService";
import { calculateAPS, validateAPSSubjects } from "@/utils/apsCalculation";

/**
 * Enhanced hook for APS-aware course assignment with user state management
 * Uses localStorage for persistent storage - data persists across browser sessions
 * Users can manually clear their APS profile when needed
 */

export interface UserAPSProfile {
  subjects: APSSubject[];
  totalAPS: number;
  lastUpdated: string;
  isValid?: boolean;
  validationErrors?: string[];
  universitySpecificScores?: import("@/types/university").UniversityAPSResult[];
}

export interface APSAwareState {
  userProfile: UserAPSProfile | null;
  isLoading: boolean;
  error: string | null;
  lastSearchResults: CoursesForUniversityResult | null;
}

// Enhanced localStorage hook with persistence protection
function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);

      if (item) {
        const parsed = JSON.parse(item);
        return parsed;
      } else {
        return initialValue;
      }
    } catch (error) {
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        const valueToStore =
          value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);

        if (valueToStore === null || valueToStore === undefined) {
          localStorage.removeItem(key);
        } else {
          localStorage.setItem(key, JSON.stringify(valueToStore));

          // Verify save
          const verification = localStorage.getItem(key);
        }
      } catch (error) {
        // localStorage error
      }
    },
    [key, storedValue],
  );

  return [storedValue, setValue] as const;
}

export function useAPSAwareCourseAssignment(universityId?: string) {
  // Persistent user APS profile (localStorage)
  const [userProfile, setUserProfile] = useLocalStorage<UserAPSProfile | null>(
    "userAPSProfile",
    null,
  );

  // Load profile from localStorage on mount - Enhanced with debugging
  const loadProfile = useCallback(() => {
    try {
      const stored = localStorage.getItem("userAPSProfile");

      if (stored) {
        const profile = JSON.parse(stored);
        setUserProfile(profile);
        return profile;
      } else {
        setUserProfile(null);
        return null;
      }
    } catch (error) {
      setUserProfile(null);
      return null;
    }
  }, [setUserProfile]);

  // Load profile on component mount
  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Component state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSearchResults, setLastSearchResults] =
    useState<CoursesForUniversityResult | null>(null);

  // Listen for cross-tab storage changes and APS profile cleared events
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "userAPSProfile" && e.newValue !== e.oldValue) {
        try {
          const newProfile = e.newValue ? JSON.parse(e.newValue) : null;
          setUserProfile(newProfile);
        } catch (error) {
          // Error parsing APS profile from storage
        }
      }
    };

    const handleAPSCleared = () => {
      setUserProfile(null);
      setLastSearchResults(null);
      setError(null);
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("apsProfileCleared", handleAPSCleared);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("apsProfileCleared", handleAPSCleared);
    };
  }, [setUserProfile]);

  // Save profile to localStorage - Enhanced with verification
  const saveProfile = useCallback(async (profile: UserAPSProfile) => {
    try {
      // Add timestamp to ensure we track when it was saved
      const profileWithTimestamp = {
        ...profile,
        lastUpdated: new Date().toISOString(),
        savedAt: Date.now(),
      };

      localStorage.setItem(
        "userAPSProfile",
        JSON.stringify(profileWithTimestamp),
      );
      setUserProfile(profileWithTimestamp);

      // Verify it was actually saved
      const verification = localStorage.getItem("userAPSProfile");

      if (verification) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      return false;
    }
  }, [setUserProfile]);

  /**
   * Update user's APS subjects and recalculate profile
   */
  const updateUserSubjects = useCallback(
    async (subjects: APSSubject[]) => {
      try {
        setIsLoading(true);
        setError(null);

        // Validate subjects
        const validation = validateAPSSubjects(subjects);
        if (!validation.isValid) {
          setError(validation.errors.join("; "));
          return false;
        }

        // Calculate total APS
        const apsResult = calculateAPS(subjects);
        const totalAPS = apsResult.totalScore || 0;

        // Create profile
        const profile: UserAPSProfile = {
          subjects,
          totalAPS,
          lastUpdated: new Date().toISOString(),
          isValid: true,
        };

        // Save to localStorage with enhanced verification
        const saved = await saveProfile(profile);

        return saved;
      } catch (error) {
        setError("Failed to update subjects. Please try again.");
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [saveProfile],
  );

  /**
   * Search courses for a specific university using user's APS
   */
  const searchCoursesForUniversity = useCallback(
    async (targetUniversityId: string) => {
      if (!userProfile) {
        return [];
      }

      try {
        setIsLoading(true);
        setError(null);

        const apsOptions = {
          userAPS: userProfile.totalAPS,
          userSubjects: userProfile.subjects,
          includeAlmostQualified: true,
          maxAPSGap: 5,
        } as const;

        const results = await getUniversityFacultiesWithAPS(
          targetUniversityId,
          apsOptions,
        );

        if (targetUniversityId === universityId) {
          setLastSearchResults(results);
        }

        // Flatten faculties into a program list with eligibility flags for UI consumption
        const programs = (results.faculties || []).flatMap((f: any) =>
          (f.degrees || []).map((d: any) => ({
            id: d.id,
            name: d.name,
            faculty: f.name?.replace(/^Faculty of\s+/i, "") || d.faculty,
            universityName: (results.courses && results.courses[0]?.universityInfo?.name) || "",
            universityId: targetUniversityId,
            duration: d.duration,
            apsRequirement: d.apsRequirement,
            eligible: !!d.isEligible,
            apsGap: d.apsGap,
            subjects: d.subjects,
            careerProspects: d.careerProspects,
            description: d.description,
          })),
        );

        return programs;
      } catch (error) {
        setError("Failed to search courses. Please try again.");
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    [userProfile, universityId],
  );

  /**
   * Check if user qualifies for a specific program
   * Supports both userProfile and direct APS value from URL params
   */
  const checkProgramEligibility = useCallback(
    (
      program: { apsRequirement?: number; defaultAps?: number; name?: string },
      directAPS?: number,
    ) => {
      const apsToUse = directAPS || userProfile?.totalAPS;

      if (!apsToUse) return { eligible: false, reason: "No APS profile" };

      try {
        // Basic eligibility check - can be enhanced
        const requiredAPS = program.apsRequirement || program.defaultAps || 20;

        return {
          eligible: apsToUse >= requiredAPS,
          reason:
            apsToUse >= requiredAPS
              ? "Meets APS requirement"
              : `APS too low (need ${requiredAPS}, have ${apsToUse})`,
        };
      } catch (error) {
        return { eligible: false, reason: "Error checking eligibility" };
      }
    },
    [userProfile],
  );

  // Clear profile from localStorage - Enhanced with verification
  const clearProfile = useCallback(async () => {
    try {
      // Clear all APS-related localStorage keys
      localStorage.removeItem("userAPSProfile");
      localStorage.removeItem("apsSearchResults");
      localStorage.removeItem("apsProfileBackup");
      localStorage.removeItem("rebookedMarketplace-aps-profile");
      localStorage.removeItem("rebookedMarketplace-aps-search-results");
      localStorage.removeItem("reBooked-aps-profile");
      localStorage.removeItem("reBooked-aps-search-results");
      sessionStorage.removeItem("userAPSProfile");
      sessionStorage.removeItem("apsSearchResults");

      // Reset component state
      setUserProfile(null);
      setLastSearchResults(null);
      setError(null);

      // Verify clear was successful
      const verification = localStorage.getItem("userAPSProfile");
      const success = verification === null;

      // Trigger global state reset event
      window.dispatchEvent(new CustomEvent("apsProfileCleared"));

      return success;
    } catch (error) {
      return false;
    }
  }, [setUserProfile]);

  /**
   * Clear user's APS profile - Only when manually triggered
   */
  const clearAPSProfile = useCallback(() => {
    return clearProfile();
  }, [clearProfile]);

  /**
   * Clear any errors
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    userProfile,
    isLoading,
    error,
    hasValidProfile: !!(
      userProfile?.subjects && userProfile.subjects.length >= 4
    ),
    qualificationSummary: userProfile
      ? {
          totalAPS: userProfile.totalAPS,
          subjectCount: userProfile.subjects.length,
          isValid: userProfile.isValid || false,
        }
      : null,
    updateUserSubjects,
    searchCoursesForUniversity,
    checkProgramEligibility,
    clearAPSProfile,
    clearError,
    saveProfile,
    loadProfile,
    clearProfile,
  };
}

/**
 * Hook for managing APS filtering options
 */
export function useAPSFilterOptions() {
  const [includeAlmostQualified, setIncludeAlmostQualified] = useState(true);
  const [maxAPSGap, setMaxAPSGap] = useState(5);
  const [facultyFilter, setFacultyFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"aps" | "eligibility" | "name">(
    "eligibility",
  );

  const filterOptions: APSFilterOptions = useMemo(
    () => ({
      includeAlmostQualified,
      maxAPSGap,
      facultyFilter,
      sortBy,
    }),
    [includeAlmostQualified, maxAPSGap, facultyFilter, sortBy],
  );

  return {
    filterOptions,
    includeAlmostQualified,
    setIncludeAlmostQualified,
    maxAPSGap,
    setMaxAPSGap,
    facultyFilter,
    setFacultyFilter,
    sortBy,
    setSortBy,
  };
}

/**
 * Enhanced search hook with caching
 */
export function useAPSSearch() {
  const searchWithCache = useCallback(
    async (query: {
      universityId?: string;
      faculty?: string;
      apsRange?: { min: number; max: number };
    }) => {
      return APSAwareCourseSearchService.searchPrograms(query);
    },
    [],
  );

  return { searchWithCache };
}
