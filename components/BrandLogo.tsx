import React from 'react';
import Image from 'next/image';

const BrandLogo = () => {
  return (
    <div className="flex items-center gap-3 select-none">
      <div className="relative h-8 w-8 flex items-center justify-center">
        <Image
          src="/assets/logo.png"
          alt="coachflow"
          width={32}
          height={32}
          priority
          className="object-contain"
        />
      </div>
      <span className="text-lg font-semibold tracking-tight text-white">CoachFlow</span>
    </div>
  );
};

export default BrandLogo;
