import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AssetCategory, AssetCondition, AssetStatus } from "@/features/assets/types";
import { useCreateAsset } from "@/features/assets/queries";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateAssetDialog({ isOpen, onClose }: Props) {
  const { mutate: createAsset, isPending } = useCreateAsset();
  
  const [name, setName] = useState("");
  const [assetCode, setAssetCode] = useState("");
  const [category, setCategory] = useState<AssetCategory>("LAPTOP");
  const [serialNumber, setSerialNumber] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [purchaseValue, setPurchaseValue] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createAsset({
      name,
      assetCode,
      category,
      serialNumber: serialNumber || undefined,
      manufacturer: manufacturer || undefined,
      purchaseValue: purchaseValue ? parseFloat(purchaseValue) : undefined,
      status: "AVAILABLE",
      condition: "NEW",
    }, {
      onSuccess: () => {
        onClose();
        setName("");
        setAssetCode("");
        setSerialNumber("");
        setManufacturer("");
        setPurchaseValue("");
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Asset</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Asset Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. MacBook Pro M3"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Asset Code</Label>
              <Input
                value={assetCode}
                onChange={(e) => setAssetCode(e.target.value)}
                placeholder="e.g. AST-001"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as AssetCategory)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LAPTOP">Laptop</SelectItem>
                  <SelectItem value="MOBILE">Mobile</SelectItem>
                  <SelectItem value="ID_CARD">ID Card</SelectItem>
                  <SelectItem value="ACCESS_CARD">Access Card</SelectItem>
                  <SelectItem value="VEHICLE">Vehicle</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Serial Number</Label>
              <Input
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                placeholder="Optional"
              />
            </div>
            <div className="space-y-2">
              <Label>Manufacturer</Label>
              <Input
                value={manufacturer}
                onChange={(e) => setManufacturer(e.target.value)}
                placeholder="e.g. Apple"
              />
            </div>
            <div className="space-y-2">
              <Label>Purchase Value</Label>
              <Input
                type="number"
                value={purchaseValue}
                onChange={(e) => setPurchaseValue(e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>
          <div className="flex justify-end pt-4 space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save Asset"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
