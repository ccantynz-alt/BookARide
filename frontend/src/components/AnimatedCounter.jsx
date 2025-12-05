import React from 'react';
import CountUp from 'react-countup';
import { useInView } from 'react-intersection-observer';

export const AnimatedCounter = ({ end, duration = 2, suffix = '', prefix = '', decimals = 0 }) => {
  const { ref, inView } = useInView({
    threshold: 0.3,
    triggerOnce: true
  });

  return (
    <span ref={ref}>
      {inView && (
        <CountUp
          end={end}
          duration={duration}
          suffix={suffix}
          prefix={prefix}
          decimals={decimals}
          separator=","
        />
      )}
    </span>
  );
};