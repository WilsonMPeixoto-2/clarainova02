type ConnectionLike = {
  saveData?: boolean;
  effectiveType?: string;
};

type NavigatorWithConnection = Navigator & {
  connection?: ConnectionLike;
};

const UHD_MEDIA_QUERY = '(min-width: 1440px)';

export function subscribeToUhdDisplay(onChange: () => void) {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const mediaQuery = window.matchMedia(UHD_MEDIA_QUERY);
  const handleChange = () => onChange();

  window.addEventListener('resize', handleChange);

  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener('change', handleChange);
  } else {
    mediaQuery.addListener(handleChange);
  }

  return () => {
    window.removeEventListener('resize', handleChange);

    if (mediaQuery.removeEventListener) {
      mediaQuery.removeEventListener('change', handleChange);
    } else {
      mediaQuery.removeListener(handleChange);
    }
  };
}

export function getUhdDisplaySnapshot() {
  if (typeof window === 'undefined') {
    return false;
  }

  const connection = (navigator as NavigatorWithConnection).connection;
  const hasFastConnection = !connection?.saveData && (!connection?.effectiveType || connection.effectiveType === '4g');

  return window.matchMedia(UHD_MEDIA_QUERY).matches && window.devicePixelRatio >= 1.5 && hasFastConnection;
}
