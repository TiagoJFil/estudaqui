import React from "react";
import FileIcon from "./icons/FileIcon";
import CloseIcon from "./icons/CloseIcon";

interface RecentFileProps {
  filename: string;
  onDelete?: () => void;
}

const RecentFile: React.FC<RecentFileProps> = ({ filename, onDelete }) => {
  return (
    <div className="flex items-center py-2 px-2 text-white/90 hover:bg-white/10 rounded-md transition-colors cursor-pointer group w-full">
      <div className="flex items-center justify-center w-6 h-6 flex-shrink-0">
        <FileIcon width={16} height={16} />
      </div>
      <span className="truncate ml-2 flex-1">{filename}</span>
      {onDelete && (
        <button
          className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer p-1 hover:bg-white/5 rounded-full flex-shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          aria-label={`Delete ${filename}`}
        >
          <CloseIcon width={14} height={14} />
        </button>
      )}
    </div>
  );
};

export default RecentFile;
