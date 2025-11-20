import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, Loader2, Package } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

interface Suggestion {
  description: string;
  place_id: string;
}

interface LocationDetails {
  address: string;
  lat: number;
  lng: number;
}

interface PickupPoint {
  name: string;
  distance: string;
  address: string;
}

export const AddressAutocomplete = () => {
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<LocationDetails | null>(null);
  const [pickupPoints, setPickupPoints] = useState<PickupPoint[]>([]);
  const [isLoadingPickup, setIsLoadingPickup] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout>();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchSuggestions = async (searchInput: string) => {
    if (!searchInput.trim()) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('autocomplete', {
        body: {},
        method: 'GET',
      });

      // Since we can't pass query params directly in the invoke method easily,
      // we'll use a direct fetch instead
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(
        `https://kbpjqzaqbqukutflwixf.supabase.co/functions/v1/autocomplete?input=${encodeURIComponent(searchInput)}`,
        {
          headers: {
            'Authorization': `Bearer ${session?.access_token || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImticGpxemFxYnF1a3V0Zmx3aXhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc1NjMzNzcsImV4cCI6MjA2MzEzOTM3N30.3EdAkGlyFv1JRaRw9OFMyA5AkkKoXp0hdX1bFWpLVMc'}`,
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImticGpxemFxYnF1a3V0Zmx3aXhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc1NjMzNzcsImV4cCI6MjA2MzEzOTM3N30.3EdAkGlyFv1JRaRw9OFMyA5AkkKoXp0hdX1bFWpLVMc'
          }
        }
      );

      const result = await response.json();

      if (result.error) {
        toast.error('Failed to fetch suggestions');
        console.error(result.error);
        return;
      }

      setSuggestions(result.suggestions || []);
      setShowDropdown(true);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      toast.error('Failed to fetch address suggestions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInput(value);

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      fetchSuggestions(value);
    }, 300);
  };

  const handleSuggestionClick = async (suggestion: Suggestion) => {
    setInput(suggestion.description);
    setShowDropdown(false);
    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(
        `https://kbpjqzaqbqukutflwixf.supabase.co/functions/v1/autocomplete-details?place_id=${encodeURIComponent(suggestion.place_id)}`,
        {
          headers: {
            'Authorization': `Bearer ${session?.access_token || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImticGpxemFxYnF1a3V0Zmx3aXhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc1NjMzNzcsImV4cCI6MjA2MzEzOTM3N30.3EdAkGlyFv1JRaRw9OFMyA5AkkKoXp0hdX1bFWpLVMc'}`,
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImticGpxemFxYnF1a3V0Zmx3aXhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc1NjMzNzcsImV4cCI6MjA2MzEzOTM3N30.3EdAkGlyFv1JRaRw9OFMyA5AkkKoXp0hdX1bFWpLVMc'
          }
        }
      );

      const details: LocationDetails = await response.json();

      if (details.address) {
        setSelectedAddress(details);
        toast.success('Address selected!');
        await fetchPickupPoints(details.lat, details.lng);
      } else {
        toast.error('Failed to get address details');
      }
    } catch (error) {
      console.error('Error fetching details:', error);
      toast.error('Failed to get address details');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPickupPoints = async (lat: number, lng: number) => {
    setIsLoadingPickup(true);
    try {
      // Mock Bob Go API call - replace with actual API endpoint
      const response = await fetch(
        `https://api.bobgo.co.za/pickup-points?lat=${lat}&lng=${lng}`
      );

      // For demo purposes, using mock data
      // In production, parse the actual Bob Go API response
      const mockPickupPoints: PickupPoint[] = [
        {
          name: "Pep Stores - Menlyn",
          distance: "1.2 km",
          address: "Shop 123, Menlyn Park Shopping Centre, Pretoria"
        },
        {
          name: "Pep Stores - Brooklyn",
          distance: "2.5 km",
          address: "Shop 45, Brooklyn Mall, Pretoria"
        },
        {
          name: "Pep Stores - Centurion",
          distance: "5.8 km",
          address: "Shop 67, Centurion Mall, Centurion"
        }
      ];

      setPickupPoints(mockPickupPoints);
      toast.success(`Found ${mockPickupPoints.length} nearby pickup points`);
    } catch (error) {
      console.error('Error fetching pickup points:', error);
      toast.error('Failed to fetch pickup points');
    } finally {
      setIsLoadingPickup(false);
    }
  };

  return (
    <div className= "w-full max-w-2xl space-y-6" >
    <div className="relative" ref = { dropdownRef } >
      <div className="relative" >
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
  value = { input }
  onChange = { handleInputChange }
  placeholder = "Search for an address..."
  className = "pl-10 pr-10 h-12"
    />
    { isLoading && (
      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin text-primary" />
          )}
</div>

{
  showDropdown && suggestions.length > 0 && (
    <Card className="absolute top-full mt-2 w-full z-50 bg-card border shadow-lg max-h-80 overflow-y-auto" >
    {
      suggestions.map((suggestion, index) => (
        <button
                key= { suggestion.place_id }
                onClick = {() => handleSuggestionClick(suggestion)}
  className = "w-full px-4 py-3 text-left hover:bg-accent transition-colors flex items-start gap-3 border-b last:border-b-0"
    >
    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
      <span className="text-sm text-foreground" > { suggestion.description } < /span>
        < /button>
            ))
}
</Card>
        )}
</div>

{
  selectedAddress && (
    <Card className="p-6 bg-accent/50" >
      <h3 className="font-semibold text-lg mb-2 flex items-center gap-2" >
        <MapPin className="h-5 w-5 text-primary" />
          Selected Address
            < /h3>
            < p className = "text-foreground" > { selectedAddress.address } < /p>
              < p className = "text-sm text-muted-foreground mt-2" >
                Coordinates: { selectedAddress.lat.toFixed(4) }, { selectedAddress.lng.toFixed(4) }
  </p>
    < /Card>
      )
}

{
  isLoadingPickup && (
    <div className="flex items-center justify-center py-8" >
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )
}

{
  pickupPoints.length > 0 && (
    <div className="space-y-3" >
      <h3 className="font-semibold text-lg flex items-center gap-2" >
        <Package className="h-5 w-5 text-primary" />
          Nearby Pickup Points
            < /h3>
  {
    pickupPoints.map((point, index) => (
      <Card key= { index } className = "p-4 hover:shadow-md transition-shadow cursor-pointer" >
      <div className="flex justify-between items-start" >
    <div className="space-y-1" >
    <h4 className="font-medium text-foreground" > { point.name } < /h4>
    < p className = "text-sm text-muted-foreground" > { point.address } < /p>
    < /div>
    < span className = "text-sm font-medium text-primary" > { point.distance } < /span>
    < /div>
    < /Card>
    ))
  }
  </div>
      )
}
</div>
  );
};
