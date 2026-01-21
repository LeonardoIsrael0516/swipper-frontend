import { useState } from 'react';
import { ChevronDown, Heart, MessageCircle, Share2, UserPlus } from 'lucide-react';

// Mock data para preview do swipper
const mockSlides = [
  {
    id: '1',
    question: 'Qual é o seu maior objetivo?',
    options: [
      { id: '1', text: '💰 Aumentar vendas', emoji: '💰' },
      { id: '2', text: '📈 Gerar mais leads', emoji: '📈' },
      { id: '3', text: '🎯 Engajar audiência', emoji: '🎯' },
    ],
  },
  {
    id: '2',
    question: 'Qual plataforma você usa?',
    options: [
      { id: '1', text: 'Kiwify', emoji: '🛒' },
      { id: '2', text: 'Hotmart', emoji: '🔥' },
      { id: '3', text: 'Eduzz', emoji: '📚' },
    ],
  },
];

export function SwipperPreview() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [likes, setLikes] = useState(1247);
  const [comments, setComments] = useState(89);

  const slide = mockSlides[currentSlide];
  const isLastSlide = currentSlide === mockSlides.length - 1;

  const handleOptionClick = (optionId: string) => {
    setSelectedOption(optionId);
    setTimeout(() => {
      if (!isLastSlide) {
        setCurrentSlide((prev) => prev + 1);
        setSelectedOption(null);
      } else {
        // Reset para loop infinito
        setCurrentSlide(0);
        setSelectedOption(null);
      }
    }, 800);
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikes((prev) => (isLiked ? prev - 1 : prev + 1));
  };

  const handleComment = () => {
    setComments((prev) => prev + 1);
  };

  const handleShare = () => {
    // Fake share action
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className="relative w-full max-w-sm mx-auto">
      {/* Phone Frame */}
      <div className="relative mx-auto w-[320px] h-[640px] rounded-[3rem] bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-3 shadow-2xl">
        {/* Notch */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 w-32 h-7 bg-black rounded-full z-10" />
        
        {/* Screen */}
        <div className="w-full h-full rounded-[2.5rem] overflow-hidden bg-gradient-to-br from-gray-950 to-gray-900 relative">
          {/* Progress Bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gray-800 z-20">
            <div
              className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-500"
              style={{ width: `${((currentSlide + 1) / mockSlides.length) * 100}%` }}
            />
          </div>

          {/* Content */}
          <div className="w-full h-full flex flex-col items-center justify-center p-6 pt-12">
            {/* Slide Counter */}
            <div className="absolute top-16 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm text-white text-xs font-medium">
              {currentSlide + 1} de {mockSlides.length}
            </div>

            {/* Question */}
            <h3 className="text-xl font-bold text-white text-center mb-8 mt-8">
              {slide.question}
            </h3>

            {/* Options */}
            <div className="w-full space-y-3">
              {slide.options.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleOptionClick(option.id)}
                  disabled={selectedOption !== null}
                  className={`w-full p-4 rounded-xl text-sm font-medium transition-all duration-300 ${
                    selectedOption === option.id
                      ? 'bg-white text-gray-900 scale-105'
                      : selectedOption !== null
                      ? 'bg-white/10 text-white/50'
                      : 'bg-white/10 text-white hover:bg-white/20 hover:scale-[1.02]'
                  }`}
                >
                  <span className="mr-2">{option.emoji}</span>
                  {option.text}
                </button>
              ))}
            </div>

            {/* Swipe Hint */}
            {!selectedOption && (
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center text-white/40 animate-bounce">
                <span className="text-xs mb-1">Deslize</span>
                <ChevronDown className="w-4 h-4" />
              </div>
            )}

            {/* Social Actions - Right Side */}
            <div className="absolute right-3 bottom-32 flex flex-col gap-3 z-30">
              {/* Avatar */}
              <div className="flex flex-col items-center">
                <div className="relative">
                  <div className="w-[34px] h-[34px] rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center border-2 border-white overflow-hidden">
                    <div className="w-full h-full bg-gray-300" />
                  </div>
                  <button className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-red-500 border-2 border-white flex items-center justify-center hover:bg-red-600 transition-colors">
                    <UserPlus className="w-2 h-2 text-white drop-shadow-sm" />
                  </button>
                </div>
              </div>

              {/* Like Button */}
              <button
                onClick={handleLike}
                className="flex flex-col items-center text-white group transition-all duration-200"
              >
                <div
                  className={`w-[34px] h-[34px] rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center hover:bg-black/60 transition-all duration-200 ${
                    isLiked ? 'scale-110' : ''
                  }`}
                >
                  <Heart
                    className={`w-[17px] h-[17px] transition-colors drop-shadow-md ${
                      isLiked ? 'text-red-500 fill-red-500' : 'text-white'
                    }`}
                    fill={isLiked ? 'currentColor' : 'none'}
                  />
                </div>
                <span className="text-[8.5px] mt-0.5 font-medium text-white drop-shadow-md">
                  {formatNumber(likes)}
                </span>
              </button>

              {/* Comment Button */}
              <button
                onClick={handleComment}
                className="flex flex-col items-center text-white group transition-all duration-200"
              >
                <div className="w-[34px] h-[34px] rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center hover:bg-black/60 transition-all duration-200 group-hover:scale-105">
                  <MessageCircle className="w-[17px] h-[17px] text-white drop-shadow-md" />
                </div>
                <span className="text-[8.5px] mt-0.5 font-medium text-white drop-shadow-md">
                  {formatNumber(comments)}
                </span>
              </button>

              {/* Share Button */}
              <button
                onClick={handleShare}
                className="flex flex-col items-center text-white group transition-all duration-200"
              >
                <div className="w-[34px] h-[34px] rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center hover:bg-black/60 transition-all duration-200 group-hover:scale-105">
                  <Share2 className="w-[17px] h-[17px] text-white drop-shadow-md" />
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Stats */}
      <div className="absolute -left-8 top-1/4 hidden lg:block">
        <div className="glass-card rounded-2xl p-4 w-40 animate-float">
          <div className="text-xs text-muted-foreground mb-1">Taxa de Conclusão</div>
          <div className="text-2xl font-bold gradient-text">78%</div>
        </div>
      </div>

      <div className="absolute -right-8 top-1/3 hidden lg:block">
        <div className="glass-card rounded-2xl p-4 w-40 animate-float" style={{ animationDelay: '1s' }}>
          <div className="text-xs text-muted-foreground mb-1">Engajamento</div>
          <div className="text-2xl font-bold text-primary">3.2x</div>
        </div>
      </div>
    </div>
  );
}

