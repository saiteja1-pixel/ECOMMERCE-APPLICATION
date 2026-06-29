import type { Metadata } from "next";
import { ShieldCheck, Users, TrendingUp } from "lucide-react";

export const metadata: Metadata = {
  title: "About CommerceHub - Our Mission & Story",
  description: "Learn more about the vision behind CommerceHub, a secure and robust multi-seller platform built on modern technology.",
};

export default function AboutPage() {
  const values = [
    {
      title: "Verified Integrity",
      description:
        "Every seller on our platform passes a strict administrative background moderation review before listing items, ensuring premium transaction trust.",
      icon: ShieldCheck,
    },
    {
      title: "Community Focus",
      description:
        "We support local and independent merchants, providing them with robust inventory management panels to compete in the national digital economy.",
      icon: Users,
    },
    {
      title: "Continuous Innovation",
      description:
        "Built on the latest Next.js 15 App Router architecture, providing rapid static rendering, state preservation, and edge session protection.",
      icon: TrendingUp,
    },
  ];

  return (
    <div className="py-16 md:py-24 space-y-20 font-sans">
      {/* 1. Header Hero section */}
      <section className="container max-w-4xl mx-auto px-4 text-center space-y-4">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground font-heading">
          Connecting Independent Merchants with Global Shoppers
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          CommerceHub is a next-generation multi-role e-commerce marketplace platform engineered to remove transaction friction, secure listings, and streamline store management.
        </p>
      </section>

      {/* 2. Visual Split Story section */}
      <section className="container max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <h2 className="text-3xl font-bold tracking-tight text-foreground font-heading">
            Our Story & Vision
          </h2>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            Founded with the belief that online marketplaces should be fast, secure, and transparent, CommerceHub was created as a premium modular alternative. By separating buyer portals from granular seller administrative dashboards, we provide dedicated focus areas tailored specifically for each user role.
          </p>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            Powered by modern cloud technologies, Supabase PostgreSQL row-level security, and responsive Tailwind UI designs, our mission is to scale commercial growth for independent brands while guaranteeing protection and secure checkouts for buyers.
          </p>
        </div>
        
        {/* Placeholder image grid simulating team/workspace */}
        <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-900 flex items-center justify-center border border-border">
          <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-900 to-purple-950 opacity-90" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:30px_30px]" />
          <div className="relative z-10 text-center space-y-2 p-8">
            <span className="text-2xl font-bold tracking-tight text-white font-heading">
              Secure Cockpit Ecosystem
            </span>
            <p className="text-xs text-purple-300 max-w-xs mx-auto">
              Engineered with transactional integrity and strict database triggers.
            </p>
          </div>
        </div>
      </section>

      {/* 3. Core Values Grid */}
      <section className="container max-w-7xl mx-auto px-4 space-y-12">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold tracking-tight text-foreground font-heading">
            Our Core Values
          </h2>
          <p className="text-sm text-muted-foreground">
            The principles guiding how we build CommerceHub.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {values.map((val) => {
            const Icon = val.icon;
            return (
              <div
                key={val.title}
                className="bg-card border border-border p-8 rounded-2xl shadow-sm space-y-4 hover:border-purple-500 hover:shadow-md transition-all duration-300"
              >
                <div className="h-10 w-10 rounded-lg bg-purple-50 dark:bg-purple-950/20 text-purple-600 flex items-center justify-center">
                  <Icon className="h-5.5 w-5.5" />
                </div>
                <h3 className="font-heading text-lg font-bold text-foreground">
                  {val.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {val.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
