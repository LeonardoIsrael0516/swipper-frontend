import { useEffect, useRef } from 'react';

const brands = [
  { name: 'Kiwify', logo: '/brands/kiwify.svg' },
  { name: 'Hotmart', logo: '/brands/hotmart.svg' },
  { name: 'Eduzz', logo: '/brands/eduzz.svg' },
  { name: 'Monetizze', logo: '/brands/monetizze.svg' },
  { name: 'PerfectPay', logo: '/brands/perfectpay.svg' },
  { name: 'Ticto', logo: '/brands/ticto.svg' },
  { name: 'LastLink', logo: '/brands/lastlink.svg' },
  { name: 'Kirvano', logo: '/brands/kirvano.svg' },
];

// Duplicar para scroll infinito
const duplicatedBrands = [...brands, ...brands, ...brands];

export function BrandCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    let scrollPosition = 0;
    const scrollSpeed = 0.5; // Velocidade do scroll
    let animationFrameId: number;

    const scroll = () => {
      scrollPosition += scrollSpeed;
      
      // Reset quando chegar ao final (largura de uma duplicação)
      if (scrollPosition >= scrollContainer.scrollWidth / 3) {
        scrollPosition = 0;
      }
      
      scrollContainer.scrollLeft = scrollPosition;
      animationFrameId = requestAnimationFrame(scroll);
    };

    animationFrameId = requestAnimationFrame(scroll);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);

  return (
    <div className="relative w-full overflow-hidden">
      {/* Fade gradients */}
      <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

      {/* Carousel */}
      <div
        ref={scrollRef}
        className="flex gap-12 items-center py-8 overflow-x-hidden will-change-scroll"
        style={{ scrollBehavior: 'auto' }}
      >
        {duplicatedBrands.map((brand, index) => (
          <div
            key={`${brand.name}-${index}`}
            className="flex-shrink-0 flex items-center justify-center opacity-60 hover:opacity-100 transition-opacity duration-300"
          >
            {/* Placeholder para logo - usar texto por enquanto */}
            <div className="px-8 py-4 glass-card rounded-xl border border-border/50 min-w-[180px] flex items-center justify-center">
              <span className="text-lg font-semibold text-muted-foreground">
                {brand.name}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

