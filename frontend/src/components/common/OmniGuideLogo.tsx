import React, { useState } from 'react';

interface OmniGuideLogoProps {
  size?: 'sidebar' | 'compact' | 'icon';
  showTagline?: boolean;
  className?: string;
}

export const OmniGuideLogo: React.FC<OmniGuideLogoProps> = ({
  size = 'sidebar',
  showTagline = true,
  className = '',
}) => {
  const [imgError, setImgError] = useState(false);

  // Icon only (for mobile drawer or favicon contexts)
  if (size === 'icon') {
    return (
      <div className={`inline-flex items-center ${className}`}>
        <img
          src="/logo_symbol.png"
          alt="OmniGuide"
          className="w-8 h-8 object-contain"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  // Primary Sidebar Brand Variant
  return (
    <div className={`flex flex-col items-center text-center ${className}`}>
      {!imgError ? (
        <img
          src="/logo_full.png"
          alt="OmniGuide — AI-Powered Brand Governance"
          className="w-auto h-10 sm:h-11 max-w-[210px] object-contain select-none transition-transform duration-200 hover:scale-[1.01]"
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="flex items-center gap-2">
          <img src="/logo_symbol.png" alt="OmniGuide Symbol" className="w-8 h-8 object-contain" />
          <span className="text-xl font-bold tracking-tight text-slate-900">
            Omni<span className="text-teal-600">Guide</span>
          </span>
        </div>
      )}

      {showTagline && (
        <p className="text-[11px] sm:text-xs font-bold text-slate-700 tracking-tight mt-2 leading-snug">
          <span>Governance, </span>
          <span className="text-teal-600 font-extrabold">Guided by Intelligence.</span>
        </p>
      )}
    </div>
  );
};
