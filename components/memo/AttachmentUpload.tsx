import React, { useState, useRef } from 'react';
import { MemoAttachment } from '../../types/memo';

interface AttachmentUploadProps {
  attachments: MemoAttachment[];
  onAttachmentAdd: (file: File) => Promise<void>;
  onAttachmentRemove: (attachmentId: number) => void;
  maxFiles?: number;
  maxFileSize?: number; // in bytes
  allowedTypes?: string[];
  disabled?: boolean;
}

const AttachmentUpload: React.FC<AttachmentUploadProps> = ({
  attachments,
  onAttachmentAdd,
  onAttachmentRemove,
  maxFiles = 10,
  maxFileSize = 10 * 1024 * 1024, // 10MB
  allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'image/gif',
    'text/plain',
  ],
  disabled = false
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string): string => {
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
    if (mimeType.includes('excel') || mimeType.includes('sheet')) return '📊';
    if (mimeType.includes('image')) return '🖼️';
    if (mimeType.includes('text')) return '📃';
    return '📎';
  };

  const validateFile = (file: File): string | null => {
    if (file.size > maxFileSize) {
      return `File size exceeds ${formatFileSize(maxFileSize)} limit`;
    }
    
    if (!allowedTypes.includes(file.type)) {
      return 'File type not allowed';
    }
    
    if (attachments.length >= maxFiles) {
      return `Maximum ${maxFiles} files allowed`;
    }
    
    return null;
  };

  const handleFileSelect = async (files: FileList) => {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const error = validateFile(file);
      
      if (error) {
        alert(`${file.name}: ${error}`);
        continue;
      }
      
      setUploading(prev => [...prev, file.name]);
      
      try {
        await onAttachmentAdd(file);
      } catch (error) {
        alert(`Failed to upload ${file.name}: ${error}`);
      } finally {
        setUploading(prev => prev.filter(name => name !== file.name));
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (disabled) return;
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files);
    }
    // Reset input value to allow selecting the same file again
    e.target.value = '';
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={`
          border-2 border-dashed rounded-xl p-6 text-center transition-all
          ${isDragging 
            ? 'border-[#8252e9] bg-[#8252e9]/10' 
            : 'border-white/20 hover:border-white/40'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={allowedTypes.join(',')}
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled}
        />
        
        <div className="space-y-2">
          <div className="text-2xl">📎</div>
          <p className="text-sm text-white font-medium">
            {isDragging ? 'Drop files here' : 'Click to upload or drag and drop'}
          </p>
          <p className="text-xs text-slate-400">
            Max {maxFiles} files, {formatFileSize(maxFileSize)} each
          </p>
          <p className="text-xs text-slate-500">
            PDF, Word, Excel, Images, Text files
          </p>
        </div>
      </div>

      {/* Attachment List */}
      {(attachments.length > 0 || uploading.length > 0) && (
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Attachments ({attachments.length + uploading.length})
          </h4>
          
          <div className="space-y-2">
            {/* Existing attachments */}
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-lg group hover:border-[#8252e9]/30 transition-all"
              >
                <div className="text-xl">
                  {getFileIcon(attachment.mime_type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {attachment.original_filename}
                  </p>
                  <p className="text-xs text-slate-400">
                    {formatFileSize(attachment.file_size)}
                    {attachment.download_count > 0 && (
                      <span className="ml-2">• Downloaded {attachment.download_count} times</span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.open(`/api/memos/attachments/${attachment.id}/download`, '_blank')}
                    className="text-xs font-bold text-slate-400 hover:text-[#8252e9] uppercase tracking-widest transition-colors"
                  >
                    Download
                  </button>
                  {!disabled && (
                    <button
                      onClick={() => onAttachmentRemove(attachment.id)}
                      className="text-xs font-bold text-slate-400 hover:text-red-400 uppercase tracking-widest transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
            
            {/* Uploading files */}
            {uploading.map((filename) => (
              <div
                key={filename}
                className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-lg opacity-60"
              >
                <div className="text-xl animate-pulse">📎</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {filename}
                  </p>
                  <p className="text-xs text-slate-400">Uploading...</p>
                </div>
                <div className="w-4 h-4 border-2 border-[#8252e9] border-t-transparent rounded-full animate-spin"></div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AttachmentUpload;