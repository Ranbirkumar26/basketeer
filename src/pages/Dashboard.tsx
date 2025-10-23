import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import BasketCard from "@/components/BasketCard";
import { Loader2, ShoppingBasket } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Basket {
  id: string;
  platform: string;
  threshold_amount: number;
  current_total: number;
  expires_at: string;
  status: string;
  profiles: {
    full_name: string;
  };
}

const Dashboard = () => {
  const [baskets, setBaskets] = useState<Basket[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      fetchBaskets();
    };

    checkAuth();

    // Set up real-time subscription
    const channel = supabase
      .channel("baskets-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "baskets",
        },
        () => {
          fetchBaskets();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [navigate]);

  const fetchBaskets = async () => {
    try {
      const { data, error } = await supabase
        .from("baskets")
        .select(
          `
          id,
          platform,
          threshold_amount,
          current_total,
          expires_at,
          status,
          profiles (
            full_name
          )
        `
        )
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBaskets(data || []);
    } catch (error) {
      console.error("Error fetching baskets:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Active Baskets</h1>
          <p className="text-muted-foreground">
            Join a basket or create your own to start collaborating on orders
          </p>
        </div>

        {baskets.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingBasket className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-semibold mb-2">No active baskets</h2>
            <p className="text-muted-foreground mb-6">
              Be the first to create a basket and start collaborating!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {baskets.map((basket) => (
              <BasketCard
                key={basket.id}
                id={basket.id}
                platform={basket.platform}
                thresholdAmount={basket.threshold_amount}
                currentTotal={basket.current_total}
                expiresAt={basket.expires_at}
                status={basket.status}
                creatorName={basket.profiles.full_name}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;