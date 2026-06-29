"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  MapPin,
  Check,
  Plus,
  ArrowLeft,
  Loader2,
  Lock,
  ChevronRight,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addressService } from "@/services/address-service";
import { cartService } from "@/services/cart-service";
import { orderService } from "@/services/order-service";
import { addressSchema, type AddressFormValues } from "@/lib/validators/checkout";
import type { Address } from "@/types/address";
import type { CartItem } from "@/types/cart";
import { cn } from "@/lib/utils";

export default function CheckoutPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [isSubmittingAddress, setIsSubmittingAddress] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "upi" | "card">("cod");
  const [upiId, setUpiId] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");

  // Zod form for new address inputs
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

  // Fetch initial checkout dependencies
  useEffect(() => {
    async function loadCheckoutData() {
      try {
        const items = await cartService.getCartItems();
        if (items.length === 0) {
          toast.error("Your cart is empty. Please add products first.");
          router.push("/cart");
          return;
        }
        setCartItems(items);

        const addr = await addressService.getAddresses();
        setAddresses(addr);

        // Pre-select default address
        const defaultAddr = addr.find((a) => a.is_default);
        if (defaultAddr) {
          setSelectedAddressId(defaultAddr.id);
        } else if (addr.length > 0) {
          setSelectedAddressId(addr[0].id);
        }
      } catch (err: unknown) {
        console.error(err);
        toast.error("Failed to load checkout data.");
      } finally {
        setIsDataLoading(false);
      }
    }

    loadCheckoutData();
  }, [router]);

  const handleAddAddress = async (data: AddressFormValues) => {
    setIsSubmittingAddress(true);
    try {
      const newAddress = await addressService.createAddress(data);
      toast.success("Shipping address saved!");
      
      // Reload address list
      const addr = await addressService.getAddresses();
      setAddresses(addr);
      setSelectedAddressId(newAddress.id);
      setShowAddressForm(false);
      reset();
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Failed to save address.");
    } finally {
      setIsSubmittingAddress(false);
    }
  };

  const handleDeleteAddress = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const confirmDelete = window.confirm("Delete this address?");
    if (!confirmDelete) return;

    try {
      await addressService.deleteAddress(id);
      toast.success("Address deleted.");
      const addr = await addressService.getAddresses();
      setAddresses(addr);

      if (selectedAddressId === id) {
        setSelectedAddressId(addr.find((a) => a.is_default)?.id || addr[0]?.id || "");
      }
    } catch {
      toast.error("Failed to delete address.");
    }
  };

  const handlePlaceOrder = async () => {
    const activeAddress = addresses.find((a) => a.id === selectedAddressId);
    if (!activeAddress) {
      toast.error("Please select a shipping address.");
      return;
    }

    if (paymentMethod === "upi" && !upiId.trim()) {
      toast.error("Please enter a valid UPI ID.");
      return;
    }

    if (paymentMethod === "card") {
      if (cardNumber.replace(/\s+/g, "").length < 16) {
        toast.error("Please enter a valid 16-digit Card Number.");
        return;
      }
      if (!cardExpiry.trim() || !cardCvv.trim()) {
        toast.error("Please enter your card's Expiry Date and CVV.");
        return;
      }
    }

    const addressWithPayment = {
      ...activeAddress,
      payment_method: paymentMethod.toUpperCase(),
      payment_details: paymentMethod === "upi" 
        ? { upi_id: upiId } 
        : paymentMethod === "card" 
          ? { card_number: `**** **** **** ${cardNumber.slice(-4)}` }
          : null
    };

    setIsPlacingOrder(true);
    try {
      // Execute database multi-seller transactional ordering RPC
      const createdOrderIds = await orderService.placeOrder(addressWithPayment, cartItems);
      toast.success("Order placed successfully!");
      
      // Redirect to confirmation using first order UUID
      router.push(`/checkout/confirmation/${createdOrderIds[0]}`);
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Failed to process transaction. Please verify stock values.");
    } finally {
      setIsPlacingOrder(false);
    }
  };

  // Pricing calculations
  const subtotal = cartItems.reduce((acc, item) => {
    const effectivePrice = item.product_discount > 0 
      ? item.product_price * (1 - item.product_discount / 100) 
      : item.product_price;
    return acc + (effectivePrice * item.quantity);
  }, 0);
  const total = subtotal;

  if (isDataLoading) {
    return (
      <div className="container max-w-7xl mx-auto px-4 py-24 flex items-center justify-center font-sans">
        <Loader2 className="h-10 w-10 animate-spin text-purple-600" />
      </div>
    );
  }

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId);

  return (
    <div className="container max-w-7xl mx-auto px-4 py-12 font-sans space-y-10 select-none">
      {/* Checkout header */}
      <div className="flex items-center justify-between border-b border-border pb-6">
        <div className="flex items-center gap-3">
          <Link href="/cart" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg text-slate-500 cursor-pointer">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground font-heading">
            Secure Checkout
          </h1>
        </div>
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <Lock className="h-3.5 w-3.5 text-purple-650" />
          SSL Enforced Encryption
        </span>
      </div>

      {/* Progress Checkout Stepper */}
      <div className="max-w-2xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn(
            "h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold font-sans",
            step === 1 ? "bg-purple-600 text-white" : "bg-purple-100 text-purple-600 dark:bg-purple-950/20"
          )}>
            1
          </div>
          <span className="text-xs font-semibold text-foreground">Shipping Address</span>
        </div>
        <div className="flex-1 border-t border-border mx-4" />
        <div className="flex items-center gap-2">
          <div className={cn(
            "h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold font-sans",
            step === 2 ? "bg-purple-600 text-white" : "bg-slate-100 text-slate-500 dark:bg-slate-900"
          )}>
            2
          </div>
          <span className="text-xs font-semibold text-muted-foreground">Order Review</span>
        </div>
        <div className="flex-1 border-t border-border mx-4" />
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-slate-100 text-slate-500 dark:bg-slate-900 flex items-center justify-center text-xs font-bold font-sans">
            3
          </div>
          <span className="text-xs font-semibold text-muted-foreground">Confirmation</span>
        </div>
      </div>

      {/* Grid layouts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left Side forms section (65%) */}
        <div className="lg:col-span-8 space-y-6">
          {/* STEP 1: SHIPPING ADDRESS SELECTION */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold tracking-tight text-foreground font-heading">
                  Select Shipping Address
                </h2>
                {!showAddressForm && (
                  <Button
                    onClick={() => setShowAddressForm(true)}
                    variant="outline"
                    className="gap-1.5 cursor-pointer text-xs h-9 border-border"
                  >
                    <Plus className="h-4 w-4" />
                    New Address
                  </Button>
                )}
              </div>

              {/* Dynamic inputs address block */}
              {showAddressForm && (
                <form
                  onSubmit={handleSubmit(handleAddAddress)}
                  className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-4 animate-in fade-in slide-in-from-top-4 duration-250"
                >
                  <h3 className="font-bold text-sm text-foreground border-b border-border pb-2">Add New Shipping Address</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="full_name" className="text-xs font-semibold text-muted-foreground">Full Name</Label>
                      <Input
                        id="full_name"
                        placeholder="John Doe"
                        {...register("full_name")}
                        className="border-border bg-slate-50/50"
                      />
                      {errors.full_name && <p className="text-[10px] font-bold text-red-650">{errors.full_name.message}</p>}
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="phone" className="text-xs font-semibold text-muted-foreground">Contact Phone</Label>
                      <Input
                        id="phone"
                        placeholder="9876543210"
                        {...register("phone")}
                        className="border-border bg-slate-50/50"
                      />
                      {errors.phone && <p className="text-[10px] font-bold text-red-650">{errors.phone.message}</p>}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="address_line_1" className="text-xs font-semibold text-muted-foreground">Address Line 1</Label>
                    <Input
                      id="address_line_1"
                      placeholder="House No, Street, Apartment Name"
                      {...register("address_line_1")}
                      className="border-border bg-slate-50/50"
                    />
                    {errors.address_line_1 && <p className="text-[10px] font-bold text-red-650">{errors.address_line_1.message}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="address_line_2" className="text-xs font-semibold text-muted-foreground">Address Line 2 (Optional)</Label>
                    <Input
                      id="address_line_2"
                      placeholder="Landmark, Area details"
                      {...register("address_line_2")}
                      className="border-border bg-slate-50/50"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="city" className="text-xs font-semibold text-muted-foreground">City</Label>
                      <Input
                        id="city"
                        placeholder="Mumbai"
                        {...register("city")}
                        className="border-border bg-slate-50/50"
                      />
                      {errors.city && <p className="text-[10px] font-bold text-red-650">{errors.city.message}</p>}
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="state" className="text-xs font-semibold text-muted-foreground">State</Label>
                      <Input
                        id="state"
                        placeholder="Maharashtra"
                        {...register("state")}
                        className="border-border bg-slate-50/50"
                      />
                      {errors.state && <p className="text-[10px] font-bold text-red-650">{errors.state.message}</p>}
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="pincode" className="text-xs font-semibold text-muted-foreground">Pincode (6 Digits)</Label>
                      <Input
                        id="pincode"
                        placeholder="400001"
                        {...register("pincode")}
                        className="border-border bg-slate-50/50"
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

                  <div className="flex gap-2 pt-4 justify-end border-t border-border">
                    <Button
                      type="button"
                      onClick={() => setShowAddressForm(false)}
                      variant="ghost"
                      className="cursor-pointer text-xs"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmittingAddress}
                      className="bg-purple-600 hover:bg-purple-700 text-white rounded-lg cursor-pointer text-xs gap-1.5"
                    >
                      {isSubmittingAddress && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      Save Shipping Address
                    </Button>
                  </div>
                </form>
              )}

              {/* List of saved shipping addresses */}
              {addresses.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground border border-dashed rounded-2xl bg-card border-border">
                  <MapPin className="h-10 w-10 mx-auto text-slate-300 mb-2 animate-pulse" />
                  <p className="text-sm font-semibold">No shipping addresses saved yet.</p>
                  <p className="text-xs text-muted-foreground mt-1">Click &apos;New Address&apos; to create your primary shipping destination.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {addresses.map((addr) => {
                    const isSelected = selectedAddressId === addr.id;
                    return (
                      <div
                        key={addr.id}
                        onClick={() => setSelectedAddressId(addr.id)}
                        className={cn(
                          "relative p-5 border rounded-2xl bg-card transition-all cursor-pointer select-none flex flex-col justify-between shadow-sm",
                          isSelected 
                            ? "border-purple-600 ring-2 ring-purple-600/10" 
                            : "border-border hover:border-slate-350"
                        )}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-sm text-foreground">{addr.full_name}</span>
                            {addr.is_default && (
                              <span className="text-[9px] font-bold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded-full select-none">
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
                          <span className="flex items-center gap-1.5 text-xs text-purple-600 font-semibold">
                            {isSelected && (
                              <>
                                <Check className="h-4 w-4" />
                                Selected
                              </>
                            )}
                          </span>

                          <button
                            onClick={(e) => handleDeleteAddress(e, addr.id)}
                            className="p-1.5 text-slate-400 hover:text-red-650 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Nav buttons */}
              {addresses.length > 0 && (
                <div className="pt-6 border-t border-border flex justify-end">
                  <Button
                    onClick={() => setStep(2)}
                    disabled={!selectedAddressId}
                    className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl h-11 px-8 font-bold cursor-pointer gap-1.5"
                  >
                    Continue to Review
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: ORDER REVIEW */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold tracking-tight text-foreground font-heading">
                Review Your Order
              </h2>

              {/* Address snapshot review */}
              <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                    <MapPin className="h-4.5 w-4.5 text-purple-600" />
                    Delivery Destination
                  </h3>
                  <button
                    onClick={() => setStep(1)}
                    className="text-xs font-semibold text-purple-600 hover:underline cursor-pointer"
                  >
                    Change Address
                  </button>
                </div>

                {selectedAddress && (
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p className="font-bold text-foreground">{selectedAddress.full_name}</p>
                    <p>
                      {selectedAddress.address_line_1}
                      {selectedAddress.address_line_2 && `, ${selectedAddress.address_line_2}`}
                    </p>
                    <p>{selectedAddress.city}, {selectedAddress.state} - {selectedAddress.pincode}</p>
                    <p>Contact Phone: <span className="font-semibold text-foreground">{selectedAddress.phone}</span></p>
                  </div>
                )}
              </div>

              {/* Payment Method Selection */}
              <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-4">
                <h3 className="font-bold text-sm text-foreground border-b border-border pb-3">
                  Select Payment Method
                </h3>
                
                <div className="grid grid-cols-1 gap-3">
                  {/* COD Option */}
                  <div
                    onClick={() => setPaymentMethod("cod")}
                    className={cn(
                      "flex items-start gap-3 p-4 border rounded-xl cursor-pointer transition-all select-none",
                      paymentMethod === "cod"
                        ? "border-purple-600 bg-purple-50/30 dark:bg-purple-950/10"
                        : "border-border hover:border-slate-350"
                    )}
                  >
                    <div className={cn(
                      "h-4 w-4 rounded-full border flex items-center justify-center mt-0.5",
                      paymentMethod === "cod" ? "border-purple-600 bg-purple-600 text-white" : "border-slate-300"
                    )}>
                      {paymentMethod === "cod" && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">Cash on Delivery (COD)</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Pay in cash when package arrives at your doorstep</p>
                    </div>
                  </div>

                  {/* UPI Option */}
                  <div
                    onClick={() => setPaymentMethod("upi")}
                    className={cn(
                      "flex flex-col gap-3 p-4 border rounded-xl cursor-pointer transition-all select-none",
                      paymentMethod === "upi"
                        ? "border-purple-600 bg-purple-50/30 dark:bg-purple-950/10"
                        : "border-border hover:border-slate-355"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "h-4 w-4 rounded-full border flex items-center justify-center mt-0.5",
                        paymentMethod === "upi" ? "border-purple-600 bg-purple-600 text-white" : "border-slate-300"
                      )}>
                        {paymentMethod === "upi" && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-foreground">UPI Payment</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Pay instantly using GPay, PhonePe, Paytm, or any UPI ID</p>
                      </div>
                    </div>

                    {paymentMethod === "upi" && (
                      <div className="pt-2 pl-7 space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
                        <Label htmlFor="upi_id" className="text-[10px] font-semibold text-muted-foreground">UPI ID</Label>
                        <Input
                          id="upi_id"
                          placeholder="username@upi"
                          value={upiId}
                          onChange={(e) => setUpiId(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          className="h-9 border-border bg-slate-50/50 text-xs rounded-lg max-w-xs focus:bg-white"
                        />
                      </div>
                    )}
                  </div>

                  {/* Credit / Debit Card Option */}
                  <div
                    onClick={() => setPaymentMethod("card")}
                    className={cn(
                      "flex flex-col gap-3 p-4 border rounded-xl cursor-pointer transition-all select-none",
                      paymentMethod === "card"
                        ? "border-purple-600 bg-purple-50/30 dark:bg-purple-950/10"
                        : "border-border hover:border-slate-355"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "h-4 w-4 rounded-full border flex items-center justify-center mt-0.5",
                        paymentMethod === "card" ? "border-purple-600 bg-purple-600 text-white" : "border-slate-300"
                      )}>
                        {paymentMethod === "card" && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-foreground">Credit or Debit Card</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">All major credit and debit cards supported</p>
                      </div>
                    </div>

                    {paymentMethod === "card" && (
                      <div className="pt-2 pl-7 grid grid-cols-1 sm:grid-cols-3 gap-3 animate-in fade-in slide-in-from-top-1 duration-150" onClick={(e) => e.stopPropagation()}>
                        <div className="sm:col-span-3 space-y-1.5">
                          <Label htmlFor="card_number" className="text-[10px] font-semibold text-muted-foreground">Card Number</Label>
                          <Input
                            id="card_number"
                            placeholder="1234 5678 9012 3456"
                            value={cardNumber}
                            maxLength={19}
                            onChange={(e) => {
                              const formatted = e.target.value
                                .replace(/\D/g, "")
                                .replace(/(.{4})/g, "$1 ")
                                .trim();
                              setCardNumber(formatted);
                            }}
                            className="h-9 border-border bg-slate-50/50 text-xs rounded-lg focus:bg-white"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="card_expiry" className="text-[10px] font-semibold text-muted-foreground">Expiry Date</Label>
                          <Input
                            id="card_expiry"
                            placeholder="MM/YY"
                            value={cardExpiry}
                            maxLength={5}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, "");
                              const formatted = val.length > 2 ? `${val.slice(0,2)}/${val.slice(2,4)}` : val;
                              setCardExpiry(formatted);
                            }}
                            className="h-9 border-border bg-slate-50/50 text-xs rounded-lg focus:bg-white"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="card_cvv" className="text-[10px] font-semibold text-muted-foreground">CVV</Label>
                          <Input
                            id="card_cvv"
                            type="password"
                            placeholder="•••"
                            value={cardCvv}
                            maxLength={3}
                            onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ""))}
                            className="h-9 border-border bg-slate-50/50 text-xs rounded-lg focus:bg-white"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Order items read-only list preview */}
              <div className="bg-card border border-border rounded-2xl divide-y divide-border overflow-hidden shadow-sm">
                <h3 className="font-bold text-sm text-foreground p-6 bg-slate-50/50 dark:bg-slate-900/10 select-none">
                  Ordered Items
                </h3>
                
                {cartItems.map((item) => {
                  const effectivePrice = item.product_discount > 0 
                    ? item.product_price * (1 - item.product_discount / 100) 
                    : item.product_price;
                  return (
                    <div key={item.id} className="p-6 flex items-center justify-between gap-6">
                      <div className="flex items-center gap-4 grow">
                        <div className="relative h-14 w-14 rounded-xl overflow-hidden border border-border bg-slate-50 shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.product_image}
                            alt={item.product_name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div>
                          <h4 className="font-bold text-xs text-foreground truncate max-w-sm">{item.product_name}</h4>
                          <p className="text-[10px] text-muted-foreground">Qty: {item.quantity} x ${effectivePrice.toFixed(2)}</p>
                        </div>
                      </div>
                      <span className="font-sans font-bold text-sm text-foreground shrink-0">
                        ${(effectivePrice * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Nav triggers */}
              <div className="pt-6 border-t border-border flex items-center justify-between">
                <Button
                  onClick={() => setStep(1)}
                  variant="outline"
                  className="cursor-pointer text-xs"
                >
                  Back to Shipping
                </Button>

                <Button
                  onClick={handlePlaceOrder}
                  disabled={isPlacingOrder}
                  className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl h-11 px-8 font-bold cursor-pointer gap-1.5"
                >
                  {isPlacingOrder && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {paymentMethod === "cod" ? "Place COD Order" : paymentMethod === "upi" ? "Pay & Place Order (UPI)" : "Pay & Place Order (Card)"}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Right Side summary pane (35%) */}
        <aside className="lg:col-span-4 space-y-6">
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-6">
            <h3 className="font-heading font-bold text-foreground text-sm border-b border-border pb-4">
              Cart Summary
            </h3>

            <div className="space-y-3 text-xs select-none">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Items Subtotal</span>
                <span className="font-semibold text-foreground font-mono">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Postage/Shipping</span>
                <span className="font-bold text-green-600 uppercase text-[10px]">Free</span>
              </div>
              <div className="border-t border-border pt-4 flex items-center justify-between font-bold text-sm text-foreground">
                <span>Final total price</span>
                <span className="font-mono">${total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-border rounded-xl text-[10px] text-muted-foreground space-y-1.5">
            <p className="font-bold text-foreground flex items-center gap-1">
              <ShieldCheck className="h-4 w-4 text-purple-650" />
              Secure Buyer Policies
            </p>
            <p>
              CommerceHub guarantees secure transactions. Address and pricing metrics are snapshotted instantly onto order lines. Changes post checkout will not affect historical receipts.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
