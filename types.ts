
export interface PinPosition {
  x: number; // Percentage 0-100
  y: number; // Percentage 0-100
}

export interface Drawer {
  id: string;
  title: string;
  slotCount: number;
  isCollapsed: boolean;
}

export interface Insect {
  id: string;
  drawerId: string; // Link to specific drawer
  slotIndex: number;
  imageUrl: string | null; // User uploaded and processed image
  
  // Full Taxonomy
  phylum: string;
  class: string;
  order: string;
  suborder: string;
  family: string;
  genus: string;
  species: string;
  commonName: string;
  authority: string;
  
  // Collection Data
  dateCaught: string;
  location: string;
  collector: string;
  
  // Detailed Data
  evolutionaryHistory: string;
  
  // Visuals
  pinPosition: PinPosition | null;
  fieldPhotos: string[];
}

export interface UserProfile {
  studentId: string;
  password: string; // Stored locally (insecure for real prod, fine for static assignment)
  fullName: string;
}

export interface CollectionData {
  title: string;
  studentName: string;
  studentId: string;
  drawers: Drawer[]; // New structure
  insects: Insect[];
  lastSaved: string;
  // Legacy fields for migration support
  drawerTitle?: string; 
}

// Helper to remove white background from an image via Canvas
export const removeWhiteBackground = (imageSrc: string, tolerance: number = 240): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = imageSrc;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject("No canvas context");
        return;
      }
      ctx.drawImage(img, 0, 0);
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // Check if pixel is close to white
        if (r > tolerance && g > tolerance && b > tolerance) {
          data[i + 3] = 0; // Set alpha to 0 (transparent)
        }
      }
      
      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = (err) => reject(err);
  });
};
