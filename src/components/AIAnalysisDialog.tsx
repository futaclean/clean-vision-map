import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, TrendingUp, CheckCircle2, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface AIAnalysis {
  score: number;
  improvement_percentage: number;
  waste_removed_estimate: string;
  before_assessment: string;
  after_assessment: string;
  key_improvements: string[];
  recommendations: string[];
  summary: string;
}

interface AIAnalysisDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  analysis: AIAnalysis | null;
  isAnalyzing: boolean;
}

export function AIAnalysisDialog({ open, onOpenChange, analysis, isAnalyzing }: AIAnalysisDialogProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-orange-600";
  };

  const getScoreBadgeVariant = (score: number): "default" | "secondary" | "destructive" => {
    if (score >= 80) return "default";
    if (score >= 60) return "secondary";
    return "destructive";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Cleanup Analysis
          </DialogTitle>
          <DialogDescription>
            AI-powered comparison of before and after cleanup images
          </DialogDescription>
        </DialogHeader>

        {isAnalyzing && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="text-muted-foreground">Analyzing images with AI...</p>
            <p className="text-sm text-muted-foreground">This may take a moment</p>
          </div>
        )}

        {!isAnalyzing && analysis && (
          <div className="space-y-6">
            {/* Score Overview */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Cleanliness Score</p>
                    <p className={`text-4xl font-bold ${getScoreColor(analysis.score)}`}>
                      {analysis.score}/100
                    </p>
                  </div>
                  <Badge variant={getScoreBadgeVariant(analysis.score)} className="text-lg px-4 py-2">
                    {analysis.score >= 80 ? "Excellent" : analysis.score >= 60 ? "Good" : "Fair"}
                  </Badge>
                </div>
                <Progress value={analysis.score} className="h-2" />
              </CardContent>
            </Card>

            {/* Summary */}
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Summary
                </h3>
                <p className="text-sm text-foreground">{analysis.summary}</p>
              </CardContent>
            </Card>

            {/* Improvement Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-8 w-8 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Improvement</p>
                      <p className="text-2xl font-bold text-foreground">
                        {analysis.improvement_percentage}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Waste Removed</p>
                    <p className="text-lg font-semibold text-foreground">
                      {analysis.waste_removed_estimate}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Before & After Assessment */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-2 text-destructive">Before Cleanup</h3>
                  <p className="text-sm text-muted-foreground">{analysis.before_assessment}</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-2 text-primary">After Cleanup</h3>
                  <p className="text-sm text-muted-foreground">{analysis.after_assessment}</p>
                </CardContent>
              </Card>
            </div>

            {/* Key Improvements */}
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Key Improvements
                </h3>
                <ul className="space-y-2">
                  {analysis.key_improvements.map((improvement, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-foreground">{improvement}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-accent" />
                  Recommendations
                </h3>
                <ul className="space-y-2">
                  {analysis.recommendations.map((recommendation, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <AlertCircle className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                      <span className="text-foreground">{recommendation}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
