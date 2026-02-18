import React from "react";
import { Download } from "lucide-react";

type DownloadButtonProps = {
  driveLink?: string;
  buttonText: string;
  onUnavailable?: () => void;
};

export default function DownloadButton({ driveLink, buttonText, onUnavailable }: DownloadButtonProps) {
  const handleClick = () => {
    if (driveLink) {
      window.open(driveLink, "_blank");
    } else {
      onUnavailable?.();
    }
  };

  return (
    <button
      className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition flex items-center gap-2"
      onClick={handleClick}
    >
      <Download className="w-5 h-5" />
      {buttonText}
    </button>
  );
}