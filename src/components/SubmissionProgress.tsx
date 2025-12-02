import { Check, Loader2, MapPin, Upload, Save } from 'lucide-react';

interface SubmissionProgressProps {
  currentStep: 'location' | 'uploading' | 'saving' | 'complete' | null;
}

const SubmissionProgress = ({ currentStep }: SubmissionProgressProps) => {
  if (!currentStep) return null;

  const steps = [
    { id: 'location', label: 'Capturing Location', icon: MapPin },
    { id: 'uploading', label: 'Uploading Image', icon: Upload },
    { id: 'saving', label: 'Saving Report', icon: Save },
  ];

  const getStepStatus = (stepId: string) => {
    if (currentStep === 'complete') return 'complete';
    
    const currentIndex = steps.findIndex(s => s.id === currentStep);
    const stepIndex = steps.findIndex(s => s.id === stepId);
    
    if (stepIndex < currentIndex) return 'complete';
    if (stepIndex === currentIndex) return 'active';
    return 'pending';
  };

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-card rounded-lg shadow-lg p-6 max-w-md w-full border border-border animate-scale-in">
        <h3 className="text-lg font-semibold text-foreground mb-6 text-center">
          Submitting Your Report
        </h3>
        
        <div className="space-y-4">
          {steps.map((step, index) => {
            const status = getStepStatus(step.id);
            const Icon = step.icon;
            
            return (
              <div key={step.id} className="flex items-center gap-4">
                {/* Step Icon */}
                <div
                  className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                    status === 'complete'
                      ? 'bg-primary text-primary-foreground'
                      : status === 'active'
                      ? 'bg-primary/20 text-primary border-2 border-primary'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {status === 'complete' ? (
                    <Check className="h-5 w-5" />
                  ) : status === 'active' ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
                </div>

                {/* Step Label */}
                <div className="flex-1">
                  <p
                    className={`font-medium transition-colors duration-300 ${
                      status === 'active'
                        ? 'text-foreground'
                        : status === 'complete'
                        ? 'text-muted-foreground'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {step.label}
                  </p>
                </div>

                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div className="absolute left-[33px] w-0.5 h-8 mt-14 transition-colors duration-300" 
                    style={{
                      backgroundColor: status === 'complete' ? 'hsl(var(--primary))' : 'hsl(var(--muted))',
                      transform: `translateY(${index * 64}px)`
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>

        {currentStep === 'complete' && (
          <div className="mt-6 p-4 bg-primary/10 rounded-lg border border-primary/20 animate-fade-in">
            <p className="text-sm text-center text-foreground font-medium">
              Report submitted successfully! Redirecting...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubmissionProgress;
