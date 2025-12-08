import React, { useRef, useState } from 'react';
import { PinPosition } from '../types';
import { MousePointer2 } from 'lucide-react';

interface PinningCanvasProps {
  imageUrl: string;
  pinPosition: PinPosition | null;
  onPinPlace: (pos: PinPosition) => void;
  readOnly?: boolean;
}

export const PinningCanvas: React.FC<PinningCanvasProps> = ({ imageUrl, pinPosition, onPinPlace, readOnly = false }) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const [hoverPos, setHoverPos] = useState<PinPosition | null>(null);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (readOnly || !imgRef.current) return;

    const rect = imgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    onPinPlace({ x, y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (readOnly || !imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setHoverPos({ x, y });
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.src = "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Insect_anatomy_diagram.svg/640px-Insect_anatomy_diagram.svg.png";
  };

  return (
    <div className="flex flex-col items-center">
        {!readOnly && (
            <div className="text-xs text-neutral-500 mb-2 flex items-center gap-1.5 uppercase tracking-wide font-medium">
                <MousePointer2 size={14} /> Click thorax to pin
            </div>
        )}
      <div 
        className={`relative inline-block border border-neutral-200 bg-white ${!readOnly ? 'cursor-crosshair' : ''}`}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverPos(null)}
      >
        <img 
          ref={imgRef}
          src={imageUrl} 
          onError={handleImageError}
          alt="Specimen Template" 
          className="max-w-[250px] md:max-w-[300px] select-none pointer-events-none mix-blend-multiply"
        />
        
        {/* The placed pin */}
        {pinPosition && (
          <div 
            className="absolute w-4 h-4 rounded-full bg-neutral-900 border-2 border-neutral-500 shadow-xl z-20 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            style={{ left: `${pinPosition.x}%`, top: `${pinPosition.y}%` }}
          >
            {/* Pin head shine */}
            <div className="absolute top-0.5 left-0.5 w-1.5 h-1.5 bg-white rounded-full opacity-40"></div>
          </div>
        )}
        
        {/* Shadow of the pin */}
        {pinPosition && (
           <div 
           className="absolute w-1.5 h-1.5 rounded-full bg-black opacity-20 blur-[1px] transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
           style={{ left: `${pinPosition.x + 2}%`, top: `${pinPosition.y + 2}%` }}
         />
        )}

        {/* Hover preview */}
        {!readOnly && hoverPos && !pinPosition && (
           <div 
           className="absolute w-4 h-4 rounded-full bg-neutral-900 opacity-40 border-2 border-white z-20 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
           style={{ left: `${hoverPos.x}%`, top: `${hoverPos.y}%` }}
         />
        )}
      </div>
    </div>
  );
};