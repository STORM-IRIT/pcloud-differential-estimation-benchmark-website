"use client";
import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "../lib/utils";
import { interpolateRgbBasis, scaleSequential } from 'd3';
import { normalize } from "path";

const colorMapError = ["#440154", "#39568C", "#238A8D", "#1F968B", "#55C667", "#FDE725"];
const colorMapEstim = ["#3b4cc0", "#7396f5", "white", "#f7816d", "#b40426"];

function createClampedGradient(colors: string[], min: number, max: number, vmin: number, vmax: number) {
  const scale = scaleSequential(interpolateRgbBasis(colors)).domain([min, max]);
  const steps = 30;
  const gradientParts: string[] = [];

  vmin = ( vmin - min) / (max - min);
  vmax = ( vmax - min) / (max - min);
  vmin = Math.max(0, Math.min(1, vmin));
  vmax = Math.max(0, Math.min(1, vmax));

  if (vmin > 0) {
    gradientParts.push(
      `${scale(min)} ${(vmin) * 100}%`,
      `${scale(min)} 0%`,
    );
  }

  for (let i = 0; i <= steps; i++) {
    const stepSize = i / steps;
    const val = min + stepSize * (max - min);
    const pct = ((vmin + stepSize * (vmax - vmin)) * 100);
    gradientParts.push(`${scale(val)} ${pct}%`);
  }

  if (vmax < 1) {
    gradientParts.push(
      `${scale(max)} ${(vmax) * 100}%`,
      `${scale(max)} 100%`
    );
  }

  return `linear-gradient(to right, ${gradientParts.join(", ")})`;
}

const DoubleSlider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> & {
    displayError?: boolean;
    onDoubleClick?: () => void;
  }
>(({ className, defaultValue, min = 0, max = 1, step = 0.01, value=[0, 10], displayError=false, onDoubleClick, ...props }, ref) => {
  
  const [values, setValues] = React.useState(value || [min, max]);

  const handleDoubleClick = () => {
    if (onDoubleClick) {
      onDoubleClick();
    } else {
      setValues([min, max]);
    }
  };

  const displayErrorBar = () => {
    if (displayError) {
      return (
        <div onDoubleClick={handleDoubleClick}>
        {/* <h1 className="text-sm font-medium text-muted-foreground">Squared Error</h1> */}
        <div className="relative h-5 rounded overflow-hidden">
          <div
            className="absolute h-full w-full"
            style={{
              backgroundImage: createClampedGradient(colorMapError, min, max, value[0], value[1]),
            }}
          />
        </div>
      </div>
      );
    };
  };

  const displayEstimationBar = () => {
    if ( ! displayError ) {
      return (
        <div onDoubleClick={handleDoubleClick}>
          {/* <div className="text-sm font-medium text-muted-foreground mb-1">Estimation (absolute)</div> */}
          <div className="relative h-5 rounded overflow-hidden">
            <div
              className="absolute h-full w-full"
              style={{
                backgroundImage: createClampedGradient(colorMapEstim, min, max, value[0], value[1]),
              }}
            />
          </div>
        </div>
      );
    };
  };

  return (
    <div className="relative w-full space-y-1"
      onDoubleClick={handleDoubleClick}
      >
      {displayErrorBar()}
      {displayEstimationBar()}
      <SliderPrimitive.Root
        ref={ref}
        className={cn("relative z-10 flex w-full touch-none select-none items-center", className)}
        min={min}
        max={max}
        step={step}
        value={value}
        onValueChange={setValues}
        {...props}
      >
        <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-muted">
          <SliderPrimitive.Range className="absolute h-full bg-primary" />
        </SliderPrimitive.Track>
        {value.map((_, idx) => (
          <SliderPrimitive.Thumb
            key={idx}
            className="block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
          />
        ))}
      </SliderPrimitive.Root>

      <div className="flex justify-between text-xs font-medium text-muted-foreground">
      <div className="absolute text-xs font-medium left-1 truncate"> {/* Réduit la taille et empêche le débordement */}
        {value[0].toFixed(2)}
      </div>
      <div className="absolute text-xs font-medium right-1 truncate"> {/* Réduit la taille et empêche le débordement */}
        {value[1].toFixed(2)}
      </div>
      <div className="absolute text-xs font-medium left-1/2 transform -translate-x-1/2 truncate text-center"> {/* Centré et réduit */}
        {displayError ? "Absolute Error" : "Absolute Estimation"}
      </div>
    </div>

            
      
    </div>
  );
});

DoubleSlider.displayName = "DoubleSlider";

export { DoubleSlider };