import React, { useState } from 'react';
import { Insect, PinPosition } from '../types';
import { PinningCanvas } from './PinningCanvas';
import { ImageEditor } from './ImageEditor';
import { Upload, X, Save, Trash2, ArrowRight, Image as ImageIcon, Edit2, RotateCcw, Eye } from 'lucide-react';

interface EditorProps {
  drawerId: string; // New prop
  slotIndex: number;
  initialData: Insect | null;
  onSave: (data: Insect) => void;
  onClose: () => void;
  onDelete: (id: string) => void;
  readOnly?: boolean;
}

export const Editor: React.FC<EditorProps> = ({ drawerId, slotIndex, initialData, onSave, onClose, onDelete, readOnly = false }) => {
  const [step, setStep] = useState(initialData ? 2 : 0);
  
  // Image State
  const [imageUrl, setImageUrl] = useState<string | null>(initialData?.imageUrl || null);
  // Store original for revert functionality
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(initialData?.imageUrl || null);
  
  const [showImageEditor, setShowImageEditor] = useState(false);
  const [tempImageSrc, setTempImageSrc] = useState<string | null>(null);

  // Pinning
  const [pinPosition, setPinPosition] = useState<PinPosition | null>(initialData?.pinPosition || null);
  
  // Taxonomy State
  const [phylum, setPhylum] = useState(initialData?.phylum || 'Arthropoda');
  const [classVal, setClassVal] = useState(initialData?.class || 'Insecta');
  const [order, setOrder] = useState(initialData?.order || '');
  const [suborder, setSuborder] = useState(initialData?.suborder || '');
  const [family, setFamily] = useState(initialData?.family || '');
  const [genus, setGenus] = useState(initialData?.genus || '');
  const [species, setSpecies] = useState(initialData?.species || '');
  const [authority, setAuthority] = useState(initialData?.authority || '');
  const [commonName, setCommonName] = useState(initialData?.commonName || '');

  // Collection Data
  const [dateCaught, setDateCaught] = useState(initialData?.dateCaught || new Date().toISOString().split('T')[0]);
  const [location, setLocation] = useState(initialData?.location || '');
  const [collector, setCollector] = useState(initialData?.collector || '');
  const [evolutionaryHistory, setEvolutionaryHistory] = useState(initialData?.evolutionaryHistory || '');
  const [fieldPhotos, setFieldPhotos] = useState<string[]>(initialData?.fieldPhotos || []);

  const handleMainImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (readOnly) return;
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setTempImageSrc(reader.result);
          setOriginalImageUrl(reader.result); // Save original
          setShowImageEditor(true);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditorSave = (newUrl: string) => {
      setImageUrl(newUrl);
      setShowImageEditor(false);
  };

  const handleRevertImage = () => {
      if (confirm('Revert to the original uploaded image? All edits will be lost.')) {
          setImageUrl(originalImageUrl);
      }
  };

  const handleFieldPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (readOnly) return;
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setFieldPhotos(prev => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (readOnly) return;
    const newData: Insect = {
        id: initialData?.id || crypto.randomUUID(),
        drawerId: drawerId, // Ensure drawer ID is set
        slotIndex,
        imageUrl,
        pinPosition,
        phylum,
        class: classVal,
        order,
        suborder,
        family,
        genus,
        species,
        authority,
        commonName,
        dateCaught,
        location,
        collector,
        evolutionaryHistory,
        fieldPhotos
    };
    onSave(newData);
  };

  // STRICT HIGH CONTRAST STYLES
  const inputClass = `w-full p-2.5 border border-neutral-300 rounded text-sm text-neutral-900 bg-white outline-none placeholder-neutral-400 font-medium ${readOnly ? 'bg-neutral-100 text-neutral-600 cursor-not-allowed' : 'focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'}`;
  const labelClass = "block text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-1";

  // If Editor is open, show it over everything
  if (showImageEditor && tempImageSrc && !readOnly) {
      return (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4">
              <div className="w-full max-w-5xl h-[90vh]">
                  <ImageEditor 
                    src={tempImageSrc} 
                    onSave={handleEditorSave} 
                    onCancel={() => setShowImageEditor(false)} 
                  />
              </div>
          </div>
      );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-neutral-900 w-full max-w-5xl h-[95vh] rounded-xl shadow-2xl flex flex-col overflow-hidden ring-1 ring-neutral-200 dark:ring-neutral-800 transition-colors duration-300">
        
        {/* Header */}
        <div className={`border-b p-5 flex justify-between items-center shrink-0 ${readOnly ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900' : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800'}`}>
            <div>
                 <h2 className={`text-xl font-sans font-bold flex items-center gap-2 ${readOnly ? 'text-amber-700 dark:text-amber-500' : 'text-neutral-800 dark:text-neutral-100'}`}>
                    {readOnly ? <><Eye size={20} /> Viewing Specimen</> : (initialData ? 'Edit Specimen' : 'New Specimen Entry')}
                </h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 font-mono uppercase mt-1">Slot {String(slotIndex + 1).padStart(2, '0')} • {readOnly ? 'Read Only Mode' : 'Configuration'}</p>
            </div>
          <button onClick={onClose} className="hover:bg-neutral-100 dark:hover:bg-neutral-800 p-2 rounded-full transition text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-100">
            <X size={20} />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-neutral-50 dark:bg-black/20">
            
            {/* Step 0: Image Upload & Processing */}
            {step === 0 && !readOnly && (
                <div className="flex flex-col items-center justify-center h-full space-y-8 max-w-2xl mx-auto">
                    <div className="text-center space-y-2">
                        <h3 className="text-2xl font-serif text-neutral-800 dark:text-neutral-100">Specimen Imagery</h3>
                        <p className="text-neutral-500 dark:text-neutral-400">Upload a photo. Use the built-in studio to crop, rotate, and remove background.</p>
                    </div>
                    
                    <div className="w-full bg-white dark:bg-neutral-800 p-8 rounded-xl border-2 border-dashed border-neutral-300 dark:border-neutral-700 shadow-sm flex flex-col items-center justify-center min-h-[400px]">
                        {!imageUrl ? (
                            <label className="cursor-pointer flex flex-col items-center gap-4 text-neutral-400 dark:text-neutral-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition group w-full h-full justify-center">
                                <div className="p-4 bg-neutral-50 dark:bg-neutral-700 rounded-full group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 transition">
                                    <ImageIcon size={48} />
                                </div>
                                <div className="text-center">
                                    <span className="font-bold text-lg block text-neutral-600 dark:text-neutral-300">Click to Upload Specimen</span>
                                    <span className="text-sm">JPG or PNG supported</span>
                                </div>
                                <input type="file" accept="image/*" onChange={handleMainImageUpload} className="hidden" />
                            </label>
                        ) : (
                            <div className="relative w-full h-full flex items-center justify-center bg-neutral-100 dark:bg-neutral-900/50 rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-700">
                                {/* Checkerboard background */}
                                <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
                                    backgroundImage: `linear-gradient(45deg, #000 25%, transparent 25%), linear-gradient(-45deg, #000 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #000 75%), linear-gradient(-45deg, transparent 75%, #000 75%)`,
                                    backgroundSize: '20px 20px',
                                    backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
                                }}></div>
                                
                                <img src={imageUrl} alt="Uploaded Specimen" className="max-w-full max-h-[350px] object-contain relative z-10" />
                                
                                {/* Edit Controls */}
                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                                     <button 
                                        onClick={() => {
                                            setTempImageSrc(imageUrl);
                                            setShowImageEditor(true);
                                        }}
                                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 font-bold text-sm transition"
                                     >
                                        <Edit2 size={14} /> Open Studio
                                     </button>
                                     
                                     {originalImageUrl && originalImageUrl !== imageUrl && (
                                         <button 
                                            onClick={handleRevertImage}
                                            className="flex items-center gap-2 px-4 py-2 bg-white text-neutral-700 border border-neutral-300 rounded-full shadow-lg hover:bg-neutral-50 font-bold text-sm transition"
                                         >
                                            <RotateCcw size={14} /> Revert
                                         </button>
                                     )}
                                </div>
                                
                                <button 
                                    onClick={() => { setImageUrl(null); }}
                                    className="absolute top-2 right-2 p-1 bg-white/80 dark:bg-black/50 rounded-full hover:bg-red-100 text-neutral-500 hover:text-red-600 transition z-20"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-center w-full pt-4">
                        <button 
                            onClick={() => setStep(1)}
                            disabled={!imageUrl}
                            className="bg-indigo-600 text-white px-8 py-3 rounded-lg shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition flex items-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Confirm Image <ArrowRight size={18} />
                        </button>
                    </div>
                </div>
            )}

            {/* Step 1: Pinning */}
            {step === 1 && !readOnly && (
                 <div className="flex flex-col items-center justify-center h-full space-y-6">
                    <div className="text-center">
                        <h3 className="text-2xl font-serif text-neutral-800 dark:text-neutral-100">Digital Pinning</h3>
                        <p className="text-neutral-500 dark:text-neutral-400">Place the virtual pin on the thorax of the specimen.</p>
                    </div>
                    
                    <div className="bg-white dark:bg-neutral-800 p-8 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-lg">
                        {imageUrl && (
                            <PinningCanvas 
                                imageUrl={imageUrl} 
                                pinPosition={pinPosition} 
                                onPinPlace={(pos) => setPinPosition(pos)} 
                                readOnly={false} 
                            />
                        )}
                    </div>

                    <div className="flex gap-4 items-center mt-6">
                        <button onClick={() => setStep(0)} className="text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-100 text-sm font-medium">Change Image</button>
                        <button 
                            onClick={() => setStep(2)}
                            disabled={!pinPosition}
                            className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg shadow hover:bg-indigo-700 transition flex items-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Next: Taxonomy <ArrowRight size={18} />
                        </button>
                    </div>
                 </div>
            )}

            {/* Step 2: Metadata & Details (Also used for Read Only View) */}
            {step === 2 && (
                <div className="flex flex-col gap-6 h-full">
                    
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        
                        {/* Visuals (4 cols) */}
                        <div className="lg:col-span-4 flex flex-col gap-4">
                             <div className="relative bg-white dark:bg-neutral-800 p-6 rounded-lg border border-neutral-200 dark:border-neutral-700 shadow-sm flex flex-col items-center justify-center min-h-[300px]">
                                {imageUrl && (
                                    <>
                                        <PinningCanvas 
                                            imageUrl={imageUrl} 
                                            pinPosition={pinPosition} 
                                            onPinPlace={(pos) => !readOnly && setPinPosition(pos)} 
                                            readOnly={readOnly} 
                                        />
                                        {!readOnly && (
                                            <button 
                                                onClick={() => {
                                                    setTempImageSrc(imageUrl);
                                                    setShowImageEditor(true);
                                                }}
                                                className="absolute top-2 right-2 p-2 bg-white dark:bg-neutral-700 text-neutral-600 dark:text-neutral-200 rounded-lg shadow-md border border-neutral-200 dark:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-600 hover:text-indigo-600 dark:hover:text-indigo-400 transition z-10"
                                                title="Edit Image"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* Photo Gallery */}
                            <div className="bg-white dark:bg-neutral-800 p-4 rounded-lg border border-neutral-200 dark:border-neutral-700 shadow-sm">
                                <h4 className={labelClass}>Additional Photos</h4>
                                <div className="grid grid-cols-3 gap-2">
                                    {fieldPhotos.map((photo, idx) => (
                                        <img key={idx} src={photo} alt="Field" className="w-full aspect-square object-cover rounded border border-neutral-200 dark:border-neutral-600" />
                                    ))}
                                    {!readOnly && (
                                        <label className="cursor-pointer bg-neutral-50 dark:bg-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-600 text-neutral-400 dark:text-neutral-500 aspect-square rounded text-xs flex flex-col items-center justify-center transition border border-neutral-200 dark:border-neutral-600 border-dashed text-center">
                                            <Upload size={16} className="mb-1" />
                                            <input type="file" accept="image/*" onChange={handleFieldPhotoUpload} className="hidden" />
                                        </label>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Form (8 cols) */}
                        <div className="lg:col-span-8 flex flex-col gap-4">
                            {/* Taxonomy Data */}
                            <div className="bg-white dark:bg-neutral-800 p-6 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700 relative transition-colors duration-300">
                                <div className={`absolute top-0 left-0 w-1 h-full rounded-l-lg ${readOnly ? 'bg-amber-500' : 'bg-indigo-500'}`}></div>
                                <h3 className="text-lg font-serif font-bold text-neutral-800 dark:text-neutral-100 mb-4 pb-2 border-b border-neutral-100 dark:border-neutral-700">Taxonomic Breakdown</h3>
                                
                                <div className="grid grid-cols-4 gap-4 mb-4">
                                     <div className="col-span-2">
                                        <label className={labelClass}>Phylum</label>
                                        <input type="text" value={phylum} onChange={(e) => setPhylum(e.target.value)} className={inputClass} placeholder="Arthropoda" disabled={readOnly} />
                                     </div>
                                     <div className="col-span-2">
                                        <label className={labelClass}>Class</label>
                                        <input type="text" value={classVal} onChange={(e) => setClassVal(e.target.value)} className={inputClass} placeholder="Insecta" disabled={readOnly} />
                                     </div>
                                </div>
                                
                                <div className="grid grid-cols-4 gap-4 mb-4">
                                    <div className="col-span-2">
                                        <label className={labelClass}>Order</label>
                                        <input type="text" value={order} onChange={(e) => setOrder(e.target.value)} className={`${inputClass} font-semibold`} placeholder="e.g. Lepidoptera" disabled={readOnly} />
                                    </div>
                                    <div className="col-span-2">
                                        <label className={labelClass}>Suborder</label>
                                        <input type="text" value={suborder} onChange={(e) => setSuborder(e.target.value)} className={inputClass} disabled={readOnly} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-4 gap-4 mb-4">
                                    <div className="col-span-2">
                                        <label className={labelClass}>Family</label>
                                        <input type="text" value={family} onChange={(e) => setFamily(e.target.value)} className={`${inputClass} font-semibold`} placeholder="e.g. Nymphalidae" disabled={readOnly} />
                                    </div>
                                    <div className="col-span-2">
                                        <label className={labelClass}>Common Name</label>
                                        <input type="text" value={commonName} onChange={(e) => setCommonName(e.target.value)} className={inputClass} disabled={readOnly} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-4 gap-4">
                                    <div className="col-span-2">
                                        <label className={labelClass}>Genus</label>
                                        <input type="text" value={genus} onChange={(e) => setGenus(e.target.value)} className={`${inputClass} italic font-serif`} placeholder="Danaus" disabled={readOnly} />
                                    </div>
                                    <div className="col-span-2">
                                        <label className={labelClass}>Species</label>
                                        <input type="text" value={species} onChange={(e) => setSpecies(e.target.value)} className={`${inputClass} italic font-serif`} placeholder="plexippus" disabled={readOnly} />
                                    </div>
                                     <div className="col-span-4">
                                        <label className={labelClass}>Naming Authority</label>
                                        <input type="text" value={authority} onChange={(e) => setAuthority(e.target.value)} className={inputClass} placeholder="(Linnaeus, 1758)" disabled={readOnly} />
                                    </div>
                                </div>
                            </div>

                             {/* Collection Data */}
                             <div className="bg-white dark:bg-neutral-800 p-6 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700 relative transition-colors duration-300">
                                <div className={`absolute top-0 left-0 w-1 h-full rounded-l-lg ${readOnly ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
                                <h3 className="text-lg font-serif font-bold text-neutral-800 dark:text-neutral-100 mb-4 pb-2 border-b border-neutral-100 dark:border-neutral-700">Collection Details</h3>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className={labelClass}>Date Collected</label>
                                        <input type="date" value={dateCaught} onChange={(e) => setDateCaught(e.target.value)} className={inputClass} disabled={readOnly} />
                                    </div>
                                    <div className="col-span-2">
                                        <label className={labelClass}>Location</label>
                                        <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} className={inputClass} placeholder="Lat/Long or City, State" disabled={readOnly} />
                                    </div>
                                    <div className="col-span-3">
                                        <label className={labelClass}>Collector</label>
                                        <input type="text" value={collector} onChange={(e) => setCollector(e.target.value)} className={inputClass} disabled={readOnly} />
                                    </div>
                                </div>
                             </div>
                        </div>
                    </div>

                    {/* Extended Notes Section */}
                    <div className="bg-white dark:bg-neutral-800 p-6 rounded-lg border border-neutral-200 dark:border-neutral-700 shadow-sm mt-auto transition-colors duration-300">
                        <label className={`block text-sm font-bold text-neutral-700 dark:text-neutral-200 mb-2 flex items-center gap-2`}>
                             Evolutionary History & Phylogeny Notes
                        </label>
                        <textarea 
                        value={evolutionaryHistory}
                        onChange={(e) => setEvolutionaryHistory(e.target.value)}
                        className={`w-full p-4 border border-neutral-300 rounded-lg h-32 text-sm leading-relaxed text-neutral-900 bg-white outline-none transition resize-none placeholder-neutral-400 font-medium ${readOnly ? 'bg-neutral-100 text-neutral-600 cursor-not-allowed' : 'focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'}`}
                        placeholder="Detailed notes on phylogeny, adaptations, and natural history..."
                        disabled={readOnly}
                    />
                    </div>

                </div>
            )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 flex justify-between items-center shrink-0">
             {initialData && !readOnly && (
                 <button 
                 onClick={() => onDelete(initialData.id)}
                 className="text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-900/20 px-4 py-2 rounded transition flex items-center gap-2 text-sm font-medium"
                >
                 <Trash2 size={16} /> Delete Entry
                </button>
             )}
             <div className="flex gap-3 ml-auto">
                <button onClick={onClose} className="px-5 py-2 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded transition font-medium">Close</button>
                {step === 2 && !readOnly && (
                    <button 
                    onClick={handleSave} 
                    disabled={!pinPosition}
                    className="bg-indigo-600 text-white px-6 py-2 rounded shadow-md hover:bg-indigo-700 hover:shadow-lg transition flex items-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                    <Save size={18} /> Save Specimen
                    </button>
                )}
             </div>
        </div>
      </div>
    </div>
  );
};