import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Clock, Users, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

interface BasketCardProps {
  id: string;
  platform: string;
  thresholdAmount: number;
  currentTotal: number;
  expiresAt: string;
  status: string;
  creatorName: string;
}

const BasketCard = ({
  id,
  platform,
  thresholdAmount,
  currentTotal,
  expiresAt,
  status,
  creatorName,
}: BasketCardProps) => {
  const navigate = useNavigate();
  const progress = (currentTotal / thresholdAmount) * 100;
  const timeLeft = formatDistanceToNow(new Date(expiresAt), { addSuffix: true });

  return (
    <Card className="hover:shadow-[var(--shadow-hover)] transition-[var(--transition-smooth)] border-border">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-xl mb-2">{platform}</CardTitle>
            <p className="text-sm text-muted-foreground">Created by {creatorName}</p>
          </div>
          <Badge variant={status === "active" ? "default" : "secondary"}>
            {status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-semibold">
              ₹{currentTotal.toFixed(2)} / ₹{thresholdAmount.toFixed(2)}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>Expires {timeLeft}</span>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          className="w-full"
          onClick={() => navigate(`/basket/${id}`)}
          variant="secondary"
        >
          View Details
          <ArrowRight className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
};

export default BasketCard;