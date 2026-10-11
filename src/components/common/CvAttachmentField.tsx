import React, { useRef, useState } from 'react';
import { 
  FileText, 
  Eye, 
  Download, 
  Upload, 
  CheckCircle2, 
  Trash2,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { User } from '../../types';
import { AcademicCvModal } from './AcademicCvModal';
import { downloadAcademicCv, formatFileSize } from '../../services/cvService';

export interface CvAttachmentData {
  fileName?: string;
  fileSize?: string;
  fileData?: string;
  isCustom?: boolean;
}

interface CvAttachmentFieldProps {
  currentUser?: User | null;
  value?: CvAttachmentData;
  onChange?: (data: CvAttachmentData) => void;
  label?: string;
  readOnly?: boolean;
  className?: string;
}

export const CvAttachmentField: React.FC<CvAttachmentFieldProps> = ({
  currentUser,
  value,
  onChange,
  label = 'Attached Academic CV',
  readOnly = false,
  className = ''
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [justUploaded, setJustUploaded] = useState(false);

  // Derive active CV data: ONLY from real passed value or real user profile!
  const hasUserCv = Boolean(currentUser?.cvFileName || currentUser?.cvUrl || currentUser?.cvFileData);
  const userProfileCv: CvAttachmentData = hasUserCv ? {
    fileName: currentUser?.cvFileName || `${(currentUser?.name || 'Academic_Profile').replace(/\s+/g, '_')}_CV.pdf`,
    fileSize: currentUser?.cvFileSize || '1.2 MB',
    fileData: currentUser?.cvFileData || currentUser?.cvUrl,
    isCustom: true
  } : {};

  const currentCv: CvAttachmentData = value?.fileName ? value : userProfileCv;
  const isCvAttached = Boolean(currentCv.fileName);

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentCv.fileName) return;
    downloadAcademicCv({
      user: currentUser,
      fileName: currentCv.fileName,
      fileData: currentCv.fileData
    });
  };

  const handlePreview = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (isCvAttached) {
      setIsPreviewOpen(true);
    }
  };

  const handleFileSelect = (file: File) => {
    setErrorMsg(null);
    if (!file) return;

    // Strict validation: PDF only
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setErrorMsg('Only PDF documents (.pdf) are allowed.');
      return;
    }

    // Strict validation: Max 5 MB
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('File size exceeds the 5MB maximum limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const resultData = reader.result as string;
      const formattedSize = formatFileSize(file.size);
      
      const newCvData: CvAttachmentData = {
        fileName: file.name,
        fileSize: formattedSize,
        fileData: resultData,
        isCustom: true
      };

      if (onChange) {
        onChange(newCvData);
      }

      setJustUploaded(true);
      setTimeout(() => setJustUploaded(false), 3000);
    };
    reader.onerror = () => {
      setErrorMsg('Failed to process file. Please try again.');
    };
    reader.readAsDataURL(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveCv = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onChange) {
      onChange({});
    }
  };

  const triggerUpload = (e: React.MouseEvent) => {
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (readOnly) return;
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (readOnly) return;
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    if (readOnly) return;
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
            <span>{label}</span>
            {isCvAttached && (
              <span className="text-[10px] font-normal text-[#0E9F6E] flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                (PDF Attached)
              </span>
            )}
          </label>
          {!readOnly && isCvAttached && (
            <button
              type="button"
              onClick={triggerUpload}
              className="text-[11px] font-bold text-[#0B6BE6] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Upload className="w-3 h-3" />
              <span>Replace CV</span>
            </button>
          )}
        </div>
      )}

      {/* Hidden file input */}
      {!readOnly && (
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleInputChange}
          className="hidden"
        />
      )}

      {isCvAttached ? (
        /* CV Attached View */
        <div
          onClick={handlePreview}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`group p-3 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            isDragging
              ? 'bg-[#EBF3FE] border-[#0B6BE6] border-dashed ring-2 ring-[#0B6BE6]/30'
              : justUploaded
              ? 'bg-[#DDF5EA] border-[#0E9F6E]'
              : 'bg-[#F5F8FC] border-[#E3EAF3] hover:border-[#0B6BE6] hover:bg-[#F0F5FD]'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 border border-red-200 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <FileText className="w-5 h-5" />
            </div>

            <div className="min-w-0 space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-[#0B2A55] truncate group-hover:text-[#0B6BE6] transition-colors">
                  {currentCv.fileName}
                </span>
                <span className="shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-700">
                  PDF
                </span>
              </div>

              <div className="flex items-center gap-2 text-[10px] text-gray-500">
                <span>{currentCv.fileSize}</span>
                <span>•</span>
                <span className="flex items-center gap-1 text-[#0E9F6E] font-semibold">
                  <CheckCircle2 className="w-3 h-3" />
                  Ready for Application Review
                </span>
              </div>
            </div>
          </div>

          {/* Action Controls */}
          <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
            <button
              type="button"
              onClick={handlePreview}
              className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-gray-50 border border-[#E3EAF3] text-gray-700 hover:text-[#0B6BE6] text-xs font-bold flex items-center gap-1 transition-all shadow-2xs cursor-pointer"
              title="Preview CV Document"
            >
              <Eye className="w-3.5 h-3.5 text-[#0B6BE6]" />
              <span>Preview</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-gray-50 border border-[#E3EAF3] text-gray-700 hover:text-[#0B6BE6] text-xs font-bold flex items-center gap-1 transition-all shadow-2xs cursor-pointer"
              title="Download CV"
            >
              <Download className="w-3.5 h-3.5 text-[#0B6BE6]" />
              <span>Download</span>
            </button>

            {!readOnly && (
              <button
                type="button"
                onClick={handleRemoveCv}
                className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors cursor-pointer"
                title="Remove attached CV"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Empty State: No CV uploaded yet */
        <div
          onClick={readOnly ? undefined : triggerUpload}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`p-5 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center text-center space-y-2 ${
            readOnly ? 'border-gray-200 bg-gray-50' : 'border-[#CBD5E1] bg-[#F8FAFC] hover:border-[#0B6BE6] hover:bg-[#F0F5FD] cursor-pointer'
          }`}
        >
          <div className="w-10 h-10 rounded-full bg-gray-200/80 text-gray-400 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>

          <div className="space-y-0.5">
            <span className="font-bold text-xs text-gray-800 block">No CV uploaded yet</span>
            <span className="text-[11px] text-gray-500 block">
              Please attach your academic CV (PDF only, max 5 MB)
            </span>
          </div>

          {!readOnly && (
            <button
              type="button"
              onClick={triggerUpload}
              className="mt-1 px-4 py-2 bg-[#0B6BE6] hover:bg-[#0956b8] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload CV</span>
            </button>
          )}
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-1.5 text-xs text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {justUploaded && (
        <p className="text-[11px] text-[#0E9F6E] font-semibold flex items-center gap-1 animate-fade-in pl-1">
          <Sparkles className="w-3 h-3" />
          CV file attached successfully and ready for submission!
        </p>
      )}

      {/* CV Document Viewer Modal */}
      {isCvAttached && (
        <AcademicCvModal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          user={currentUser}
          fileName={currentCv.fileName}
          fileSize={currentCv.fileSize}
          fileData={currentCv.fileData}
        />
      )}
    </div>
  );
};
