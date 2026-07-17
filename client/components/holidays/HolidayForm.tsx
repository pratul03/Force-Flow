"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CreateHolidayPayload, BackendHoliday } from "@/features/holidays/types";
import { useLocations } from "@/features/locations/queries";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MultiSelect } from "@/components/ui/multi-select";

const holidaySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  date: z.string().min(1, "Date is required"),
  type: z.enum(["PUBLIC", "COMPANY", "OPTIONAL"]),
  description: z.string().optional(),
  locationIds: z.array(z.string()).optional(),
});

type HolidayFormValues = z.infer<typeof holidaySchema>;

interface HolidayFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  holiday?: BackendHoliday | null;
  onSubmit: (data: CreateHolidayPayload) => Promise<void>;
  isSubmitting?: boolean;
}

export function HolidayForm({
  open,
  onOpenChange,
  holiday,
  onSubmit,
  isSubmitting,
}: HolidayFormProps) {
  const { data: locations = [] } = useLocations();

  const form = useForm<HolidayFormValues>({
    resolver: zodResolver(holidaySchema),
    defaultValues: {
      name: "",
      date: new Date().toISOString().slice(0, 10),
      type: "PUBLIC",
      description: "",
      locationIds: [],
    },
  });

  useEffect(() => {
    if (open && holiday) {
      form.reset({
        name: holiday.name,
        date: new Date(holiday.date).toISOString().slice(0, 10),
        type: holiday.type,
        description: holiday.description || "",
        locationIds: holiday.locations?.map((l) => l.id) || [],
      });
    } else if (open && !holiday) {
      form.reset({
        name: "",
        date: new Date().toISOString().slice(0, 10),
        type: "PUBLIC",
        description: "",
        locationIds: [],
      });
    }
  }, [open, holiday, form]);

  const handleSubmit = async (values: HolidayFormValues) => {
    // Ensure date is properly formatted
    const dateObj = new Date(values.date);
    await onSubmit({
      ...values,
      date: dateObj.toISOString(),
      locationIds: values.locationIds?.length ? values.locationIds : undefined,
    });
  };

  const locationOptions = locations.map((loc) => ({
    label: loc.name,
    value: loc.id,
  }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{holiday ? "Edit Holiday" : "Add Holiday"}</DialogTitle>
          <DialogDescription>
            {holiday
              ? "Update the details of the holiday."
              : "Add a new holiday to the company calendar."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Holiday Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. New Year's Day" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="PUBLIC">Public</SelectItem>
                        <SelectItem value="COMPANY">Company</SelectItem>
                        <SelectItem value="OPTIONAL">Optional</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="locationIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Applicable Locations (Optional)</FormLabel>
                  <FormControl>
                    <MultiSelect
                      options={locationOptions}
                      selected={field.value || []}
                      onChange={field.onChange}
                      placeholder="Select locations..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Brief description about the holiday..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end pt-4 space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Holiday"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
