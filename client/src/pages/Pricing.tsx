import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLocation } from "wouter";
import { startLogin } from "@/const";
import { Check, X } from "lucide-react";

export default function Pricing() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

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
      cta: "Start Free Trial",
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
      cta: "Start Free Trial",
      highlighted: true,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            Choose the plan that fits your needs. All plans include a 14-day free trial.
          </p>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          {tiers.map((tier, index) => (
            <Card
              key={index}
              className={`relative flex flex-col p-8 transition-all ${
                tier.highlighted
                  ? "ring-2 ring-blue-600 dark:ring-blue-400 scale-105 shadow-xl"
                  : "border-slate-200 dark:border-slate-800"
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

              <Button
                size="lg"
                className={`w-full mb-8 ${
                  tier.highlighted
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                    : ""
                }`}
                variant={tier.highlighted ? "default" : "outline"}
                onClick={() => {
                  if (!isAuthenticated) {
                    startLogin();
                  } else {
                    // TODO: Integrate Stripe checkout
                    alert(`Stripe checkout for ${tier.name} tier`);
                  }
                }}
              >
                {tier.cta}
              </Button>

              <div className="space-y-4 flex-1">
                {tier.features.map((feature, featureIndex) => (
                  <div key={featureIndex} className="flex items-start gap-3">
                    {feature.included ? (
                      <Check className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    ) : (
                      <X className="w-5 h-5 text-slate-300 dark:text-slate-700 flex-shrink-0 mt-0.5" />
                    )}
                    <span
                      className={`text-sm ${
                        feature.included
                          ? "text-slate-900 dark:text-white"
                          : "text-slate-500 dark:text-slate-500"
                      }`}
                    >
                      {feature.name}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* FAQ Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-12 text-center">
          Frequently Asked Questions
        </h2>

        <div className="space-y-8">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
              Can I cancel anytime?
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              Yes, you can cancel your subscription at any time. No questions asked, no long-term contracts.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
              What payment methods do you accept?
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              We accept all major credit cards (Visa, Mastercard, American Express) through Stripe.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
              Do you offer refunds?
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              We offer a 30-day money-back guarantee if you're not satisfied with your subscription.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
              Can I upgrade or downgrade my plan?
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              Absolutely! You can change your plan at any time. We'll prorate any charges or credits.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
              Do you offer team discounts?
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              Yes! Contact our sales team for volume discounts and team pricing options.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
          Ready to get started?
        </h2>
        <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">
          Start with our free plan and upgrade whenever you're ready.
        </p>
        {!isAuthenticated && (
          <Button
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            onClick={startLogin}
          >
            Create Free Account
          </Button>
        )}
      </section>
    </div>
  );
}
