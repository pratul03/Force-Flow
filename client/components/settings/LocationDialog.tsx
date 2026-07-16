import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { BackendLocation, CreateLocationPayload, UpdateLocationPayload } from "@/features/locations/types";
import { useCreateLocation, useUpdateLocation } from "@/features/locations/queries";

interface Props {
  location: BackendLocation | null;
  isOpen: boolean;
  onClose: () => void;
}

export function LocationDialog({ location, isOpen, onClose }: Props) {
  const { mutate: createLocation, isPending: isCreating } = useCreateLocation();
  const { mutate: updateLocation, isPending: isUpdating } = useUpdateLocation();
  
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [timezone, setTimezone] = useState("UTC");
  const [isDefault, setIsDefault] = useState(false);

  useEffect(() => {
    if (location) {
      setName(location.name);
      setAddress(location.address || "");
      setCity(location.city || "");
      setState(location.state || "");
      setCountry(location.country || "");
      setZipCode(location.zipCode || "");
      setTimezone(location.timezone);
      setIsDefault(location.isDefault);
    } else {
      setName("");
      setAddress("");
      setCity("");
      setState("");
      setCountry("");
      setZipCode("");
      setTimezone("UTC");
      setIsDefault(false);
    }
  }, [location, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      name,
      address,
      city,
      state,
      country,
      zipCode,
      timezone,
      isDefault,
    };

    if (location) {
      updateLocation({ id: location.id, data: payload }, { onSuccess: onClose });
    } else {
      createLocation(payload, { onSuccess: onClose });
    }
  };

  const isPending = isCreating || isUpdating;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{location ? "Edit Location" : "Add Location"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Headquarters"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Address</Label>
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>City</Label>
              <Input value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>State</Label>
              <Input value={state} onChange={(e) => setState(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Country</Label>
              <Input value={country} onChange={(e) => setCountry(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Zip Code</Label>
              <Input value={zipCode} onChange={(e) => setZipCode(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Timezone</Label>
            <Input
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              placeholder="e.g. America/New_York"
              required
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <Label>Default Location</Label>
              <div className="text-[0.8rem] text-muted-foreground">
                Set as the default for new employees
              </div>
            </div>
            <Switch checked={isDefault} onCheckedChange={setIsDefault} />
          </div>
          
          <div className="flex justify-end pt-4 space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save Location"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
