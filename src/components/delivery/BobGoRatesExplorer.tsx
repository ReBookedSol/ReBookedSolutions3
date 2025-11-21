import React, { useCallback, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { getAllDeliveryQuotes, UnifiedQuote } from "@/services/unifiedDeliveryService";
import { MapPin, Truck, Timer, Zap, DollarSign, RefreshCw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const provinces = [
  "Eastern Cape",
  "Free State",
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Mpumalanga",
  "Northern Cape",
  "North West",
  "Western Cape",
];

const SelectBox: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
}> = ({ label, value, onChange, options, placeholder }) => (
  <div>
    <Label className="text-sm text-gray-700">{label}</Label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="mt-1 w-full border rounded-md px-3 py-2 bg-white"
    >
      <option value="">{placeholder || "Select"}</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  </div>
);

const NumberInput: React.FC<{
  label: string;
  value: number | string;
  onChange: (v: number) => void;
  min?: number;
  step?: number;
}> = ({ label, value, onChange, min = 0, step = 1 }) => (
  <div>
    <Label className="text-sm text-gray-700">{label}</Label>
    <Input
      type="number"
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      min={min}
      step={step}
      className="mt-1"
    />
  </div>
);

const BobGoRatesExplorer: React.FC = () => {
  const { user } = useAuth();
  const [fromCity, setFromCity] = useState("");
  const [fromProvince, setFromProvince] = useState("");
  const [fromPostal, setFromPostal] = useState("");
  const [toCity, setToCity] = useState("");
  const [toProvince, setToProvince] = useState("");
  const [toPostal, setToPostal] = useState("");
  const [weight, setWeight] = useState(1);
  const [length, setLength] = useState(25);
  const [width, setWidth] = useState(20);
  const [height, setHeight] = useState(3);
  const [loading, setLoading] = useState(false);
  const [quotes, setQuotes] = useState<UnifiedQuote[]>([]);

  const fetchQuotes = useCallback(async () => {
    setLoading(true);
    try {
      const results = await getAllDeliveryQuotes({
        from: {
          streetAddress: "",
          suburb: fromCity,
          city: fromCity,
          province: fromProvince,
          postalCode: fromPostal || "0000",
        },
        to: {
          streetAddress: "",
          suburb: toCity,
          city: toCity,
          province: toProvince,
          postalCode: toPostal || "0000",
        },
        weight: weight || 1,
        length,
        width,
        height,
        user_id: user?.id,
      });
      setQuotes(results);
    } finally {
      setLoading(false);
    }
  }, [fromCity, fromProvince, fromPostal, toCity, toProvince, toPostal, weight, length, width, height, user?.id]);

  const cheapest = useMemo(() => (quotes.length ? [...quotes].sort((a,b)=>a.cost-b.cost)[0] : undefined), [quotes]);
  const fastest = useMemo(() => (quotes.length ? [...quotes].sort((a,b)=>a.transit_days-b.transit_days)[0] : undefined), [quotes]);
  const recommended = useMemo(() => (
    quotes.length ? [...quotes].sort((a,b)=> (a.cost + a.transit_days*15) - (b.cost + b.transit_days*15))[0] : undefined
  ), [quotes]);

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-book-600" />
            Live Courier Options (BobGo)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700"><MapPin className="h-4 w-4"/>From</div>
              <Input placeholder="City/Suburb" value={fromCity} onChange={(e)=>setFromCity(e.target.value)} />
              <SelectBox label="Province" value={fromProvince} onChange={setFromProvince} options={provinces} placeholder="Select province" />
              <Input placeholder="Postal Code" value={fromPostal} onChange={(e)=>setFromPostal(e.target.value)} />
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700"><MapPin className="h-4 w-4"/>To</div>
              <Input placeholder="City/Suburb" value={toCity} onChange={(e)=>setToCity(e.target.value)} />
              <SelectBox label="Province" value={toProvince} onChange={setToProvince} options={provinces} placeholder="Select province" />
              <Input placeholder="Postal Code" value={toPostal} onChange={(e)=>setToPostal(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <NumberInput label="Weight (kg)" value={weight} onChange={setWeight} step={0.1} />
            <NumberInput label="Length (cm)" value={length} onChange={setLength} />
            <NumberInput label="Width (cm)" value={width} onChange={setWidth} />
            <NumberInput label="Height (cm)" value={height} onChange={setHeight} />
          </div>

          <Button onClick={fetchQuotes} className="w-full sm:w-auto bg-book-600 hover:bg-book-700" disabled={loading}>
            {loading ? (<><RefreshCw className="h-4 w-4 mr-2 animate-spin"/>Fetching Rates...</>) : (<>Get Rates</>)}
          </Button>
        </CardContent>
      </Card>

      {quotes.length > 0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {recommended && (
              <Card className="border-2 border-book-200">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2"><Zap className="h-5 w-5 text-book-600"/>Recommended</span>
                    <Badge>R{recommended.cost}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-gray-700">
                  <div className="flex items-center gap-2 mb-1"><Timer className="h-4 w-4"/>~{recommended.transit_days} days</div>
                  <div className="flex items-center gap-2"><Truck className="h-4 w-4"/>{recommended.service_name}</div>
                </CardContent>
              </Card>
            )}
            {cheapest && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2"><DollarSign className="h-5 w-5 text-green-600"/>Cheapest</span>
                    <Badge className="bg-green-600 text-white">R{cheapest.cost}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-gray-700">
                  <div className="flex items-center gap-2 mb-1"><Timer className="h-4 w-4"/>~{cheapest.transit_days} days</div>
                  <div className="flex items-center gap-2"><Truck className="h-4 w-4"/>{cheapest.service_name}</div>
                </CardContent>
              </Card>
            )}
            {fastest && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2"><Timer className="h-5 w-5 text-blue-600"/>Fastest</span>
                    <Badge className="bg-blue-600 text-white">~{fastest.transit_days} days</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-gray-700">
                  <div className="flex items-center gap-2 mb-1"><DollarSign className="h-4 w-4"/>R{fastest.cost}</div>
                  <div className="flex items-center gap-2"><Truck className="h-4 w-4"/>{fastest.service_name}</div>
                </CardContent>
              </Card>
            )}
          </div>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>All Options</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {quotes.map((q, idx) => (
                  <Card key={idx} className="border rounded-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between text-base">
                        <span className="truncate">{q.service_name}</span>
                        <span className="font-semibold">R{q.cost}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-gray-700 space-y-1">
                      <div className="flex items-center gap-2"><Truck className="h-4 w-4"/>{q.provider_name}</div>
                      <div className="flex items-center gap-2"><Timer className="h-4 w-4"/>~{q.transit_days} days</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default BobGoRatesExplorer;
