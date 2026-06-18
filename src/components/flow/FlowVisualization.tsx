import { cn } from '@/lib/utils';

interface FlowStep {
  id: string;
  label: string;
  icon: React.ReactNode;
  active: boolean;
  done: boolean;
}

interface FlowVisualizationProps {
  steps: FlowStep[];
  className?: string;
}

export function FlowVisualization({ steps, className }: FlowVisualizationProps) {
  if (!steps || steps.length === 0) return null;

  return (
    <div className={cn('flex items-center justify-center gap-0', className)}>
      {steps.map((step, i) => (
        <div key={step.id} className="flex items-center">
          {/* Step node */}
          <div className="flex flex-col items-center gap-1.5">
            <div
              className={cn(
                'h-9 w-9 rounded-full flex items-center justify-center transition-all duration-500 ease-out',
                step.done && 'bg-primary text-primary-foreground scale-90',
                step.active && 'bg-primary text-primary-foreground ring-4 ring-primary/20 scale-110',
                !step.active && !step.done && 'bg-muted text-muted-foreground',
              )}
            >
              {step.icon}
            </div>
            <span
              className={cn(
                'text-[10px] font-medium transition-colors duration-300',
                (step.active || step.done) ? 'text-primary' : 'text-muted-foreground',
              )}
            >
              {step.label}
            </span>
          </div>

          {/* Connector line */}
          {i < steps.length - 1 && (
            <div className="relative w-8 sm:w-12 h-[2px] mx-1">
              <div className="absolute inset-0 bg-border rounded-full" />
              <div
                className={cn(
                  'absolute inset-y-0 left-0 bg-primary rounded-full transition-all duration-700 ease-out',
                  step.done ? 'w-full' : 'w-0',
                )}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
