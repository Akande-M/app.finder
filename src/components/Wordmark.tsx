/**
 * "Finder" wordmark. The "i" is a flower: a green stem stands in for the letter's stroke,
 * and a red bloom sits where the dot would be.
 *
 * The flower is an inline SVG 1em tall. Its bottom edge sits on the text baseline,
 * so it scales and aligns with the surrounding type at any font size.
 */
export const FLOWER_RED = "#d7263d";

export function FlowerI({ className = "" }: { className?: string }) {
  // viewBox units: 100 = 1em; y=100 is the baseline.
  return (
    <svg viewBox="0 0 36 100" className={`inline-block h-[1em] w-[0.36em] ${className}`} aria-hidden overflow="visible">
      {/* stem, the height of a lowercase i */}
      <path d="M16 96 L16 50" stroke="var(--color-plant)" strokeWidth="12" strokeLinecap="round" />
      {/* leaf */}
      <path d="M17 78 C 24 66, 33 64, 36 66 C 33 75, 25 80, 17 78 Z" fill="var(--color-plant)" />
      {/* bloom where the dot goes: five petals around a pollen centre */}
      <g transform="translate(16 24)">
        {[0, 72, 144, 216, 288].map((a) => (
          <ellipse key={a} cx="0" cy="-8.5" rx="7" ry="9.4" fill={FLOWER_RED} transform={`rotate(${a})`} />
        ))}
        <circle r="4.8" fill="var(--color-pollen)" />
      </g>
    </svg>
  );
}

export default function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span role="img" aria-label="Finder" className={`display inline-flex items-baseline whitespace-nowrap ${className}`} dir="ltr">
      <span aria-hidden>F</span>
      <FlowerI className="mx-[0.035em]" />
      <span aria-hidden>nder</span>
    </span>
  );
}
