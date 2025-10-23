import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingBasket, Users, Zap } from "lucide-react";
import heroImage from "@/assets/hero-basket.jpg";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="inline-block">
              <Badge className="mb-4 text-sm px-4 py-2">For College Students</Badge>
            </div>
            <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
              Shop Together,
              <br />
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Save Together
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-lg">
              Meet minimum order thresholds by collaborating with your hostel mates. Create or join
              baskets for BigBasket, Blinkit, Amazon, and more!
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg" variant="hero">
                <Link to="/auth">Get Started Free</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/dashboard">View Active Baskets</Link>
              </Button>
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-secondary/20 blur-3xl rounded-full"></div>
            <img
              src={heroImage}
              alt="Students collaborating on orders"
              className="relative rounded-2xl shadow-[var(--shadow-hover)] w-full"
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">How Basketeer Works</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Simple, fast, and collaborative shopping for college students
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <Card className="border-border shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-hover)] transition-[var(--transition-smooth)]">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <ShoppingBasket className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Create or Join Baskets</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Start a new basket for any platform or join existing ones. Set threshold amounts and
                expiration times.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-hover)] transition-[var(--transition-smooth)]">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-secondary/10 flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-secondary" />
              </div>
              <CardTitle>Add Your Items</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Paste product links or manually add items. Track contributions from all
                participants in real-time.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-hover)] transition-[var(--transition-smooth)]">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-accent" />
              </div>
              <CardTitle>Place Orders Together</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Once the threshold is met, get notified instantly. Close the basket and place your
                collaborative order!
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <Card className="bg-gradient-to-r from-primary to-secondary text-white border-0 shadow-[var(--shadow-hover)]">
          <CardContent className="py-16 text-center">
            <h2 className="text-4xl font-bold mb-4">Ready to Start Saving?</h2>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              Join hundreds of students already using Basketeer to meet order minimums and save on
              delivery fees.
            </p>
            <Button asChild size="lg" variant="secondary">
              <Link to="/auth">Create Your First Basket</Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default Index;
