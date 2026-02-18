import React, { useRef, useEffect, useState } from 'react';
import { BeforeAfterSlider } from "./beforeAfterSlider";

interface BeforeAfterSliderWrapperProps {
  firstImage: { imageUrl: string; alt: string };
  secondImage: { imageUrl: string; alt: string };
  className?: string;
}

export const BeforeAfterSliderWrapper: React.FC<BeforeAfterSliderWrapperProps> = ({ firstImage, secondImage, className }) => {
  const sliderRef = useRef<HTMLDivElement>(null);
  const [, setForceUpdate] = useState({});

  useEffect(() => {
    const forceUpdate = () => setForceUpdate({});

    // Force update every second
    const intervalId = setInterval(forceUpdate, 1000);

    // Force update on window resize
    window.addEventListener('resize', forceUpdate);

    // Force update on mouse move over the slider
    const handleMouseMove = () => {
      if (sliderRef.current) {
        const event = new MouseEvent('mousemove', {
          view: window,
          bubbles: true,
          cancelable: true
        });
        sliderRef.current.dispatchEvent(event);
      }
    };

    if (sliderRef.current) {
      sliderRef.current.addEventListener('mousemove', handleMouseMove);
    }

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('resize', forceUpdate);
      if (sliderRef.current) {
        sliderRef.current.removeEventListener('mousemove', handleMouseMove);
      }
    };
  }, []);

  return (
    <div ref={sliderRef}>
      <BeforeAfterSlider
        firstImage={firstImage}
        secondImage={secondImage}
        className={className}
      />
    </div>
  );
};
