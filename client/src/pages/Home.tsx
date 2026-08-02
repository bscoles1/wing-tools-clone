import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLocation } from "wouter";
import { startLogin } from "@/const";
import { ArrowRight, FileJson, BarChart3, GitCompare, AlertCircle, Settings, Zap } from "lucide-react";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  const features = [
    {
      icon: FileJson,
      title: "Routing Table Generator",
      description: "Generate professional PDF and Excel documentation from your WING snapshots with complete routing matrices.",
      tier: "Free",
    },
    {
      icon: BarChart3,
      title: "Signal Flow Diagram",
      description: "Interactive visualization showing how inputs flow through channels, buses, and outputs with collapsible groups.",
      tier: "Basic",
    },
    {
      icon: GitCompare,
      title: "Routing Diff",
      description: "Compare two snapshot files side-by-side to identify routing, source, and level changes instantly.",
      tier: "Basic",
    },
    {
      icon: AlertCircle,
      title: "Snapshot Linter",
      description: "AI-powered analysis that detects common configuration errors before your show.",
      tier: "Premium",
    },
    {
      icon: Settings,
      title: "Source Management",
      description: "Remap source properties like gain, phantom power, and stereo mode between I/O groups.",
      tier: "Basic",
    },
    {
      icon: Zap,
      title: "Advanced Features",
      description: "Multi-mixer signal flow, snapshot generation from Excel, and more coming soon.",
      tier: "Premium",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <FileJson className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-slate-900 dark:text-white">WingTools</span>
          </div>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <Button variant="outline" onClick={() => setLocation("/dashboard")}>
                  Dashboard
                </Button>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  {user?.name || user?.email}
                </div>
              </>
            ) : (
              <Button onClick={startLogin}>
                Sign In
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="mb-8">
          <h1 className="text-5xl sm:text-6xl font-bold text-slate-900 dark:text-white mb-6">
            Master Your WING Routing
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto mb-8">
            Upload your Behringer WING snapshot files and instantly generate professional documentation, visualizations, and analysis. Catch routing errors before you're on-site.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
          {isAuthenticated ? (
            <>
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8"
                onClick={() => setLocation("/uploader")}
              >
                Upload Snapshot
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => setLocation("/dashboard")}
              >
                View Dashboard
              </Button>
            </>
          ) : (
            <>
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8"
                onClick={startLogin}
              >
                Get Started Free
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => setLocation("/pricing")}
              >
                View Pricing
              </Button>
            </>
          )}
        </div>

        {/* Trust Indicators */}
        <div className="text-sm text-slate-600 dark:text-slate-400 mb-16">
          ✓ No credit card required • ✓ Free tier available • ✓ Secure file handling
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
            Powerful Tools for Audio Engineers
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-300">
            Everything you need to document, analyze, and optimize your WING configurations
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="p-6 hover:shadow-lg transition-shadow border-slate-200 dark:border-slate-800">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-lg">
                    <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-slate-900 dark:text-white">
                        {feature.title}
                      </h3>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        feature.tier === "Free"
                          ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                          : feature.tier === "Basic"
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                          : "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300"
                      }`}>
                        {feature.tier}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">
            Ready to streamline your WING workflow?
          </h2>
          <p className="text-lg mb-8 opacity-90">
            Start with our free tier and upgrade anytime as your needs grow.
          </p>
          {!isAuthenticated && (
            <Button
              size="lg"
              className="bg-white text-blue-600 hover:bg-slate-100 font-semibold"
              onClick={startLogin}
            >
              Create Free Account
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg" />
                <span className="font-bold text-slate-900 dark:text-white">WingTools</span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Professional WING snapshot analysis and documentation tools.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li><a href="#" className="hover:text-slate-900 dark:hover:text-white">Features</a></li>
                <li><a href="#" className="hover:text-slate-900 dark:hover:text-white">Pricing</a></li>
                <li><a href="#" className="hover:text-slate-900 dark:hover:text-white">Documentation</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li><a href="#" className="hover:text-slate-900 dark:hover:text-white">About</a></li>
                <li><a href="#" className="hover:text-slate-900 dark:hover:text-white">Blog</a></li>
                <li><a href="#" className="hover:text-slate-900 dark:hover:text-white">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li><a href="#" className="hover:text-slate-900 dark:hover:text-white">Privacy</a></li>
                <li><a href="#" className="hover:text-slate-900 dark:hover:text-white">Terms</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-200 dark:border-slate-800 pt-8 text-center text-sm text-slate-600 dark:text-slate-400">
            <p>&copy; 2026 WingTools. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
