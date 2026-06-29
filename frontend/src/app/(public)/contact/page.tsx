"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Mail, Phone, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { contactSchema, type ContactFormValues } from "@/lib/validators/contact";

export default function ContactPage() {
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: "",
    },
  });

  const onSubmit = async (_values: ContactFormValues) => {
    setIsLoading(true);
    // Simulating API network submit
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsLoading(false);
    
    toast.success("Message sent successfully!", {
      description: "We've received your request and will respond within 24 hours.",
    });
    reset();
  };

  const contactInfos = [
    {
      title: "Email Support",
      detail: "tejakarthi65@gamil.com",
      icon: Mail,
    },
    {
      title: "Phone Assistance",
      detail: "+91 80743 10755",
      icon: Phone,
    },
    {
      title: "Headquarters Location",
      detail: "100 Silicon Boulevard, Suite 500, San Francisco, CA",
      icon: MapPin,
    },
  ];

  return (
    <div className="py-16 md:py-24 space-y-16 font-sans">
      {/* Page Header */}
      <section className="container max-w-4xl mx-auto px-4 text-center space-y-3">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground font-heading">
          Get in Touch
        </h1>
        <p className="text-lg text-muted-foreground">
          Have questions about registering as a seller or checking out an order? Reach out below.
        </p>
      </section>

      {/* Main Grid: Form + Info */}
      <section className="container max-w-6xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left Column: Info Grid */}
        <div className="lg:col-span-5 space-y-8">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight text-foreground font-heading">
              Contact Information
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Fill out the request form or get in touch through our direct support channels. Our helpdesk team stands by to solve billing, listing, or account concerns.
            </p>
          </div>

          <div className="space-y-6">
            {contactInfos.map((info) => {
              const Icon = info.icon;
              return (
                <div key={info.title} className="flex gap-4 p-4 border border-border bg-card rounded-xl shadow-sm">
                  <div className="p-2.5 bg-purple-50 dark:bg-purple-950/20 text-purple-600 rounded-lg shrink-0 h-10 w-10 flex items-center justify-center">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-heading text-sm font-semibold text-foreground">
                      {info.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1 select-all">
                      {info.detail}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Contact Form */}
        <div className="lg:col-span-7 bg-card border border-border p-8 rounded-2xl shadow-sm space-y-6">
          <h2 className="text-2xl font-bold tracking-tight text-foreground font-heading">
            Submit a Ticket
          </h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <div className="mt-1">
                  <Input
                    id="name"
                    type="text"
                    placeholder="Your Name"
                    {...register("name")}
                    disabled={isLoading}
                    className={errors.name ? "border-red-500 focus-visible:ring-red-500" : ""}
                  />
                  {errors.name && (
                    <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email Address</Label>
                <div className="mt-1">
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    {...register("email")}
                    disabled={isLoading}
                    className={errors.email ? "border-red-500 focus-visible:ring-red-500" : ""}
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
                  )}
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="subject">Subject</Label>
              <div className="mt-1">
                <Input
                  id="subject"
                  type="text"
                  placeholder="How can we help?"
                  {...register("subject")}
                  disabled={isLoading}
                  className={errors.subject ? "border-red-500 focus-visible:ring-red-500" : ""}
                />
                {errors.subject && (
                  <p className="mt-1 text-xs text-red-500">{errors.subject.message}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="message">Message</Label>
              <div className="mt-1">
                <textarea
                  id="message"
                  rows={5}
                  placeholder="Type your detailed concern here..."
                  {...register("message")}
                  disabled={isLoading}
                  className={cn(
                    "flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
                    errors.message ? "border-red-500 focus:ring-red-500" : ""
                  )}
                />
                {errors.message && (
                  <p className="mt-1 text-xs text-red-500">{errors.message.message}</p>
                )}
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending Message...
                </>
              ) : (
                "Send Message"
              )}
            </Button>
          </form>
        </div>
      </section>
    </div>
  );
}
