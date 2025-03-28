import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FileUploadPreviewProps {
  file: File;
  onCancel: () => void;
}

export default function FileUploadPreview({ file, onCancel }: FileUploadPreviewProps) {
  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  return (
    <div className="mt-1 sm:mt-3 bg-gray-50 p-2 sm:p-3 rounded-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
          <div className="bg-gray-200 h-10 w-10 sm:h-12 sm:w-12 rounded-md flex items-center justify-center text-gray-500 flex-shrink-0">
            {file.type.startsWith('image/') ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            )}
          </div>
          <div className="overflow-hidden flex-1">
            <p className="font-medium text-gray-800 text-sm sm:text-base truncate">{file.name}</p>
            <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onCancel}
          className="text-gray-500 hover:text-red-500 h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0"
        >
          <X className="h-4 w-4 sm:h-5 sm:w-5" />
        </Button>
      </div>
    </div>
  );
}
