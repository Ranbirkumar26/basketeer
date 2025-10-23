import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, ShoppingCart, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface BasketItem {
  id: string;
  product_name: string;
  product_url: string | null;
  product_image: string | null;
  price: number;
  quantity: number;
  profiles: {
    full_name: string;
  };
  user_id: string;
}

interface Basket {
  id: string;
  platform: string;
  threshold_amount: number;
  current_total: number;
  expires_at: string;
  status: string;
  creator_id: string;
  profiles: {
    full_name: string;
  };
}

const BasketDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [basket, setBasket] = useState<Basket | null>(null);
  const [items, setItems] = useState<BasketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingItem, setAddingItem] = useState(false);
  const [productUrl, setProductUrl] = useState("");
  const [productName, setProductName] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [currentUserId, setCurrentUserId] = useState("");
  const [scraping, setScraping] = useState(false);
  const [lastNotifiedAt, setLastNotifiedAt] = useState<number>(0);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setCurrentUserId(session.user.id);
      fetchBasketData();
    };

    checkAuth();

    // Real-time subscriptions
    const itemsChannel = supabase
      .channel("basket-items-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "basket_items",
          filter: `basket_id=eq.${id}`,
        },
        () => {
          fetchItems();
        }
      )
      .subscribe();

    const basketChannel = supabase
      .channel("basket-changes")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "baskets",
          filter: `id=eq.${id}`,
        },
        () => {
          fetchBasket();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(itemsChannel);
      supabase.removeChannel(basketChannel);
    };
  }, [id, navigate]);

  const fetchBasketData = async () => {
    await Promise.all([fetchBasket(), fetchItems()]);
    setLoading(false);
  };

  const fetchBasket = async () => {
    try {
      const { data, error } = await supabase
        .from("baskets")
        .select(
          `
          *,
          profiles (
            full_name
          )
        `
        )
        .eq("id", id)
        .single();

      if (error) throw error;
      setBasket(data);

      // Send email notification if threshold is met and not recently notified
      const now = Date.now();
      if (
        data.current_total >= data.threshold_amount &&
        data.status === "active" &&
        now - lastNotifiedAt > 300000 // 5 minutes cooldown
      ) {
        setTimeout(() => {
          sendThresholdNotification(data.id);
        }, 0);
        setLastNotifiedAt(now);
      }
    } catch (error) {
      console.error("Error fetching basket:", error);
      toast({
        title: "Error",
        description: "Failed to load basket",
        variant: "destructive",
      });
    }
  };

  const sendThresholdNotification = async (basketId: string) => {
    try {
      const { error } = await supabase.functions.invoke("send-threshold-notification", {
        body: { basketId },
      });

      if (error) throw error;

      console.log("Threshold notification sent successfully");
    } catch (error) {
      console.error("Error sending threshold notification:", error);
    }
  };

  const handleScrapeUrl = async () => {
    if (!productUrl) {
      toast({
        title: "URL required",
        description: "Please enter a product URL to scrape",
        variant: "destructive",
      });
      return;
    }

    setScraping(true);
    try {
      const { data, error } = await supabase.functions.invoke("scrape-product", {
        body: { url: productUrl },
      });

      if (error) throw error;

      if (data.success && data.data) {
        setProductName(data.data.name);
        setProductPrice(data.data.price);
        toast({
          title: "Product details fetched!",
          description: "You can now review and add the item.",
        });
      } else {
        toast({
          title: "Couldn't scrape product",
          description: data.error || "Please enter details manually",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to scrape product. Please enter manually.",
        variant: "destructive",
      });
    } finally {
      setScraping(false);
    }
  };

  const fetchItems = async () => {
    try {
      const { data, error } = await supabase
        .from("basket_items")
        .select(
          `
          *,
          profiles (
            full_name
          )
        `
        )
        .eq("basket_id", id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error("Error fetching items:", error);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingItem(true);

    try {
      const { error } = await supabase.from("basket_items").insert({
        basket_id: id,
        user_id: currentUserId,
        product_name: productName,
        product_url: productUrl || null,
        price: parseFloat(productPrice),
        quantity: parseInt(quantity),
      });

      if (error) throw error;

      toast({
        title: "Item added!",
        description: "Your item has been added to the basket.",
      });

      setProductUrl("");
      setProductName("");
      setProductPrice("");
      setQuantity("1");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setAddingItem(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      const { error } = await supabase.from("basket_items").delete().eq("id", itemId);

      if (error) throw error;

      toast({
        title: "Item removed",
        description: "Item has been removed from the basket.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleCloseBasket = async () => {
    try {
      const { error } = await supabase
        .from("baskets")
        .update({ status: "closed" })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Basket closed",
        description: "This basket has been closed and is ready for order placement.",
      });

      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!basket) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Basket not found</p>
      </div>
    );
  }

  const progress = (basket.current_total / basket.threshold_amount) * 100;
  const isCreator = currentUserId === basket.creator_id;
  const thresholdMet = basket.current_total >= basket.threshold_amount;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Basket Info */}
          <div className="lg:col-span-2">
            <Card className="mb-6 shadow-[var(--shadow-card)]">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-3xl mb-2">{basket.platform}</CardTitle>
                    <p className="text-muted-foreground">
                      Created by {basket.profiles.full_name}
                    </p>
                  </div>
                  <Badge variant={basket.status === "active" ? "default" : "secondary"}>
                    {basket.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Total Progress</span>
                    <span className="font-semibold text-lg">
                      ₹{basket.current_total.toFixed(2)} / ₹{basket.threshold_amount.toFixed(2)}
                    </span>
                  </div>
                  <Progress value={progress} className="h-3" />
                  {thresholdMet && (
                    <p className="text-sm text-accent font-semibold mt-2">
                      🎉 Threshold reached! Ready to place order.
                    </p>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  Expires {formatDistanceToNow(new Date(basket.expires_at), { addSuffix: true })}
                </div>
                {isCreator && basket.status === "active" && (
                  <Button onClick={handleCloseBasket} variant="default" className="w-full">
                    <ShoppingCart className="h-4 w-4" />
                    Close Basket & Place Order
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Items List */}
            <Card>
              <CardHeader>
                <CardTitle>Items in Basket</CardTitle>
              </CardHeader>
              <CardContent>
                {items.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No items yet. Be the first to add!
                  </p>
                ) : (
                  <div className="space-y-4">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{item.product_name}</h3>
                            {item.product_url && (
                              <a
                                href={item.product_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Added by {item.profiles.full_name}
                          </p>
                          <p className="text-sm font-medium mt-1">
                            ₹{item.price.toFixed(2)} × {item.quantity} = ₹
                            {(item.price * item.quantity).toFixed(2)}
                          </p>
                        </div>
                        {item.user_id === currentUserId && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Add Item Form */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Add Item</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddItem} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="productUrl">Product URL</Label>
                    <div className="flex gap-2">
                      <Input
                        id="productUrl"
                        type="url"
                        value={productUrl}
                        onChange={(e) => setProductUrl(e.target.value)}
                        placeholder="Paste product link here"
                      />
                      <Button
                        type="button"
                        onClick={handleScrapeUrl}
                        disabled={scraping || !productUrl}
                        variant="secondary"
                      >
                        {scraping ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Fetch"
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Paste a link to auto-fill product details
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="productName">Product Name</Label>
                    <Input
                      id="productName"
                      type="text"
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      placeholder="Product name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="productPrice">Price (₹)</Label>
                    <Input
                      id="productPrice"
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={productPrice}
                      onChange={(e) => setProductPrice(e.target.value)}
                      placeholder="0.00"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={addingItem}>
                    {addingItem && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Plus className="h-4 w-4" />
                    Add to Basket
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default BasketDetail;