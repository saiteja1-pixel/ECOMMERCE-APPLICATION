"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import type { z } from "zod";
import {
  MapPin,
  Plus,
  Trash2,
  Edit2,
  Loader2,
} from "lucide-react";
import { CustomerDashboardLayout } from "@/components/layout/customer-dashboard-layout";
import { addressService } from "@/services/address-service";
import { addressSchema } from "@/lib/validators/checkout";
import type { Address } from "@/types/address";
import { cn } from "@/lib/utils";

// Modal dialogue helper elements
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function CustomerAddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Dialog state controls
  const [openFormDialog, setOpenFormDialog] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Address validation form hook
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      full_name: "",
      phone: "",
      address_line_1: "",
      address_line_2: "",
      city: "",
      state: "",
      pincode: "",
      is_default: false,
    },
  });

  const loadAddresses = async () => {
    setIsLoading(true);
    try {
      const data = await addressService.getAddresses();
      setAddresses(data);
    } catch {
      toast.error("Failed to load shipping addresses.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAddresses();
  }, []);

  const handleOpenAdd = () => {
    if (addresses.length >= 10) {
      toast.error("You can save at most 10 addresses.");
      return;
    }
    setEditingAddress(null);
    reset({
      full_name: "",
      phone: "",
      address_line_1: "",
      address_line_2: "",
      city: "",
      state: "",
      pincode: "",
      is_default: false,
    });
    setOpenFormDialog(true);
  };

  const handleOpenEdit = (addr: Address) => {
    setEditingAddress(addr);
    reset({
      full_name: addr.full_name,
      phone: addr.phone,
      address_line_1: addr.address_line_1,
      address_line_2: addr.address_line_2 || "",
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
      is_default: addr.is_default,
    });
    setOpenFormDialog(true);
  };

  const onSubmit = async (data: z.infer<typeof addressSchema>) => {
    setIsSubmitting(true);
    try {
      if (editingAddress) {
        // Edit update logic calls
        await addressService.updateAddress(editingAddress.id, data);
        toast.success("Shipping address updated!");
      } else {
        // Create insert logic calls
        await addressService.createAddress(data);
        toast.success("Shipping address saved successfully!");
      }
      setOpenFormDialog(false);
      await loadAddresses();
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Failed to save address details.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const confirm = window.confirm("Delete this shipping destination address?");
    if (!confirm) return;

    try {
      await addressService.deleteAddress(id);
      toast.success("Address deleted.");
      await loadAddresses();
    } catch {
      toast.error("Failed to delete address.");
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await addressService.setDefaultAddress(id);
      toast.success("Default shipping address set.");
      await loadAddresses();
    } catch {
      toast.error("Failed to update default address status.");
    }
  };

  if (isLoading) {
    return (
      <CustomerDashboardLayout>
        <div className="flex items-center justify-center py-20 font-sans">
          <Loader2 className="h-8 w-8 animate-spin text-purple-650" />
        </div>
      </CustomerDashboardLayout>
    );
  }

  return (
    <CustomerDashboardLayout>
      <div className="space-y-6 font-sans select-none pb-12">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-border pb-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground font-heading">
              Delivery Destinations
            </h1>
            <p className="text-sm text-muted-foreground">
              Configure shipping address endpoints. Max 10 address locations.
            </p>
          </div>

          <Button
            onClick={handleOpenAdd}
            className="bg-purple-650 hover:bg-purple-750 text-white rounded-xl text-xs gap-1.5 h-10 px-4 cursor-pointer font-bold"
          >
            <Plus className="h-4 w-4" />
            Add Address
          </Button>
        </div>

        {/* Address Cards Grid list */}
        {addresses.length === 0 ? (
          <div className="text-center py-16 bg-card border border-dashed border-border rounded-2xl space-y-3">
            <MapPin className="h-10 w-10 text-slate-350 mx-auto" />
            <div>
              <p className="text-sm font-semibold">No addresses saved yet</p>
              <p className="text-xs text-muted-foreground mt-0.5">Add your primary delivery destinations here.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {addresses.map((addr) => (
              <div
                key={addr.id}
                onClick={() => !addr.is_default && handleSetDefault(addr.id)}
                className={cn(
                  "relative p-5 border rounded-2xl bg-card transition-all cursor-pointer flex flex-col justify-between shadow-sm",
                  addr.is_default 
                    ? "border-purple-605 ring-2 ring-purple-600/10 cursor-default" 
                    : "border-border hover:border-slate-350"
                )}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-foreground">{addr.full_name}</span>
                    {addr.is_default && (
                      <span className="text-[9px] font-bold text-purple-655 bg-purple-50 px-2 py-0.5 rounded-full select-none">
                        Default
                      </span>
                    )}
                  </div>
                  
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {addr.address_line_1}
                    {addr.address_line_2 && `, ${addr.address_line_2}`}
                    <br />
                    {addr.city}, {addr.state} - {addr.pincode}
                  </p>

                  <p className="text-xs text-muted-foreground">Phone: <span className="font-medium text-foreground">{addr.phone}</span></p>
                </div>

                <div className="flex items-center justify-between pt-4 mt-4 border-t border-border">
                  <span className="text-[10px] text-purple-650 font-bold uppercase select-none">
                    {!addr.is_default && "Set default"}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEdit(addr);
                      }}
                      className="p-1.5 text-slate-400 hover:text-purple-650 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                      title="Edit address"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(e, addr.id)}
                      className="p-1.5 text-slate-400 hover:text-red-650 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                      title="Delete address"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Address edit/create Modal dialogue */}
        <Dialog open={openFormDialog} onOpenChange={(open) => !open && setOpenFormDialog(false)}>
          <DialogContent className="max-w-lg select-none font-sans">
            <DialogHeader>
              <DialogTitle className="font-heading font-bold text-base text-foreground">
                {editingAddress ? "Modify Shipping Address" : "Save Shipping Address"}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="full_name" className="text-xs font-semibold text-muted-foreground">Full Name</Label>
                  <Input
                    id="full_name"
                    placeholder="John Doe"
                    {...register("full_name")}
                    className="border-border bg-slate-50/50 text-xs"
                    required
                  />
                  {errors.full_name && <p className="text-[10px] font-bold text-red-650">{errors.full_name.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-xs font-semibold text-muted-foreground">Contact Phone</Label>
                  <Input
                    id="phone"
                    placeholder="9876543210"
                    {...register("phone")}
                    className="border-border bg-slate-50/50 text-xs"
                    required
                  />
                  {errors.phone && <p className="text-[10px] font-bold text-red-650">{errors.phone.message}</p>}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="address_line_1" className="text-xs font-semibold text-muted-foreground">Address Line 1</Label>
                <Input
                  id="address_line_1"
                  placeholder="House No, Street, Landmark details"
                  {...register("address_line_1")}
                  className="border-border bg-slate-50/50 text-xs"
                  required
                />
                {errors.address_line_1 && <p className="text-[10px] font-bold text-red-650">{errors.address_line_1.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="address_line_2" className="text-xs font-semibold text-muted-foreground">Address Line 2 (Optional)</Label>
                <Input
                  id="address_line_2"
                  placeholder="Apartment name, Suite details"
                  {...register("address_line_2")}
                  className="border-border bg-slate-50/50 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="city" className="text-xs font-semibold text-muted-foreground">City</Label>
                  <Input
                    id="city"
                    placeholder="Mumbai"
                    {...register("city")}
                    className="border-border bg-slate-50/50 text-xs"
                    required
                  />
                  {errors.city && <p className="text-[10px] font-bold text-red-650">{errors.city.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="state" className="text-xs font-semibold text-muted-foreground">State</Label>
                  <Input
                    id="state"
                    placeholder="Maharashtra"
                    {...register("state")}
                    className="border-border bg-slate-50/50 text-xs"
                    required
                  />
                  {errors.state && <p className="text-[10px] font-bold text-red-650">{errors.state.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="pincode" className="text-xs font-semibold text-muted-foreground">Pincode (6 Digits)</Label>
                  <Input
                    id="pincode"
                    placeholder="400001"
                    {...register("pincode")}
                    className="border-border bg-slate-50/50 text-xs"
                    required
                  />
                  {errors.pincode && <p className="text-[10px] font-bold text-red-650">{errors.pincode.message}</p>}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  id="is_default"
                  type="checkbox"
                  {...register("is_default")}
                  className="h-4 w-4 rounded border-gray-300 text-purple-650 focus:ring-purple-500 cursor-pointer"
                />
                <Label htmlFor="is_default" className="text-xs font-semibold text-foreground cursor-pointer select-none">
                  Set as default shipping address
                </Label>
              </div>

              <DialogFooter className="pt-4 border-t border-border mt-4">
                <Button
                  type="button"
                  onClick={() => setOpenFormDialog(false)}
                  variant="ghost"
                  className="text-xs cursor-pointer h-9"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-purple-650 hover:bg-purple-750 text-white rounded-lg h-9 text-xs font-bold cursor-pointer"
                >
                  {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Save Shipping Address
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </CustomerDashboardLayout>
  );
}
