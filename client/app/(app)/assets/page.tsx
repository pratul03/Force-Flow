"use client";

import { useState } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { useAssets } from "@/features/assets/queries";
import { Button } from "@/components/ui/button";
import { Plus, Laptop, Smartphone, Car, CreditCard, Tag, Search } from "lucide-react";
import { BackendAsset } from "@/features/assets/types";
import { CreateAssetDialog } from "@/components/assets/CreateAssetDialog";
import { AssignAssetDialog } from "@/components/assets/AssignAssetDialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ListLoadingSkeleton } from "@/components/ui/loading-skeletons";

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  LAPTOP: <Laptop className="h-4 w-4" />,
  MOBILE: <Smartphone className="h-4 w-4" />,
  VEHICLE: <Car className="h-4 w-4" />,
  ID_CARD: <CreditCard className="h-4 w-4" />,
  ACCESS_CARD: <CreditCard className="h-4 w-4" />,
  OTHER: <Tag className="h-4 w-4" />,
};

export default function AssetsPage() {
  const { data: assets, isLoading } = useAssets();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [assignAsset, setAssignAsset] = useState<BackendAsset | null>(null);
  const [search, setSearch] = useState("");

  const filteredAssets = assets?.filter((asset) => 
    asset.name.toLowerCase().includes(search.toLowerCase()) ||
    asset.assetCode.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <PageShell title="Assets & Equipment" description="Manage company assets and assignments">
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Search by name or code..." 
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" /> Add Asset
        </Button>
      </div>

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-6">
            <ListLoadingSkeleton items={5} />
          </div>
        ) : filteredAssets.length === 0 ? (
          <div className="p-10 text-center text-slate-500">
            No assets found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Asset</th>
                  <th className="px-4 py-3 font-medium">Code</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Assigned To</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAssets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{asset.name}</p>
                      {asset.serialNumber && (
                        <p className="text-xs text-slate-500">SN: {asset.serialNumber}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{asset.assetCode}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 text-slate-600">
                        {CATEGORY_ICONS[asset.category] || CATEGORY_ICONS.OTHER}
                        <span className="capitalize">{asset.category.toLowerCase().replace('_', ' ')}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={asset.status === 'AVAILABLE' ? 'default' : 'secondary'}>
                        {asset.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {asset.assignedTo ? (
                        <span className="font-medium">{asset.assignedTo.name}</span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {asset.status === 'AVAILABLE' && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setAssignAsset(asset)}
                        >
                          Assign
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <CreateAssetDialog isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
      <AssignAssetDialog 
        asset={assignAsset} 
        isOpen={!!assignAsset} 
        onClose={() => setAssignAsset(null)} 
      />
    </PageShell>
  );
}
