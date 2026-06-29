import { createClient } from "@/lib/supabase/client";
import type { Address } from "@/types/address";
import type { AddressFormValues } from "@/lib/validators/checkout";

export const addressService = {
  async getAddresses() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from("addresses")
      .select("*")
      .eq("customer_id", user.id)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return data as Address[];
  },

  async createAddress(values: AddressFormValues) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized access.");

    // If this address is set as default, update all existing addresses to non-default
    if (values.is_default) {
      const { error: resetError } = await supabase
        .from("addresses")
        .update({ is_default: false })
        .eq("customer_id", user.id);

      if (resetError) throw new Error(resetError.message);
    }

    const { data, error } = await supabase
      .from("addresses")
      .insert({
        customer_id: user.id,
        full_name: values.full_name,
        phone: values.phone,
        address_line_1: values.address_line_1,
        address_line_2: values.address_line_2 || null,
        city: values.city,
        state: values.state,
        pincode: values.pincode,
        is_default: values.is_default,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Address;
  },

  async deleteAddress(id: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized access.");

    const { error } = await supabase
      .from("addresses")
      .delete()
      .eq("id", id)
      .eq("customer_id", user.id);

    if (error) throw new Error(error.message);
  },

  async updateAddress(id: string, values: AddressFormValues) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized access.");

    // If setting as default, reset others first
    if (values.is_default) {
      const { error: resetError } = await supabase
        .from("addresses")
        .update({ is_default: false })
        .eq("customer_id", user.id);

      if (resetError) throw new Error(resetError.message);
    }

    const { data, error } = await supabase
      .from("addresses")
      .update({
        full_name: values.full_name,
        phone: values.phone,
        address_line_1: values.address_line_1,
        address_line_2: values.address_line_2 || null,
        city: values.city,
        state: values.state,
        pincode: values.pincode,
        is_default: values.is_default,
      })
      .eq("id", id)
      .eq("customer_id", user.id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Address;
  },

  async setDefaultAddress(id: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized access.");

    // Unset default on all addresses
    const { error: resetError } = await supabase
      .from("addresses")
      .update({ is_default: false })
      .eq("customer_id", user.id);

    if (resetError) throw new Error(resetError.message);

    // Set default on target address
    const { error: setError } = await supabase
      .from("addresses")
      .update({ is_default: true })
      .eq("id", id)
      .eq("customer_id", user.id);

    if (setError) throw new Error(setError.message);
  },
};
