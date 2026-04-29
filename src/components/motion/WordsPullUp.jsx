import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

export default function WordsPullUp({ text, className = '', showAsterisk = false }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const words = text.split(' ');

  return (
    <span ref={ref} className={`inline-flex flex-wrap gap-x-[0.3em] ${className}`}>
      {words.map((word, i) => {
        const isLast = i === words.length - 1;
        return (
          <span key={i} className="overflow-hidden inline-block">
            <motion.span
              className="inline-block"
              initial={{ y: 20, opacity: 0 }}
              animate={isInView ? { y: 0, opacity: 1 } : { y: 20, opacity: 0 }}
              transition={{ duration: 0.45, delay: i * 0.08, ease: 'easeOut' }}
            >
              {word}
              {showAsterisk && isLast && <sup className="text-[0.4em] ml-0.5">*</sup>}
            </motion.span>
          </span>
        );
      })}
    </span>
  );
}
