import { Check } from 'lucide-react';

interface Benefit {
  text: string;
  icon?: React.ReactNode;
}

interface ReelBenefitsProps {
  benefits: Benefit[];
  className?: string;
}

export function ReelBenefits({ benefits, className = '' }: ReelBenefitsProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      {benefits.map((benefit, index) => (
        <div
          key={index}
          className="flex items-start gap-3 bg-white/10 backdrop-blur-sm rounded-xl p-4 animate-slide-up"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center mt-0.5">
            {benefit.icon || <Check className="w-4 h-4 text-white" />}
          </div>
          <p className="text-white font-medium flex-1">{benefit.text}</p>
        </div>
      ))}
    </div>
  );
}

