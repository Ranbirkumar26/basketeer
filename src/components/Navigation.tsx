import { Link, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ShoppingBasket, LogOut, Plus, Home } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logged out",
      description: "You've been successfully logged out.",
    });
    navigate("/");
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2 text-xl font-bold text-foreground hover:text-primary transition-colors">
            <ShoppingBasket className="h-6 w-6" />
            Basketeer
          </Link>
          
          <div className="flex items-center gap-4">
            <Button
              variant={isActive("/dashboard") ? "default" : "ghost"}
              size="sm"
              onClick={() => navigate("/dashboard")}
            >
              <Home className="h-4 w-4" />
              Dashboard
            </Button>
            <Button
              variant={isActive("/create-basket") ? "default" : "secondary"}
              size="sm"
              onClick={() => navigate("/create-basket")}
            >
              <Plus className="h-4 w-4" />
              Create Basket
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;