import React from 'react';
import './Skeleton.css';

export const Skeleton = ({ 
  width = '100%', 
  height = '20px', 
  variant = 'text',
  className = '' 
}) => {
  return (
    <div 
      className={`skeleton skeleton-${variant} ${className}`}
      style={{ width, height }}
    />
  );
};

export const SkeletonText = ({ lines = 3, width = '100%' }) => {
  return (
    <div className="skeleton-text-container">
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton 
          key={index}
          width={index === lines - 1 ? '70%' : width}
          height="16px"
        />
      ))}
    </div>
  );
};

export const SkeletonCard = () => {
  return (
    <div className="skeleton-card">
      <Skeleton variant="rect" height="180px" className="skeleton-card-image" />
      <div className="skeleton-card-content">
        <Skeleton width="60%" height="24px" className="skeleton-card-title" />
        <SkeletonText lines={2} />
      </div>
    </div>
  );
};

export const SkeletonTable = ({ rows = 5, columns = 4 }) => {
  return (
    <div className="skeleton-table">
      <div className="skeleton-table-header">
        {Array.from({ length: columns }).map((_, index) => (
          <Skeleton key={index} height="40px" />
        ))}
      </div>
      <div className="skeleton-table-body">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="skeleton-table-row">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton key={colIndex} height="32px" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export const SkeletonAvatar = ({ size = '40px', variant = 'circle' }) => {
  return (
    <Skeleton 
      variant={variant}
      width={size}
      height={size}
      className="skeleton-avatar"
    />
  );
};

export const SkeletonButton = ({ width = '120px' }) => {
  return (
    <Skeleton 
      variant="rect"
      width={width}
      height="40px"
      className="skeleton-button"
    />
  );
};

export default Skeleton;
