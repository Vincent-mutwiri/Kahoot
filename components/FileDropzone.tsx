import React, { useCallback, useState } from 'react';
import { Upload, X } from 'lucide-react';
import { Button } from './Button';
import styles from './FileDropzone.module.css';

export interface FileDropzoneProps {
  className?: string;
  accept?: string;
  maxFiles?: number;
  maxSize?: number; // in bytes
  onFilesSelected?: (files: File[]) => void;
  onUploadComplete?: (fileUrl: string) => void;
  disabled?: boolean;
  icon?: React.ReactNode;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
}

export const FileDropzone: React.FC<FileDropzoneProps> = ({
  className = '',
  accept,
  maxFiles = 1,
  maxSize,
  onFilesSelected,
  onUploadComplete,
  disabled = false,
  icon = <Upload size={48} />,
  title = "Click to upload or drag and drop",
  subtitle,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (disabled) return;
    
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(true);
    } else if (e.type === "dragleave") {
      setIsDragging(false);
    }
  }, [disabled]);

  const validateFiles = useCallback((fileList: FileList | null): File[] => {
    if (!fileList) return [];
    
    const files = Array.from(fileList);
    
    if (files.length > maxFiles) {
      setError(`Maximum ${maxFiles} file${maxFiles === 1 ? '' : 's'} allowed`);
      return [];
    }

    if (accept) {
      const acceptedTypes = accept.split(',').map(type => type.trim());
      const invalidFiles = files.filter(file => 
        !acceptedTypes.some(type => {
          if (type.startsWith('.')) {
            return file.name.toLowerCase().endsWith(type.toLowerCase());
          }
          return file.type.match(new RegExp(type.replace('*', '.*')));
        })
      );
      
      if (invalidFiles.length > 0) {
        setError(`Invalid file type. Accepted: ${accept}`);
        return [];
      }
    }

    if (maxSize) {
      const oversizedFiles = files.filter(file => file.size > maxSize);
      if (oversizedFiles.length > 0) {
        setError(`File size exceeds ${Math.round(maxSize/1024/1024)}MB limit`);
        return [];
      }
    }

    setError(null);
    return files;
  }, [accept, maxFiles, maxSize]);

  const uploadToS3 = useCallback(async (files: File[]) => {
    const file = files[0];
    setUploading(true);
    
    try {
      const response = await fetch('/_api/upload/get-presigned-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
        }),
      });

      if (!response.ok) {
        throw new Error('Could not get pre-signed URL.');
      }

      const { url, key } = await response.json();

      const uploadResponse = await fetch(url, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });

      if (!uploadResponse.ok) {
        throw new Error('Upload to S3 failed.');
      }

      const fileUrl = `https://vincent-bucket2025.s3.eu-north-1.amazonaws.com/${key}`;
      
      if (onUploadComplete) {
        onUploadComplete(fileUrl);
      }
    } catch (error) {
      console.error('Upload error:', error);
      setError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  }, [onUploadComplete]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (disabled || uploading) return;
    
    setIsDragging(false);
    
    const files = validateFiles(e.dataTransfer.files);
    if (files.length > 0) {
      if (onFilesSelected) {
        onFilesSelected(files);
      }
      if (onUploadComplete) {
        uploadToS3(files);
      }
    }
  }, [disabled, uploading, validateFiles, onFilesSelected, uploadToS3]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled || uploading) return;
    
    const files = validateFiles(e.target.files);
    if (files.length > 0) {
      if (onFilesSelected) {
        onFilesSelected(files);
      }
      if (onUploadComplete) {
        uploadToS3(files);
      }
    }
    e.target.value = '';
  }, [disabled, uploading, validateFiles, onFilesSelected, uploadToS3]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const defaultSubtitle = (accept || maxFiles > 1) && (
    <>
      {accept && `Accepted types: ${accept}`}
      {maxFiles > 1 && ` (Up to ${maxFiles} files)`}
    </>
  );

  return (
    <div className={`${styles.container} ${className ?? ""}`}>
      <label
        className={`
          ${styles.dropzone}
          ${isDragging ? styles.dragging : ''}
          ${disabled || uploading ? styles.disabled : ''}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          onChange={handleFileInput}
          accept={accept}
          multiple={maxFiles > 1}
          disabled={disabled || uploading}
          aria-label="File upload"
        />
        
        <span className={styles.icon}>{icon}</span>
        <span className={styles.title}>{uploading ? 'Uploading...' : title}</span>
        {(subtitle || defaultSubtitle) && (
          <span className={styles.subtitle}>{subtitle || defaultSubtitle}</span>
        )}
      </label>

      {error && (
        <div className={styles.error} role="alert">
          <span>{error}</span>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={clearError}
            aria-label="Clear error"
          >
            <X size={16} />
          </Button>
        </div>
      )}
    </div>
  );
};