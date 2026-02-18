"use client";

import React, { MouseEventHandler, TouchEventHandler, useEffect, useRef, useState } from 'react';
import { GripVertical } from 'lucide-react';
import { cn } from "../../lib/utils";
import { useTheme } from "next-themes";

interface Image {
    imageUrl: string;
    alt?: string;
}

interface Props {
    firstImage: Image;
    secondImage: Image;
    currentPercentPosition?: number;
    className?: string;
}

const BeforeAfterSlider: React.FC<Props> = ({
    firstImage,
    secondImage,
    currentPercentPosition = 50,
    className,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [delimiterPosition, setDelimiterPosition] = useState(currentPercentPosition);
    const [isDragging, setIsDragging] = useState(false);
    const [containerWidth, setContainerWidth] = useState<number | null>(null);
    const { theme, systemTheme } = useTheme();

    const currentTheme = theme === 'system' ? systemTheme : theme;

    useEffect(() => {
        const updateContainerWidth = () => {
            if (containerRef.current) {
                setContainerWidth(containerRef.current.offsetWidth);
            }
        };

        updateContainerWidth();
        window.addEventListener('resize', updateContainerWidth);
        return () => window.removeEventListener('resize', updateContainerWidth);
    }, []);

    const handleMouseDown = () => {
        setIsDragging(true);
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleMove = (clientX: number) => {
        if (containerWidth) {
            const newLeft = clientX - containerRef.current!.getBoundingClientRect().left;
            const newPosition = (newLeft / containerWidth) * 100;
            setDelimiterPosition(Math.max(0, Math.min(newPosition, 100)));
        }
    };

    const handleMouseMove: MouseEventHandler<HTMLDivElement> = (e) => {
        if (isDragging) handleMove(e.clientX);
    };

    const handleTouchMove: TouchEventHandler<HTMLDivElement> = (e) => {
        if (isDragging) handleMove(e.touches[0].clientX);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowLeft') {
            setDelimiterPosition(prev => Math.max(0, prev - 1));
        } else if (e.key === 'ArrowRight') {
            setDelimiterPosition(prev => Math.min(100, prev + 1));
        }
    };

    return (
        <div
            ref={containerRef}
            className={cn(
                "relative w-full max-w-3xl mx-auto aspect-square overflow-hidden select-none",
                className
            )}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleMouseUp}
        >
            <div className="absolute inset-0">
                <div 
                    className="absolute inset-0 overflow-hidden"
                    style={{clipPath: `inset(0 ${100 - delimiterPosition}% 0 0)`}}
                > 
                <p className="absolute p-2 top-0 left-0 font-bold text-1xl muted text-muted-foreground"> {firstImage.alt} </p>
                <img src={firstImage.imageUrl} alt={firstImage.alt} className="absolute inset-0 w-full h-full object-contain" />
                </div>
                <div 
                    className="absolute inset-0 overflow-hidden"
                    style={{clipPath: `inset(0 0 0 ${delimiterPosition}%)`}}
                >
                <p className="absolute p-2 top-0 right-0 font-bold text-1xl muted text-muted-foreground"> {secondImage.alt} </p>
                <img src={secondImage.imageUrl} alt={secondImage.alt} className="absolute inset-0 w-full h-full object-contain" />
                </div>
                <div
                    className={cn(
                        "absolute top-0 bottom-0 w-0.5 cursor-ew-resize transform -translate-x-1/2",
                        "flex items-center justify-center",
                        "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50"
                    )}
                    style={{
                        left: `${delimiterPosition}%`,
                        backgroundColor: currentTheme === 'dark' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                    }}
                    onMouseDown={handleMouseDown}
                    onTouchStart={handleMouseDown}
                    tabIndex={0}
                    role="slider"
                    aria-valuenow={delimiterPosition}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    onKeyDown={handleKeyDown}
                >
                    <div className="absolute p-2 rounded-full bg-primary shadow-lg" style={{
                        backgroundColor: currentTheme === 'dark' ? 'white' : 'black',
                    }}>
                        <GripVertical 
                            className="text-primary" 
                            size={24}
                            style={{
                                color: currentTheme === 'dark' ? 'black' : 'white',
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export { BeforeAfterSlider };