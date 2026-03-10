/**
 * Chart Theme Utilities
 * Provides consistent theming for Recharts components across light and dark modes
 */

export const getTooltipStyles = (isDark: boolean = false) => {
  return {
    contentStyle: {
      backgroundColor: isDark ? '#1e293b' : '#ffffff',
      border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
      borderRadius: '12px',
      boxShadow: isDark 
        ? '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)'
        : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      padding: '12px',
    },
    labelStyle: {
      color: isDark ? '#f1f5f9' : '#0f172a',
      fontWeight: 700,
      fontSize: '11px',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.05em',
      marginBottom: '8px',
    },
    itemStyle: {
      color: isDark ? '#cbd5e1' : '#475569',
      fontSize: '10px',
      fontWeight: 600,
      padding: '2px 0',
    },
  };
};

export const getAxisStyles = (isDark: boolean = false) => {
  return {
    stroke: isDark ? '#64748b' : '#94a3b8',
    fontSize: 10,
    fontWeight: 900,
    fill: isDark ? '#64748b' : '#94a3b8',
  };
};

export const getGridStyles = (isDark: boolean = false) => {
  return {
    stroke: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
    strokeDasharray: '3 3',
  };
};

/**
 * Hook to get current theme
 */
export const useChartTheme = () => {
  const isDark = document.documentElement.classList.contains('dark');
  
  return {
    isDark,
    tooltip: getTooltipStyles(isDark),
    axis: getAxisStyles(isDark),
    grid: getGridStyles(isDark),
  };
};
