"use client";

import React, { useState } from "react";
import Image, { StaticImageData } from "next/image";
import styled from "styled-components";
import { GripVertical } from "lucide-react";
import * as ResizablePrimitive from "react-resizable-panels";
import { cn } from "../../lib/utils"; // Assurez-vous d'importer l'utilitaire cn

const Container = styled.div<{ height: string }>`
  position: relative;
  width: 50%;
  height: ${(props) => props.height};
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  user-select: none; /* Empêche la sélection de l'image */
`;

const ImageWrapper = styled.div<{ clipPath: string }>`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  clip-path: ${(props) => props.clipPath};
`;

const StyledImage = styled(Image)`
  object-fit: contain;
  width: 100%;
  height: 100%;
  max-width: 100%;
  max-height: 100%;
  user-select: none; /* Empêche la sélection de l'image */
  -webkit-user-drag: none; /* Désactive le glisser-déposer sur WebKit */
`;

const VerticalLine = styled.div<{ position: number }>`
  position: relative;
  top: 0;
  bottom: 0;
  width: 2px;
  background-color: #000;
  z-index: 10;
  left: ${(props) => props.position}%;
  transform: translateX(-50%);
`;

const ResizablePanelGroup = ({
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.PanelGroup>) => (
  <ResizablePrimitive.PanelGroup
    className={cn(
      "flex h-full w-full",
      className
    )}
    {...props}
  />
);

const ResizablePanel = ResizablePrimitive.Panel;

const ResizableHandle = ({
  withHandle,
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.PanelResizeHandle> & {
  withHandle?: boolean;
}) => (
  <ResizablePrimitive.PanelResizeHandle
    className={cn(
      "relative flex w-px items-center justify-center bg-border after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 data-[panel-group-direction=vertical]:h-px data-[panel-group-direction=vertical]:w-full data-[panel-group-direction=vertical]:after:left-0 data-[panel-group-direction=vertical]:after:h-1 data-[panel-group-direction=vertical]:after:w-full data-[panel-group-direction=vertical]:after:-translate-y-1/2 data-[panel-group-direction=vertical]:after:translate-x-0 [&[data-panel-group-direction=vertical]>div]:rotate-90",
      className
    )}
    {...props}
  >
    {withHandle && (
      <div className="z-10 flex h-4 w-3 items-center justify-center rounded-sm border bg-border">
        <GripVertical className="h-2.5 w-2.5" />
      </div>
    )}
  </ResizablePrimitive.PanelResizeHandle>
);

interface ImageSliderProps {
  image1: StaticImageData;
  image2: StaticImageData;
  height: string;
  className?: string;
}

const ImageSlider: React.FC<ImageSliderProps> = ({ image1, image2, height, className }) => {
  const [sliderPosition, setSliderPosition] = useState(50);

  const handleResize = (sizes: number[]) => {
    const totalSize = sizes.reduce((a, b) => a + b, 0);
    setSliderPosition((sizes[0] / totalSize) * 100);
  };

  return (
    <Container className={className} height={height}>
      <ImageWrapper clipPath={`inset(0 0 0 ${sliderPosition}%)`}>
        <StyledImage src={image1} alt="Image 1" layout="responsive" />
      </ImageWrapper>
      <ImageWrapper clipPath={`inset(0 ${100 - sliderPosition}% 0 0)`}>
        <StyledImage src={image2} alt="Image 2" layout="responsive" />
      </ImageWrapper>
      <VerticalLine position={sliderPosition} />
      <ResizablePanelGroup
        direction="horizontal"
        onLayout={handleResize}
      >
        <ResizablePanel minSize={10}>
          <div />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel minSize={10}>
          <div />
        </ResizablePanel>
      </ResizablePanelGroup>
    </Container>
  );
};

export { ImageSlider };
