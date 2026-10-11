import React, { useState, useRef } from 'react';
import { X, Upload, RotateCw, ZoomIn, ZoomOut, Check, Image as ImageIcon } from 'lucide-react';

interface ImageCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (croppedDataUrl: string) => void;
  currentAvatar: string;
}

export const ImageCropModal: React.FC<ImageCropModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currentAvatar
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size exceeds 5MB limit.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setSelectedImage(reader.result as string);
        setZoom(1);
        setRotation(0);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleApply = () => {
    if (selectedImage) {
      onSave(selectedImage);
    }
    onClose();
  };

  const handleUsePreset = (presetUrl: string) => {
    onSave(presetUrl);
    onClose();
  };

  const presetAvatars = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-[#E3EAF3]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E3EAF3] bg-[#F5F8FC]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#0B6BE6]/10 text-[#0B6BE6] flex items-center justify-center">
              <ImageIcon className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-[#0B2A55] text-lg">Change Profile Photo</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Preview Container */}
          <div className="flex flex-col items-center justify-center">
            <div className="relative w-44 h-44 rounded-full overflow-hidden border-4 border-[#0B6BE6] shadow-md bg-gray-100 flex items-center justify-center">
              <img
                src={selectedImage || currentAvatar}
                alt="Avatar Preview"
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                  transition: 'transform 0.15s ease-out'
                }}
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-xs text-gray-500 mt-2">Live circular profile preview</span>
          </div>

          {/* Upload Button */}
          <div className="flex justify-center">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#0B6BE6] hover:bg-[#0956b8] text-white rounded-xl text-sm font-semibold shadow-xs hover:shadow-md transition-all cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              Choose Image from Device
            </button>
          </div>

          {/* Controls if custom image uploaded */}
          {selectedImage && (
            <div className="bg-[#F5F8FC] p-3 rounded-xl border border-[#E3EAF3] space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-[#0B2A55]">
                <span>Zoom</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setZoom(Math.max(0.6, zoom - 0.1))}
                    className="p-1 rounded bg-white border border-[#E3EAF3] hover:bg-gray-50"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-10 text-center font-mono">{(zoom * 100).toFixed(0)}%</span>
                  <button
                    type="button"
                    onClick={() => setZoom(Math.min(2.5, zoom + 0.1))}
                    className="p-1 rounded bg-white border border-[#E3EAF3] hover:bg-gray-50"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs font-semibold text-[#0B2A55]">
                <span>Rotate</span>
                <button
                  type="button"
                  onClick={() => setRotation((rotation + 90) % 360)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white border border-[#E3EAF3] hover:bg-gray-50 text-xs text-[#0B2A55]"
                >
                  <RotateCw className="w-3 h-3" />
                  +90°
                </button>
              </div>
            </div>
          )}

          {/* Or Select from Presets */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Or choose a preset avatar</span>
            <div className="flex items-center justify-between gap-2">
              {presetAvatars.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleUsePreset(preset)}
                  className="w-10 h-10 rounded-full overflow-hidden border-2 border-transparent hover:border-[#0B6BE6] hover:scale-110 transition-all"
                >
                  <img src={preset} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#F5F8FC] border-t border-[#E3EAF3] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-200/50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold bg-[#0E9F6E] hover:bg-[#0b8259] text-white shadow-xs hover:shadow-md transition-all cursor-pointer"
          >
            <Check className="w-4 h-4" />
            Save & Update Avatar
          </button>
        </div>
      </div>
    </div>
  );
};
