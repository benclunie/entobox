import React, { useRef, useState, useEffect } from 'react';
import { RotateCw, ZoomIn, Wand2, Undo, Check, X, MousePointer2, Brush, RotateCcw } from 'lucide-react';

interface ImageEditorProps {
    src: string;
    onSave: (dataUrl: string) => void;
    onCancel: () => void;
}

type EditorTab = 'transform' | 'retouch';
type Tool = 'magic' | 'brush';

export const ImageEditor: React.FC<ImageEditorProps> = ({ src, onSave, onCancel }) => {
    const [tab, setTab] = useState<EditorTab>('transform');
    
    // Transform State
    const [scale, setScale] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    // Canvas Refs
    const transformCanvasRef = useRef<HTMLCanvasElement>(null);
    const retouchCanvasRef = useRef<HTMLCanvasElement>(null);
    const sourceImageRef = useRef<HTMLImageElement>(new Image());

    // Retouch State
    const [baseImageData, setBaseImageData] = useState<ImageData | null>(null); // State after Transform
    const [currentTool, setCurrentTool] = useState<Tool>('magic');
    const [tolerance, setTolerance] = useState(20);
    const [targetColor, setTargetColor] = useState({ r: 255, g: 255, b: 255 });
    const [brushSize, setBrushSize] = useState(20);
    const [isDrawing, setIsDrawing] = useState(false);
    const [history, setHistory] = useState<ImageData[]>([]);

    // Initial Load
    useEffect(() => {
        const img = sourceImageRef.current;
        img.crossOrigin = "Anonymous";
        img.src = src;
        img.onload = () => {
            renderTransformCanvas();
        };
    }, [src]);

    // Re-render transform canvas when params change
    useEffect(() => {
        if (tab === 'transform') {
            renderTransformCanvas();
        }
    }, [scale, rotation, position, tab]);

    const renderTransformCanvas = () => {
        const canvas = transformCanvasRef.current;
        const img = sourceImageRef.current;
        if (!canvas || !img.complete) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawCheckerboard(ctx, canvas.width, canvas.height);

        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.translate(position.x, position.y);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.scale(scale, scale);
        ctx.drawImage(img, -img.width / 2, -img.height / 2);
        ctx.restore();
    };

    const drawCheckerboard = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
        const size = 10;
        ctx.fillStyle = '#f3f4f6';
        ctx.fillRect(0,0,w,h);
        ctx.fillStyle = '#e5e7eb'; 
        for(let y=0; y<h; y+=size) {
            for(let x=0; x<w; x+=size) {
                if ((x/size + y/size) % 2 === 0) ctx.fillRect(x,y,size,size);
            }
        }
    };

    // --- Transform Handlers ---
    const handleMouseDown = (e: React.MouseEvent) => {
        if (tab !== 'transform') return;
        setIsDragging(true);
        setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || tab !== 'transform') return;
        setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    };

    const handleMouseUp = () => setIsDragging(false);

    const commitTransform = () => {
        const canvas = transformCanvasRef.current;
        if (canvas) {
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = canvas.width;
            tempCanvas.height = canvas.height;
            const tCtx = tempCanvas.getContext('2d');
            if(tCtx) {
                const img = sourceImageRef.current;
                tCtx.save();
                tCtx.translate(tempCanvas.width / 2, tempCanvas.height / 2);
                tCtx.translate(position.x, position.y);
                tCtx.rotate((rotation * Math.PI) / 180);
                tCtx.scale(scale, scale);
                tCtx.drawImage(img, -img.width / 2, -img.height / 2);
                tCtx.restore();
                
                const data = tCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
                setBaseImageData(data);
                setHistory([data]);
                setTab('retouch');
            }
        }
    };

    // --- Retouch Logic ---
    
    // Draw the current state to the retouch canvas
    useEffect(() => {
        if (tab === 'retouch' && retouchCanvasRef.current && history.length > 0) {
            const canvas = retouchCanvasRef.current;
            const ctx = canvas.getContext('2d');
            const data = history[history.length - 1];
            if (ctx && data) {
                ctx.clearRect(0,0, canvas.width, canvas.height);
                ctx.putImageData(data, 0, 0);
            }
        }
    }, [history, tab]);

    // Setup retouch canvas background
    useEffect(() => {
        if (tab === 'retouch' && retouchCanvasRef.current) {
            retouchCanvasRef.current.style.backgroundImage = 
                `linear-gradient(45deg, #ccc 25%, transparent 25%), 
                 linear-gradient(-45deg, #ccc 25%, transparent 25%), 
                 linear-gradient(45deg, transparent 75%, #ccc 75%), 
                 linear-gradient(-45deg, transparent 75%, #ccc 75%)`;
            retouchCanvasRef.current.style.backgroundSize = '20px 20px';
            retouchCanvasRef.current.style.backgroundPosition = '0 0, 0 10px, 10px -10px, -10px 0px';
        }
    }, [tab]);


    const handleRetouchMouseDown = (e: React.MouseEvent) => {
        if (tab !== 'retouch') return;
        
        const canvas = retouchCanvasRef.current;
        if(!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const x = Math.floor((e.clientX - rect.left) * (canvas.width / rect.width));
        const y = Math.floor((e.clientY - rect.top) * (canvas.height / rect.height));

        if (currentTool === 'magic') {
            const ctx = canvas.getContext('2d');
            if(ctx) {
                const pixel = ctx.getImageData(x, y, 1, 1).data;
                if(pixel[3] > 0) {
                    setTargetColor({ r: pixel[0], g: pixel[1], b: pixel[2] });
                    applyMagicWand(tolerance, { r: pixel[0], g: pixel[1], b: pixel[2] });
                }
            }
        } else if (currentTool === 'brush') {
            setIsDrawing(true);
            applyBrush(x, y);
        }
    };

    const handleRetouchMouseMove = (e: React.MouseEvent) => {
        if (currentTool === 'brush' && isDrawing) {
            const canvas = retouchCanvasRef.current;
            if(!canvas) return;
            const rect = canvas.getBoundingClientRect();
            const x = Math.floor((e.clientX - rect.left) * (canvas.width / rect.width));
            const y = Math.floor((e.clientY - rect.top) * (canvas.height / rect.height));
            applyBrush(x, y);
        }
    };

    const handleRetouchMouseUp = () => {
        if (isDrawing) {
            setIsDrawing(false);
            const canvas = retouchCanvasRef.current;
            if(canvas) {
                const ctx = canvas.getContext('2d');
                if(ctx) setHistory(prev => [...prev, ctx.getImageData(0, 0, canvas.width, canvas.height)]);
            }
        }
    };

    const applyMagicWand = (tol: number, target: {r:number, g:number, b:number}) => {
        if (history.length === 0) return;
        
        const lastData = history[history.length - 1];
        const newData = new ImageData(
            new Uint8ClampedArray(lastData.data),
            lastData.width,
            lastData.height
        );
        const d = newData.data;
        const threshold = tol * 2.5; 
        const targetR = target.r;
        const targetG = target.g;
        const targetB = target.b;

        for (let i = 0; i < d.length; i += 4) {
            if (d[i+3] === 0) continue; 
            
            // Optimization: Manhattan distance for speed? No, stick to Euclidean for quality.
            // Inline math for speed
            const dist = Math.sqrt(
                (d[i] - targetR) ** 2 +
                (d[i+1] - targetG) ** 2 +
                (d[i+2] - targetB) ** 2
            );

            if (dist < threshold) {
                d[i+3] = 0;
            }
        }
        setHistory(prev => [...prev, newData]);
    };

    const applyBrush = (cx: number, cy: number) => {
        const canvas = retouchCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.arc(cx, cy, brushSize / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
    };

    const handleUndo = () => {
        if (history.length > 1) {
            setHistory(prev => prev.slice(0, -1));
        }
    };
    
    const handleResetRetouch = () => {
        if (baseImageData) {
            setHistory([baseImageData]);
        }
    };

    return (
        <div className="flex flex-col h-full bg-neutral-100 dark:bg-neutral-900 rounded-lg overflow-hidden border border-neutral-300 dark:border-neutral-700">
            {/* Toolbar */}
            <div className="bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 p-3 flex justify-between items-center">
                <div className="flex gap-2">
                    <button 
                        onClick={() => setTab('transform')}
                        className={`px-3 py-1.5 text-xs font-bold rounded-md flex items-center gap-2 ${tab === 'transform' ? 'bg-indigo-600 text-white' : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700'}`}
                    >
                        <RotateCw size={14} /> Frame
                    </button>
                    <button 
                        onClick={commitTransform}
                        disabled={tab === 'retouch'}
                        className={`px-3 py-1.5 text-xs font-bold rounded-md flex items-center gap-2 ${tab === 'retouch' ? 'bg-indigo-600 text-white' : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700'}`}
                    >
                        <Wand2 size={14} /> Clean Up
                    </button>
                </div>
                <div className="flex gap-2">
                     <button onClick={onCancel} className="p-2 text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-white"><X size={18} /></button>
                </div>
            </div>

            {/* Canvas Area */}
            <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-neutral-200 dark:bg-neutral-950 p-4">
                {tab === 'transform' ? (
                     <canvas 
                        ref={transformCanvasRef} 
                        width={600} 
                        height={600}
                        className="max-w-full max-h-full shadow-2xl cursor-move bg-white"
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                     />
                ) : (
                    <div className="relative max-w-full max-h-full shadow-2xl">
                        <canvas 
                            ref={retouchCanvasRef} 
                            width={600} 
                            height={600}
                            className={`block bg-white ${currentTool === 'brush' ? 'cursor-none' : 'cursor-crosshair'}`}
                            onMouseDown={handleRetouchMouseDown}
                            onMouseMove={handleRetouchMouseMove}
                            onMouseUp={handleRetouchMouseUp}
                            onMouseLeave={handleRetouchMouseUp}
                        />
                        {/* Brush Cursor Indicator */}
                         {currentTool === 'brush' && (
                            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                                {/* We don't render a complex custom cursor to avoid lag, but the cursor:none hides the mouse */}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className="bg-white dark:bg-neutral-800 border-t border-neutral-200 dark:border-neutral-700 p-4 min-h-[100px]">
                {tab === 'transform' && (
                    <div className="flex flex-wrap items-center gap-6 justify-center">
                         <div className="flex items-center gap-2">
                            <ZoomIn size={16} className="text-neutral-500" />
                            <input 
                                type="range" min="0.5" max="3" step="0.1" 
                                value={scale} onChange={(e) => setScale(parseFloat(e.target.value))}
                                className="w-32 accent-indigo-600"
                            />
                         </div>
                         <div className="flex items-center gap-2">
                             <span className="text-xs font-bold text-neutral-500 uppercase">Rotate</span>
                             <button onClick={() => setRotation(r => r - 90)} className="px-2 py-1 bg-neutral-100 dark:bg-neutral-700 dark:text-neutral-200 rounded text-xs">-90°</button>
                             <button onClick={() => setRotation(r => r + 90)} className="px-2 py-1 bg-neutral-100 dark:bg-neutral-700 dark:text-neutral-200 rounded text-xs">+90°</button>
                         </div>
                         <div className="ml-auto">
                            <button onClick={commitTransform} className="bg-indigo-600 text-white px-4 py-2 rounded text-sm font-bold shadow hover:bg-indigo-700">Next: Clean Up</button>
                         </div>
                    </div>
                )}

                {tab === 'retouch' && (
                    <div className="flex flex-col md:flex-row items-center gap-4 justify-between w-full">
                        <div className="flex items-center gap-4 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
                            
                            {/* Auto Tool */}
                            <button 
                                onClick={() => setCurrentTool('magic')}
                                className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition ${currentTool === 'magic' ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-700' : 'border-transparent hover:bg-neutral-100 dark:hover:bg-neutral-700'}`}
                            >
                                <div className="flex items-center gap-2 text-sm font-bold text-neutral-700 dark:text-neutral-200">
                                    <Wand2 size={16} className={currentTool === 'magic' ? 'text-indigo-600' : 'text-neutral-400'} />
                                    Auto Remove
                                </div>
                                {currentTool === 'magic' && (
                                     <div className="flex items-center gap-2 mt-1">
                                        <div 
                                            className="w-4 h-4 rounded-full border border-neutral-300 shadow-sm"
                                            style={{ backgroundColor: `rgb(${targetColor.r},${targetColor.g},${targetColor.b})` }}
                                            title="Target Color (Click image to pick)"
                                        ></div>
                                        <input 
                                            type="range" min="0" max="100" 
                                            value={tolerance} 
                                            onChange={(e) => {
                                                const val = parseInt(e.target.value);
                                                setTolerance(val);
                                            }}
                                            onMouseUp={() => {
                                                applyMagicWand(tolerance, targetColor);
                                            }}
                                            className="w-24 accent-indigo-600 h-1.5"
                                        />
                                     </div>
                                )}
                            </button>

                            <div className="w-px h-10 bg-neutral-200 dark:bg-neutral-700 mx-2"></div>

                            {/* Brush Tool */}
                            <button 
                                onClick={() => setCurrentTool('brush')}
                                className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition ${currentTool === 'brush' ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-700' : 'border-transparent hover:bg-neutral-100 dark:hover:bg-neutral-700'}`}
                            >
                                <div className="flex items-center gap-2 text-sm font-bold text-neutral-700 dark:text-neutral-200">
                                    <Brush size={16} className={currentTool === 'brush' ? 'text-rose-500' : 'text-neutral-400'} />
                                    Highlight Remove
                                </div>
                                {currentTool === 'brush' && (
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[10px] uppercase font-bold text-neutral-400">Size</span>
                                        <input 
                                            type="range" min="5" max="80" 
                                            value={brushSize} onChange={(e) => setBrushSize(parseInt(e.target.value))}
                                            className="w-24 accent-rose-500 h-1.5"
                                        />
                                    </div>
                                )}
                            </button>
                        </div>

                        <div className="flex items-center gap-3 ml-auto">
                             <button 
                                onClick={handleResetRetouch}
                                className="px-3 py-2 text-xs font-bold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded flex items-center gap-2"
                                title="Reset all clean up"
                            >
                                <RotateCcw size={14} /> Reset
                            </button>
                             <button 
                                onClick={handleUndo} 
                                disabled={history.length <= 1}
                                className="px-3 py-2 text-xs font-bold text-neutral-600 dark:text-neutral-300 disabled:opacity-30 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded flex items-center gap-2"
                                title="Undo last action"
                            >
                                <Undo size={14} /> Undo
                             </button>
                             <button 
                                onClick={() => {
                                    if (retouchCanvasRef.current) onSave(retouchCanvasRef.current.toDataURL('image/png'));
                                }} 
                                className="bg-emerald-600 text-white px-6 py-2 rounded text-sm font-bold shadow hover:bg-emerald-700 flex items-center gap-2"
                            >
                                <Check size={16} /> Save
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};