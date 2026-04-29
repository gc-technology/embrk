import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

export default function WordsPullUpMultiStyle({ segments = [], className = '' }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  const words = segments.flatMap(({ text, className: cls }) =>
    text.split(' ').filter(Boolean).map((word) => ({ word, cls }))
  );

  return (
    <span ref={ref} className={`inline-flex flex-wrap gap-x-[0.3em] ${className}`}>
      {words.map(({ word, cls }, i) => (
        <span key={i} className="overflow-hidden inline-block">
          <motion.span
            className={`inline-block ${cls}`}
            initial={{ y: 20, opacity: 0 }}
            animate={isInView ? { y: 0, opacity: 1 } : { y: 20, opacity: 0 }}
            transition={{ duration: 0.45, delay: i * 0.08, ease: 'easeOut' }}
          >
            {word}
          </motion.span>
        </span>
      ))}
    </span>
  );
}
