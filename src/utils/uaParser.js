/**
 * Lightweight User-Agent Parser
 * Provides human-readable Browser and OS info from raw User-Agent strings.
 */
export const parseUA = (uaString) => {
  if (!uaString) return { browser: 'Unknown', os: 'Unknown' };

  const ua = uaString.toLowerCase();
  let browser = 'Unknown';
  let os = 'Unknown';

  // Browser detection
  if (ua.includes('edg/')) browser = 'Edge';
  else if (ua.includes('opr/') || ua.includes('opera/')) browser = 'Opera';
  else if (ua.includes('chrome/')) browser = 'Chrome';
  else if (ua.includes('firefox/')) browser = 'Firefox';
  else if (ua.includes('safari/') && !ua.includes('chrome/')) browser = 'Safari';
  else if (ua.includes('trident/') || ua.includes('msie ')) browser = 'IE';

  // OS detection
  if (ua.includes('win')) os = 'Windows';
  else if (ua.includes('mac')) os = 'macOS';
  else if (ua.includes('linux')) os = 'Linux';
  else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';

  return { browser, os };
};

export default parseUA;
