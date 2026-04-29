import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

function AnimatedChar({ char, index, total, scrollYProgress }) {
  const charProgress = index / total;
  const opacity = useTransform(
    scrollYProgress,
    [charProgress - 0.1, charProgress + 0.05],
    [0.2, 1]
  );
  return (
    <motion.span style={{ opacity }} className="inline-block whitespace-pre">
      {char}
    </motion.span>
  );
}

export default function AnimatedLetter({ text, className = '' }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start 0.8', 'end 0.2'],
  });

  const chars = text.split('');

  return (
    <span ref={ref} className={`inline ${className}`}>
      {chars.map((char, i) => (
        <AnimatedChar
          key={i}
          char={char}
          index={i}
          total={chars.length}
          scrollYProgress={scrollYProgress}
        />
      ))}
    </span>
  );
}
