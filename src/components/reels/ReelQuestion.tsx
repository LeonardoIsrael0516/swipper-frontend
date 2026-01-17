import { ReactNode } from 'react';

interface ReelQuestionOption {
  id: string;
  text: string;
  emoji?: string;
  onClick?: () => void;
}

interface ReelQuestionProps {
  question: string;
  options: ReelQuestionOption[];
  selectedOptionId?: string;
  onOptionSelect?: (optionId: string) => void;
  className?: string;
}

export function ReelQuestion({
  question,
  options,
  selectedOptionId,
  onOptionSelect,
  className = '',
}: ReelQuestionProps) {
  return (
    <div
      className={`absolute bottom-0 left-0 right-0 z-30 p-4 md:p-6 pb-8 md:pb-12 ${className}`}
    >
      {/* Question */}
      <div className="mb-6 animate-slide-up">
        <h2 className="text-2xl md:text-4xl font-display font-bold text-white text-center drop-shadow-lg mb-2">
          {question}
        </h2>
      </div>

      {/* Options */}
      <div className="space-y-3 max-w-lg mx-auto">
        {options.map((option, index) => {
          const isSelected = selectedOptionId === option.id;
          return (
            <button
              key={option.id}
              onClick={() => onOptionSelect?.(option.id)}
              className={`w-full p-4 md:p-5 rounded-2xl text-left transition-all duration-300 transform ${
                isSelected
                  ? 'bg-white text-gray-900 scale-105 shadow-2xl animate-bounce-in'
                  : 'bg-white/20 backdrop-blur-md text-white hover:bg-white/30 hover:scale-102 border border-white/20'
              } animate-slide-up`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center gap-4">
                {option.emoji && (
                  <span className="text-2xl md:text-3xl">{option.emoji}</span>
                )}
                <span className="text-base md:text-lg font-medium flex-1">
                  {option.text}
                </span>
                {isSelected && (
                  <span className="ml-auto">
                    <svg
                      className="w-6 h-6 text-green-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

