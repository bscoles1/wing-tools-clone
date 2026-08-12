import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLocation } from "wouter";
import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Check, X, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function Pricing() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedTier, setSelectedTier] = useState<string | null>(null);

  const checkoutMutation = trpc.stripe.createCheckoutSession.useMutation({
    onSuccess: (data) => {
      toast.success("Subscription upgraded successfully!");
      setLocation("/uploader");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to initiate checkout");
      setSelectedTier(null);
    },
  });

  const handleSubscribe = (tierName: string) => {
    if (!isAuthenticated) {
      startLogin();
      return;
    }
    if (tierName === "Free") {
      setLocation("/uploader");
      return;
    }
    setSelectedTier(tierName);
    checkoutMutation.mutate({ tier: tierName as "Basic" | "Premium" });
  };

  const tiers = [
    {
      name: "Free",
      price: "$0",
      period: "forever",
      description: "Perfect for getting started",
      features: [
        { name: "Routing Table Generator (PDF)", included: true },
        { name: "Basic Excel Export", included: true },
        { name: "5 uploads per month", included: true },
        { name: "Signal Flow Diagram", included: false },
        { name: "Routing Diff", included: false },
        { name: "Snapshot Linter", included: false },
        { name: "Source Management", included: false },
        { name: "Priority Support", included: false },
      ],
      cta: "Get Started",
      highlighted: false,
    },
    {
      name: "Basic",
      price: "$4.99",
      period: "per month",
      description: "For working engineers",
      features: [
        { name: "Routing Table Generator (PDF)", included: true },
        { name: "Advanced Excel Export", included: true },
        { name: "10 uploads per month", included: true },
        { name: "Signal Flow Diagram", included: true },
        { name: "Routing Diff", included: true },
        { name: "Snapshot Linter", included: false },
        { name: "Source Management", included: true },
        { name: "Priority Support", included: false },
      ],
      cta: "Upgrade to Basic",
      highlighted: false,
    },
    {
      name: "Premium",
      price: "$9.99",
      period: "per month",
      description: "For professionals & teams",
      features: [
        { name: "Routing Table Generator (PDF)", included: true },
        { name: "Advanced Excel Export", included: true },
        { name: "100 uploads per month", included: true },
        { name: "Signal Flow Diagram", included: true },
        { name: "Routing Diff", included: true },
        { name: "Snapshot Linter (AI-powered)", included: true },
        { name: "Source Management", included: true },
        { name: "Priority Support", included: true },
      ],
      cta: "Upgrade to Premium",
      highlighted: true,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            Choose the plan that fits your needs. Powered securely by Stripe.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          {tiers.map((tier, index) => (
            <Card
              key={index}
              className={`relative flex flex-col p-8 transition-all ${
                tier.highlighted
                  ? "ring-2 ring-blue-600 dark:ring-blue-400 scale-105 shadow-xl bg-white dark:bg-slate-900"
                  : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
              }`}
            >
              {tier.highlighted && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                  {tier.name}
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                  {tier.description}
                </p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-slate-900 dark:text-white">
                    {tier.price}
                  </span>
                  {tier.period !== "forever" && (
                    <span className="text-slate-600 dark:text-slate-400">
                      {tier.period}
                    </span>
                  )}
                </div>
              </div>

              <ul className="space-y-4 mb-8 flex-1">
                {tier.features.map((feature, fIndex) => (
                  <li key={fIndex} className="flex items-center gap-3 text-sm">
                    {feature.included ? (
                      <Check className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0" />
                    ) : (
                      <X className="w-5 h-5 text-slate-300 dark:text-slate-700 shrink-0" />
                    )}
                    <span className={feature.included ? "text-slate-900 dark:text-white font-medium" : "text-slate-400 dark:text-slate-600"}>
                      {feature.name}
                    </span>
                  </li>
                ))}
              </ul>

              <Button
                className="w-full"
                variant={tier.highlighted ? "default" : "outline"}
                disabled={checkoutMutation.isPending && selectedTier === tier.name}
                onClick={() => handleSubscribe(tier.name)}
              >
                {checkoutMutation.isPending && selectedTier === tier.name ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                {tier.cta}
              </Button>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
