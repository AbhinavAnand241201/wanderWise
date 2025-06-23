import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Image from "next/image";

const CardStack = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.1 });

  const cards = [
    {
      id: 1,
      title: "Adventure Awaits",
      image: "/images/yousef-alfuhigi-bMIlyKZHKMY-unsplash.jpg",
      rotate: -5,
      translateX: -30,
      translateY: -10,
      zIndex: 10
    },
    {
      id: 2,
      title: "Mountain Escape",
      image: "/images/luca-bravo-O453M2Liufs-unsplash.jpg",
      rotate: -2,
      translateX: -10,
      translateY: -5,
      zIndex: 20
    },
    {
      id: 3,
      title: "City Lights",
      image: "/images/ian-dooley-hpTH5b6mo2s-unsplash.jpg",
      rotate: 3,
      translateX: 10,
      translateY: 5,
      zIndex: 30
    },
    {
      id: 4,
      title: "Desert Journey",
      image: "/images/fabio-comparelli-uq2E2V4LhCY-unsplash.jpg",
      rotate: 0,
      translateX: 30,
      translateY: 10,
      zIndex: 40
    }
  ];

  return (
    <div 
      ref={containerRef}
      className="relative min-h-screen w-full overflow-hidden bg-gradient-to-b from-background to-muted/20"
    >
      {/* Cards Container - Positioned absolutely and centered */}
      <div className="absolute left-1/2 top-1/2 z-10 h-[70vh] w-full max-w-5xl -translate-x-1/2 -translate-y-1/2">
        {cards.map((card, index) => (
          <motion.div
            key={card.id}
            className={`absolute left-1/2 top-1/2 h-[250px] w-[200px] md:h-[300px] md:w-[250px]`}
            style={{
              zIndex: card.zIndex,
              transform: `translate(-50%, -50%) rotate(${card.rotate}deg)`,
              transformOrigin: 'center center',
              perspective: '1000px',
              transformStyle: 'preserve-3d',
            }}
            initial={{
              opacity: 0,
              y: 100,
              rotate: card.rotate - 30,
              scale: 0.8,
            }}
            animate={isInView ? {
              opacity: 1,
              y: card.translateY,
              x: card.translateX * 2,
              rotate: card.rotate,
              scale: 1,
              transition: {
                delay: index * 0.1,
                type: 'spring',
                stiffness: 50,
                damping: 10
              }
            } : {}}
            whileHover={{
              zIndex: 50,
              scale: 1.05,
              transition: { duration: 0.2 }
            }}
          >
            <div className="relative h-full w-full overflow-hidden rounded-2xl shadow-2xl">
              <Image
                src={card.image}
                alt={card.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                <h3 className="text-xl font-bold">{card.title}</h3>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Hero Content - Positioned above cards with higher z-index */}
      <div className="relative z-20 flex h-screen w-full items-center justify-center px-4 text-center">
        <div className="max-w-4xl">
          <motion.h1 
            className="mb-6 text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            Discover Your Next Adventure
          </motion.h1>
          <motion.p 
            className="mb-8 text-lg text-muted-foreground md:text-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            Plan your perfect trip with our AI-powered travel assistant
          </motion.p>
        </div>
      </div>
    </div>
  );
};

export default CardStack;
