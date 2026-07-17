import React from "react";

export default function PrinterCarousel() {
  const brands = ["EVOLIS", "ZEBRA", "FARGO", "DATACARD", "HITI"];
  
  // Duplicate list to create seamless infinite scrolling
  const carouselBrands = [...brands, ...brands];

  return (
    <div className="py-lg overflow-hidden whitespace-nowrap border-b border-outline-variant/10">
      <div className="logo-carousel flex gap-12 items-center">
        {carouselBrands.map((brand, idx) => (
          <span 
            key={`${brand}-${idx}`} 
            className="font-headline-md font-bold text-slate-300 mx-12 select-none"
          >
            {brand}
          </span>
        ))}
      </div>
    </div>
  );
}
