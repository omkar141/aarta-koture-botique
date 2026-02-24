import React, { useState, useEffect } from 'react';
import brandConfig from '../config/branding';

const Logo = ({ variant = 'full', className = '', size = 'md' }) => {
  const { logo } = brandConfig;
  const [customLogo, setCustomLogo] = useState(null);
  const [businessName, setBusinessName] = useState(logo.text);
  const [businessTagline, setBusinessTagline] = useState(logo.subtitle);

  // Load custom logo and business info from settings
  useEffect(() => {
    const savedSettings = localStorage.getItem('appSettings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      if (settings.customLogo) {
        setCustomLogo(settings.customLogo);
      }
      if (settings.businessName) {
        setBusinessName(settings.businessName);
      }
      if (settings.businessTagline) {
        setBusinessTagline(settings.businessTagline);
      }
    }
  }, []);

  // Size configurations
  const sizes = {
    sm: { circle: 'w-8 h-8', text: 'text-sm', subtitle: 'text-xs', img: 'h-8' },
    md: { circle: 'w-12 h-12', text: 'text-lg', subtitle: 'text-xs', img: 'h-12' },
    lg: { circle: 'w-16 h-16', text: 'text-2xl', subtitle: 'text-sm', img: 'h-16' },
    xl: { circle: 'w-24 h-24', text: 'text-3xl', subtitle: 'text-base', img: 'h-24' }
  };

  const sizeConfig = sizes[size] || sizes.md;

  // If custom logo exists, use it for all variants
  if (customLogo) {
    if (variant === 'icon') {
      return (
        <div className={`flex items-center justify-center ${className}`}>
          <img src={customLogo} alt="Logo" className={`${sizeConfig.img} object-contain`} />
        </div>
      );
    }

    if (variant === 'text') {
      return (
        <div className={`flex items-center gap-2 ${className}`}>
          <img src={customLogo} alt="Logo" className={`${sizeConfig.img} object-contain`} />
          <h1 
            className={`${sizeConfig.text} font-bold text-gray-800`}
            style={{ fontFamily: logo.fontFamily }}
          >
            {businessName}
          </h1>
        </div>
      );
    }

    // Full logo with custom image
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <img src={customLogo} alt="Logo" className={`${sizeConfig.img} object-contain`} />
        <div className="flex flex-col">
          <h1 
            className={`${sizeConfig.text} font-bold text-gray-800 leading-tight`}
            style={{ fontFamily: logo.fontFamily }}
          >
            {businessName}
          </h1>
          {businessTagline && (
            <p className={`${sizeConfig.subtitle} text-gray-600 italic`}
               style={{ fontFamily: logo.fontFamily }}>
              {businessTagline}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Default logo rendering (existing code)
  if (variant === 'icon') {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className={`${sizeConfig.circle} rounded-full border-3 border-brand-gold bg-gradient-to-br from-pink-100 via-pink-200 to-pink-100 flex items-center justify-center shadow-md`}>
          <span className="text-lg font-bold text-gray-800" style={{ fontFamily: logo.fontFamily }}>AK</span>
        </div>
      </div>
    );
  }

  if (variant === 'text') {
    return (
      <div className={`flex items-center ${className}`}>
        <h1 
          className={`${sizeConfig.text} font-bold text-gray-800`}
          style={{ fontFamily: logo.fontFamily }}
        >
          {businessName}
        </h1>
      </div>
    );
  }

  // Full logo with circular watercolor design (matching actual logo)
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Circular logo matching the uploaded design */}
      <div className={`${sizeConfig.circle} rounded-full border-3 border-brand-gold bg-gradient-to-br from-pink-100 via-pink-200 to-pink-100 flex items-center justify-center shadow-lg relative overflow-hidden`}>
        {/* Watercolor effect overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-pink-200/40 via-transparent to-pink-300/30"></div>
        <span className="text-xl font-bold text-gray-800 relative z-10" style={{ fontFamily: logo.fontFamily }}>AK</span>
      </div>
      
      {/* Text */}
      <div className="flex flex-col">
        <h1 
          className={`${sizeConfig.text} font-bold text-gray-800 leading-tight`}
          style={{ fontFamily: logo.fontFamily }}
        >
          {businessName}
        </h1>
        {businessTagline && (
          <p className={`${sizeConfig.subtitle} text-gray-600 italic`}
             style={{ fontFamily: logo.fontFamily }}>
            {businessTagline}
          </p>
        )}
      </div>
    </div>
  );
};

export default Logo;
