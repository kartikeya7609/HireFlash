// Reusable HireFlash brand logo SVG component
// Replace the Hammer icon with this across all pages
export const BrandLogo = ({ size = 20, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Hexagon background */}
    <path
      d="M16 2L28.124 9V23L16 30L3.876 23V9L16 2Z"
      fill="url(#grad)"
    />
    {/* Lightning bolt */}
    <path
      d="M18.5 5L10 17.5H16L13.5 27L23 14.5H17L18.5 5Z"
      fill="white"
    />
    <defs>
      <linearGradient id="grad" x1="3.876" y1="2" x2="28.124" y2="30" gradientUnits="userSpaceOnUse">
        <stop stopColor="#f59e0b" />
        <stop offset="1" stopColor="#d97706" />
      </linearGradient>
    </defs>
  </svg>
);

export const BRAND_NAME = 'HireFlash';
