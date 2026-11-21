import { useId } from 'react'

export function PopcornCharacter() {
  const id = 'popcorn-' + useId().replace(/[^a-zA-Z0-9_-]/g, '')
  return <svg viewBox="0 0 132 156" fill="none" aria-hidden="true" className="popcorn-character">
    <defs>
      <linearGradient id={`${id}-bucket`} x1="28" y1="75" x2="111" y2="128" gradientUnits="userSpaceOnUse"><stop stopColor="#ffab61" /><stop offset=".42" stopColor="#ed7137" /><stop offset="1" stopColor="#af3e1e" /></linearGradient>
      <linearGradient id={`${id}-stripe`} x1="40" y1="70" x2="87" y2="136" gradientUnits="userSpaceOnUse"><stop stopColor="#fff1d4" /><stop offset="1" stopColor="#e7c28b" /></linearGradient>
      <radialGradient id={`${id}-kernel`} cx=".3" cy=".2" r=".9"><stop stopColor="#fffcef" /><stop offset=".65" stopColor="#ffedbd" /><stop offset="1" stopColor="#dfb66d" /></radialGradient>
      <linearGradient id={`${id}-rim`} x1="29" y1="65" x2="100" y2="76" gradientUnits="userSpaceOnUse"><stop stopColor="#fff3d3" /><stop offset=".5" stopColor="#ffdfa9" /><stop offset="1" stopColor="#c8793e" /></linearGradient>
      <clipPath id={`${id}-clip`}><path d="M28 68Q66 58 104 68L94 128Q67 141 38 128Z" /></clipPath>
      <g id={`${id}-puff`}>
        <path d="M-10 1C-16-4-10-12-4-10C0-17 10-13 10-7C19-7 18 3 12 6C13 14 3 16-2 11C-11 16-16 8-10 1Z" fill={`url(#${id}-kernel)`} stroke="#d1a66d" strokeWidth=".8" />
        <path d="M-7-4Q-4-8 0-4M4-7Q9-6 7-1M-5 5Q0 2 2 7" stroke="#d7b578" strokeWidth="1.4" strokeLinecap="round" opacity=".65" />
        <path d="M-9-3Q-7-8-3-7" stroke="#fffdf3" strokeWidth="2.3" strokeLinecap="round" />
      </g>
    </defs>
    <ellipse cx="66" cy="147" rx="36" ry="5.5" fill="#000" opacity=".22" />
    <path d="M49 129L45 141M82 129L87 141" stroke="#f1d3a2" strokeWidth="7" strokeLinecap="round" />
    <path d="M40 143Q45 138 51 143M81 143Q88 138 93 143" stroke="#c99259" strokeWidth="5" strokeLinecap="round" />
    <path d="M32 95C17 93 13 103 18 113" stroke="#c28a51" strokeWidth="6" strokeLinecap="round" />
    <path d="M31 94C17 93 14 101 18 110" stroke="#fae3b8" strokeWidth="4" strokeLinecap="round" />
    <g className="buddy-arm buddy-wave">
      <path d="M101 93Q123 91 120 71" stroke="#c28a51" strokeWidth="6" strokeLinecap="round" />
      <path d="M101 92Q122 89 120 71M120 71L116 63M120 71L124 61M120 71L130 66M120 71L130 75" stroke="#fae3b8" strokeWidth="4.5" strokeLinecap="round" />
    </g>
    <use href={`#${id}-puff`} transform="translate(42 43) rotate(-25)" />
    <use href={`#${id}-puff`} transform="translate(65 32) rotate(12) scale(1.1)" />
    <use href={`#${id}-puff`} transform="translate(88 43) rotate(24)" />
    <use href={`#${id}-puff`} transform="translate(31 59) rotate(-30) scale(.9)" />
    <use href={`#${id}-puff`} transform="translate(52 56) rotate(8)" />
    <use href={`#${id}-puff`} transform="translate(77 54) rotate(-18)" />
    <use href={`#${id}-puff`} transform="translate(99 59) rotate(32) scale(.86)" />
    <path d="M28 68Q66 58 104 68L94 128Q67 141 38 128Z" fill={`url(#${id}-bucket)`} stroke="#9e482c" strokeWidth="1.5" />
    <g clipPath={`url(#${id}-clip)`}>
      <path d="M40 65L48 136M64 63L66 140M89 64L83 137" stroke={`url(#${id}-stripe)`} strokeWidth="12" />
      <path d="M31 70L42 126" stroke="#fff6d9" strokeWidth="3" opacity=".28" strokeLinecap="round" />
      <path d="M101 72L91 129" stroke="#672b1c" strokeWidth="6" opacity=".12" />
      <path d="M37 124Q67 137 96 124" stroke="#773422" strokeWidth="6" opacity=".1" />
    </g>
    <path d="M28 68Q65 79 104 68" stroke={`url(#${id}-rim)`} strokeWidth="7" strokeLinecap="round" />
    <path d="M30 66Q66 74 102 66" stroke="#fff5da" strokeWidth="2" strokeLinecap="round" />
    <ellipse cx="47" cy="108" rx="8" ry="4.7" fill="#f29c82" opacity=".65" /><ellipse cx="84" cy="108" rx="8" ry="4.7" fill="#f29c82" opacity=".65" />
    <g className="buddy-eyes">
      <ellipse cx="51" cy="99" rx="3.7" ry="5" fill="#3c2a23" /><ellipse cx="80" cy="99" rx="3.7" ry="5" fill="#3c2a23" />
      <circle cx="52" cy="97.5" r="1.2" fill="#fff9e8" /><circle cx="81" cy="97.5" r="1.2" fill="#fff9e8" />
    </g>
    <path d="M58 111Q65.5 120 73 111" stroke="#633a29" strokeWidth="2.8" strokeLinecap="round" />
    <path d="M59 108Q65 111 72 108" stroke="#ffd4ad" strokeWidth="1.5" strokeLinecap="round" opacity=".65" />
    <path d="M106 29L108 24M114 36L120 35" stroke="#f3b46d" strokeWidth="2.4" strokeLinecap="round" />
    <circle cx="30" cy="30" r="2" fill="#ffe0a3" />
  </svg>
}
