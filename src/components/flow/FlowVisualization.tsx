import { cn } from '@/lib/utils';

interface FlowStep {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
  color: 'sui' | 'yield' | 'guardian' | 'trepa' | 'warning';
}

const flowSteps: FlowStep[] = [
  {
    id: 'intent',
    label: 'Intent',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
    description: 'Describe your financial goal in plain English',
    color: 'sui',
  },
  {
    id: 'ptb',
    label: 'PTB',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    ),
    description: 'Compile strategy into a Programmable Transaction Block',
    color: 'trepa',
  },
  {
    id: 'guardian',
    label: 'Guardian',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    description: 'Analyze risks: slippage, concentration, stale pools',
    color: 'guardian',
  },
  {
    id: 'confirm',
    label: 'Confirm',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
    description: 'Review plan and risks, then approve or cancel',
    color: 'yield',
  },
  {
    id: 'execute',
    label: 'Execute',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
    description: 'Sign and execute the PTB on-chain',
    color: 'sui',
  },
  {
    id: 'treasury',
    label: 'Treasury',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      </svg>
    ),
    description: 'Yield flows into protected treasury, funding future operations',
    color: 'yield',
  },
];

const colorMap = {
  sui: {
    bg: 'bg-sui/10',
    border: 'border-sui/30',
    text: 'text-sui',
    glow: 'shadow-[0_0_15px_hsl(199_89%_48%/0.2)]',
    dot: 'bg-sui',
  },
  yield: {
    bg: 'bg-yield/10',
    border: 'border-yield/30',
    text: 'text-yield',
    glow: 'shadow-[0_0_15px_hsl(160_84%_39%/0.2)]',
    dot: 'bg-yield',
  },
  guardian: {
    bg: 'bg-guardian/10',
    border: 'border-guardian/30',
    text: 'text-guardian',
    glow: 'shadow-[0_0_15px_hsl(43_90%_50%/0.2)]',
    dot: 'bg-guardian',
  },
  trepa: {
    bg: 'bg-trepa/10',
    border: 'border-trepa/30',
    text: 'text-trepa',
    glow: 'shadow-[0_0_15px_hsl(260_70%_60%/0.2)]',
    dot: 'bg-trepa',
  },
  warning: {
    bg: 'bg-warning/10',
    border: 'border-warning/30',
    text: 'text-warning',
    glow: 'shadow-[0_0_15px_hsl(25_95%_53%/0.2)]',
    dot: 'bg-warning',
  },
};

interface FlowVisualizationProps {
  className?: string;
  activeStep?: string | null;
  compact?: boolean;
}

export function FlowVisualization({ className, activeStep, compact }: FlowVisualizationProps) {
  return (
    <div className={cn('relative', className)}>
      {/* Desktop flow */}
      <div className={cn('hidden md:flex items-center justify-between gap-2', compact && 'gap-1')}>
        {flowSteps.map((step, index) => {
          const colors = colorMap[step.color];
          const isActive = activeStep === step.id;
          const isPast = activeStep ? flowSteps.findIndex(s => s.id === activeStep) > index : false;

          return (
            <div key={step.id} className="flex items-center gap-2 flex-1">
              <div
                className={cn(
                  'flex flex-col items-center gap-2 rounded-xl p-3 transition-all duration-300 border',
                  compact ? 'p-2 min-w-[80px]' : 'p-4 min-w-[120px]',
                  colors.bg,
                  colors.border,
                  isActive && colors.glow,
                  isActive && 'scale-105',
                  isPast && 'opacity-60',
                )}
              >
                <div className={cn(
                  'h-10 w-10 rounded-lg flex items-center justify-center',
                  compact ? 'h-7 w-7' : 'h-10 w-10',
                  isActive ? `gradient-sui text-white` : `${colors.bg} ${colors.text}`,
                )}>
                  {step.icon}
                </div>
                <span className={cn(
                  'font-display font-semibold text-xs whitespace-nowrap',
                  colors.text,
                  compact ? 'text-[10px]' : 'text-xs',
                )}>
                  {step.label}
                </span>
                {!compact && (
                  <span className="text-muted-foreground text-[10px] text-center leading-tight max-w-[100px]">
                    {step.description}
                  </span>
                )}
              </div>
              {index < flowSteps.length - 1 && (
                <div className="flex items-center justify-center flex-shrink-0">
                  <div className={cn(
                    'h-[2px] w-6 rounded-full',
                    isPast ? 'bg-yield' : 'bg-muted-foreground/30',
                  )} />
                  <svg className={cn('h-3 w-3', isPast ? 'text-yield' : 'text-muted-foreground/30')} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile flow - vertical */}
      <div className="md:hidden flex flex-col items-center gap-0">
        {flowSteps.map((step, index) => {
          const colors = colorMap[step.color];
          const isActive = activeStep === step.id;
          const isPast = activeStep ? flowSteps.findIndex(s => s.id === activeStep) > index : false;

          return (
            <div key={step.id} className="flex flex-col items-center">
              <div
                className={cn(
                  'flex items-center gap-3 rounded-lg px-4 py-2.5 transition-all duration-300 border w-full max-w-[280px]',
                  colors.bg,
                  colors.border,
                  isActive && colors.glow,
                  isPast && 'opacity-60',
                )}
              >
                <div className={cn(
                  'h-8 w-8 rounded-md flex items-center justify-center',
                  isActive ? `gradient-sui text-white` : `${colors.bg} ${colors.text}`,
                )}>
                  {step.icon}
                </div>
                <div className="flex flex-col">
                  <span className={cn('font-display font-semibold text-xs', colors.text)}>
                    {step.label}
                  </span>
                  <span className="text-muted-foreground text-[10px] leading-tight">
                    {step.description}
                  </span>
                </div>
              </div>
              {index < flowSteps.length - 1 && (
                <div className={cn(
                  'w-[2px] h-4 my-1 rounded-full',
                  isPast ? 'bg-yield' : 'bg-muted-foreground/20',
                )} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
