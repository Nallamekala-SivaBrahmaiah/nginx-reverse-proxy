import React, { useState } from 'react';
import { Star } from 'lucide-react';

const StarRating = ({ rating = 0, onChange = null, size = 16 }) => {
  const [hoverRating, setHoverRating] = useState(0);

  const handleClick = (value) => {
    if (onChange) {
      onChange(value);
    }
  };

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((val) => {
        const isFilled = hoverRating ? val <= hoverRating : val <= rating;
        return (
          <Star
            key={val}
            size={size}
            onClick={() => handleClick(val)}
            onMouseEnter={() => onChange && setHoverRating(val)}
            onMouseLeave={() => onChange && setHoverRating(0)}
            className={`transition ${onChange ? 'cursor-pointer' : ''} ${
              isFilled
                ? 'text-yellow-400 fill-yellow-400'
                : 'text-gray-300 dark:text-zinc-700'
            }`}
          />
        );
      })}
    </div>
  );
};

export default StarRating;
