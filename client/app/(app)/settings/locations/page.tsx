"use client";

import { useState } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { useLocations, useDeleteLocation } from "@/features/locations/queries";
import { Button } from "@/components/ui/button";
import { Plus, MapPin, Trash2, Edit2 } from "lucide-react";
import { BackendLocation } from "@/features/locations/types";
import { LocationDialog } from "@/components/settings/LocationDialog";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ListLoadingSkeleton } from "@/components/ui/loading-skeletons";

export default function LocationsPage() {
  const { data: locations, isLoading } = useLocations();
  const { mutate: deleteLocation } = useDeleteLocation();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<BackendLocation | null>(null);

  const handleEdit = (loc: BackendLocation) => {
    setEditingLocation(loc);
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingLocation(null);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this location?")) {
      deleteLocation(id);
    }
  };

  return (
    <PageShell title="Locations" description="Manage your organization's office locations">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex-1" />
        <Button onClick={handleCreate} className="flex items-center gap-2">
          <Plus className="h-4 w-4" /> Add Location
        </Button>
      </div>

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-6">
            <ListLoadingSkeleton items={3} />
          </div>
        ) : locations?.length === 0 ? (
          <div className="p-10 text-center text-slate-500">
            No locations found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Address</th>
                  <th className="px-4 py-3 font-medium">Timezone</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {locations?.map((loc) => (
                  <tr key={loc.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-slate-400" />
                        <p className="font-medium text-slate-900">{loc.name}</p>
                        {loc.isDefault && (
                          <Badge variant="secondary" className="text-[10px]">Default</Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {[loc.city, loc.state, loc.country].filter(Boolean).join(', ')}
                      {!loc.city && !loc.state && !loc.country && '-'}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{loc.timezone}</td>
                    <td className="px-4 py-3">
                      <Badge variant={loc.isActive ? 'default' : 'secondary'}>
                        {loc.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(loc)}>
                          <Edit2 className="h-4 w-4 text-slate-500" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(loc.id)}>
                          <Trash2 className="h-4 w-4 text-rose-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <LocationDialog 
        location={editingLocation}
        isOpen={isDialogOpen} 
        onClose={() => setIsDialogOpen(false)} 
      />
    </PageShell>
  );
}
