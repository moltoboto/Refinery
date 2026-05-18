/* global React */
// Custom monoline icons — Lora/DM Sans compatible (warm, slightly hand-drawn weight)
// 16px base, 1.5 stroke. Category icons read at 18-20px in the nav rail.

const Icon = ({ name, size = 16, stroke = 1.5 }) => {
  const s = {
    width: size, height: size,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: stroke,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    display: "block",
  };
  switch (name) {
    // ---- Chip / toolbar icons ---------------------------------------------
    case "unread":   return (<svg viewBox="0 0 18 18" {...s}><circle cx="9" cy="9" r="6"/><circle cx="9" cy="9" r="2.6" fill="currentColor" stroke="none"/></svg>);
    case "nav":      return (<svg viewBox="0 0 18 18" {...s}><rect x="2.5" y="3" width="13" height="12" rx="1.5"/><path d="M7 3v12"/><path d="M3.8 6.2h1.6M3.8 9h1.6"/></svg>);
    case "rail":     return (<svg viewBox="0 0 18 18" {...s}><rect x="2.5" y="3" width="13" height="12" rx="1.5"/><path d="M7 3v12"/><circle cx="4.6" cy="6" r="0.8" fill="currentColor" stroke="none"/><circle cx="4.6" cy="9" r="0.8" fill="currentColor" stroke="none"/><circle cx="4.6" cy="12" r="0.8" fill="currentColor" stroke="none"/></svg>);
    case "reading":  return (<svg viewBox="0 0 18 18" {...s}><rect x="2.5" y="3" width="13" height="12" rx="1.5"/><path d="M11 3v12"/><path d="M12.5 6.5h1.4M12.5 8.6h1.4M12.5 10.7h1"/></svg>);
    case "hideList": return (<svg viewBox="0 0 18 18" {...s}><rect x="2.5" y="3" width="13" height="12" rx="1.5"/><path d="M7 3v12M11 3v12" strokeDasharray="1.4 1.6"/></svg>);
    case "compact":  return (<svg viewBox="0 0 18 18" {...s}><path d="M3 5h12M3 8h12M3 11h12M3 14h12"/></svg>);
    case "comfy":    return (<svg viewBox="0 0 18 18" {...s}><path d="M3 4.5h12M3 9h12M3 13.5h12"/></svg>);
    case "aaa":      return (<svg viewBox="0 0 18 18" fill="none"><text x="1.5" y="13" fontFamily="serif" fontSize="11" fontWeight="500" fill="currentColor">A</text><text x="8" y="13" fontFamily="serif" fontSize="14" fontWeight="500" fill="currentColor">A</text></svg>);
    case "refresh":  return (<svg viewBox="0 0 18 18" {...s}><path d="M14.5 9a5.5 5.5 0 1 1-1.6-3.9"/><path d="M14.5 3.5V6h-2.5"/></svg>);
    case "search":   return (<svg viewBox="0 0 18 18" {...s}><circle cx="8" cy="8" r="4.5"/><path d="M11.5 11.5l3 3"/></svg>);
    case "more":     return (<svg viewBox="0 0 18 18" fill="currentColor" stroke="none"><circle cx="4" cy="9" r="1.2"/><circle cx="9" cy="9" r="1.2"/><circle cx="14" cy="9" r="1.2"/></svg>);
    case "back":     return (<svg viewBox="0 0 18 18" {...s}><path d="M11 4l-5 5 5 5"/></svg>);
    case "fwd":      return (<svg viewBox="0 0 18 18" {...s}><path d="M7 4l5 5-5 5"/></svg>);
    case "ext":      return (<svg viewBox="0 0 18 18" {...s}><path d="M10 3h5v5M15 3l-7 7"/><path d="M13 10v3.5A1.5 1.5 0 0 1 11.5 15h-7A1.5 1.5 0 0 1 3 13.5v-7A1.5 1.5 0 0 1 4.5 5H8"/></svg>);
    case "bookmark": return (<svg viewBox="0 0 18 18" {...s}><path d="M5 3h8v12l-4-3-4 3z"/></svg>);
    case "bookmarkFill": return (<svg viewBox="0 0 18 18" fill="currentColor" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.5"><path d="M5 3h8v12l-4-3-4 3z"/></svg>);
    case "check":    return (<svg viewBox="0 0 18 18" {...s}><path d="M3.5 9l3.5 3.5L14.5 5"/></svg>);
    case "share":    return (<svg viewBox="0 0 18 18" {...s}><path d="M9 11V3M6 6l3-3 3 3"/><path d="M3.5 10v4A1.5 1.5 0 0 0 5 15.5h8a1.5 1.5 0 0 0 1.5-1.5v-4"/></svg>);
    case "summarize":return (<svg viewBox="0 0 18 18" {...s}><path d="M4 5h10M4 8.5h10M4 12h6"/><circle cx="14" cy="12" r="1.6" stroke="currentColor"/></svg>);
    case "sparkle":  return (<svg viewBox="0 0 18 18" {...s}><path d="M9 2.5v3M9 12.5v3M2.5 9h3M12.5 9h3M5.2 5.2l1.6 1.6M11.2 11.2l1.6 1.6M5.2 12.8l1.6-1.6M11.2 6.8l1.6-1.6"/></svg>);
    case "spark":    return (<svg viewBox="0 0 18 18" {...s}><path d="M9 2v4M9 12v4M2 9h4M12 9h4"/></svg>);
    case "inbox":    return (<svg viewBox="0 0 18 18" {...s}><path d="M2.5 10v3.5A1.5 1.5 0 0 0 4 15h10a1.5 1.5 0 0 0 1.5-1.5V10"/><path d="M2.5 10l1.5-6A1 1 0 0 1 5 3.4h8a1 1 0 0 1 1 .6l1.5 6"/><path d="M2.5 10h3l1.5 2h4l1.5-2h3"/></svg>);
    case "filter":   return (<svg viewBox="0 0 18 18" {...s}><path d="M3 5h12l-4.5 5v4.5l-3-1.5V10z"/></svg>);
    case "markRead": return (<svg viewBox="0 0 18 18" {...s}><circle cx="9" cy="9" r="6"/><path d="M6.2 9l2 2 3.6-3.6"/></svg>);
    case "plus":     return (<svg viewBox="0 0 18 18" {...s}><path d="M9 4v10M4 9h10"/></svg>);

    // ---- Category glyphs (refined) ----------------------------------------
    case "cat-news":     return (<svg viewBox="0 0 20 20" {...s}><rect x="3" y="4" width="11" height="12" rx="1"/><path d="M14 7h3v7.5a1.5 1.5 0 0 1-1.5 1.5h0a1.5 1.5 0 0 1-1.5-1.5V7"/><path d="M5.5 7.5h6M5.5 10h6M5.5 12.5h4"/></svg>);
    case "cat-ai":       return (<svg viewBox="0 0 20 20" {...s}><circle cx="10" cy="10" r="2"/><circle cx="4.5" cy="5.5" r="1"/><circle cx="15.5" cy="5.5" r="1"/><circle cx="4.5" cy="14.5" r="1"/><circle cx="15.5" cy="14.5" r="1"/><path d="M5.4 6.3l3 2.5M14.6 6.3l-3 2.5M5.4 13.7l3-2.5M14.6 13.7l-3-2.5"/></svg>);
    case "cat-finance":  return (<svg viewBox="0 0 20 20" {...s}><path d="M3 15.5h14"/><path d="M5.5 15.5V11M9 15.5V8M12.5 15.5V5M16 15.5V9.5"/><path d="M3.5 6.5L6 5l3 3.5 3-3 4.5 1.5"/></svg>);
    case "cat-learning": return (<svg viewBox="0 0 20 20" {...s}><path d="M3.5 6L10 3l6.5 3-6.5 3-6.5-3z"/><path d="M6 7.5v3.5c0 1.4 1.8 2.5 4 2.5s4-1.1 4-2.5V7.5"/><path d="M16.5 6v4.5"/></svg>);
    case "cat-tech":     return (<svg viewBox="0 0 20 20" {...s}><rect x="5" y="5" width="10" height="10" rx="1.2"/><rect x="7.5" y="7.5" width="5" height="5" rx="0.5"/><path d="M5 8h-2M5 12h-2M17 8h-2M17 12h-2M8 5V3M12 5V3M8 17v-2M12 17v-2"/></svg>);
    case "cat-watches":  return (<svg viewBox="0 0 20 20" {...s}><circle cx="10" cy="10" r="5"/><path d="M10 7v3l2 1.5"/><path d="M7.5 5l-1-1.5h7l-1 1.5M7.5 15l-1 1.5h7l-1-1.5"/></svg>);
    case "cat-youtube":  return (<svg viewBox="0 0 20 20" {...s}><rect x="2.5" y="5.5" width="15" height="9" rx="2"/><path d="M8.5 8.2v3.6l3-1.8z" fill="currentColor" stroke="none"/></svg>);
    case "cat-reddit":   return (<svg viewBox="0 0 20 20" {...s}><circle cx="10" cy="11" r="6"/><circle cx="10" cy="3.5" r="1"/><path d="M10 4.5v3.5"/><circle cx="7.5" cy="11" r="0.7" fill="currentColor" stroke="none"/><circle cx="12.5" cy="11" r="0.7" fill="currentColor" stroke="none"/><path d="M7.5 13.5c1.5 1 3.5 1 5 0"/></svg>);
    case "cat-email":    return (<svg viewBox="0 0 20 20" {...s}><rect x="2.5" y="5" width="15" height="10" rx="1.5"/><path d="M3 6l7 5 7-5"/></svg>);
    case "cat-dup":      return (<svg viewBox="0 0 20 20" {...s}><rect x="3" y="3" width="9" height="9" rx="1"/><rect x="8" y="8" width="9" height="9" rx="1"/></svg>);

    // ---- Mobile tab bar ---------------------------------------------------
    case "tab-inbox":return (<svg viewBox="0 0 22 22" {...s} strokeWidth={stroke}><path d="M3 12v6a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-6"/><path d="M3 12l2-7a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1l2 7"/><path d="M3 12h4l1 2h6l1-2h4"/></svg>);
    case "tab-feeds":return (<svg viewBox="0 0 22 22" {...s} strokeWidth={stroke}><path d="M4 4a14 14 0 0 1 14 14"/><path d="M4 10a8 8 0 0 1 8 8"/><circle cx="5" cy="17" r="0.9" fill="currentColor" stroke="none"/></svg>);
    case "tab-saved":return (<svg viewBox="0 0 22 22" {...s} strokeWidth={stroke}><path d="M6 3h10v17l-5-4-5 4z"/></svg>);
    case "tab-me":   return (<svg viewBox="0 0 22 22" {...s} strokeWidth={stroke}><circle cx="11" cy="8" r="3.5"/><path d="M4 19c1-3.5 4-5 7-5s6 1.5 7 5"/></svg>);

    default: return null;
  }
};

window.Icon = Icon;
