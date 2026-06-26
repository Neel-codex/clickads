'use client';

import { motion } from 'framer-motion';
import { BrainCircuit } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AiBrainLogoProps {
  /** Pixel size of the logo. */
  size?: number;
  /** When true, plays the faster "analyzing" animation (orbiting synapses + scan). */
  thinking?: boolean;
  className?: string;
}

/**
 * Animated AI brain logo.
 * - Idle: gentle breathing glow + slow synapse twinkle.
 * - Thinking: faster pulse, rotating dashed ring, and orbiting synapse dots.
 */
export function AiBrainLogo({ size = 40, thinking = false, className }: AiBrainLogoProps) {
  const ring = size * 1.05;

  return (
    <div
      className={cn('relative grid place-items-center', className)}
      style={{ width: size, height: size }}
      aria-hidden
    >
      {/* Outer glow */}
      <motion.span
        className="absolute inset-0 rounded-full bg-brand-gradient blur-md"
        animate={{
          opacity: thinking ? [0.5, 0.95, 0.5] : [0.3, 0.55, 0.3],
          scale: thinking ? [1, 1.15, 1] : [1, 1.06, 1],
        }}
        transition={{ duration: thinking ? 1 : 2.6, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Rotating dashed ring (only while thinking) */}
      {thinking && (
        <motion.span
          className="absolute rounded-full border border-dashed border-white/40"
          style={{ width: ring, height: ring }}
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        />
      )}

      {/* Orbiting synapse dots */}
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="absolute left-1/2 top-1/2 size-1.5 rounded-full bg-white shadow-[0_0_6px_white]"
          animate={{ rotate: 360 }}
          transition={{
            duration: thinking ? 1.6 + i * 0.4 : 5 + i,
            repeat: Infinity,
            ease: 'linear',
          }}
          style={{
            marginLeft: -3,
            marginTop: -3,
            transformOrigin: `3px ${ring / 2}px`,
            opacity: thinking ? 0.9 : 0.4,
          }}
        />
      ))}

      {/* Brain core */}
      <motion.div
        className="relative grid place-items-center rounded-full bg-brand-gradient shadow-lg shadow-primary/30"
        style={{ width: size, height: size }}
        animate={thinking ? { scale: [1, 1.08, 1] } : { scale: 1 }}
        transition={{ duration: 0.9, repeat: thinking ? Infinity : 0, ease: 'easeInOut' }}
      >
        <BrainCircuit className="text-white" style={{ width: size * 0.58, height: size * 0.58 }} />
      </motion.div>
    </div>
  );
}
