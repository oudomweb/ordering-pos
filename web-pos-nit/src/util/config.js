// export const Config = {
//   base_url: import.meta.env.VITE_BASE_URL,
//   version: import.meta.env.VITE_APP_VERSION,
//   token: import.meta.env.VITE_APP_TOKEN,
//   image_path: import.meta.env.VITE_IMAGE_PATH,
// };

// export const Config = {
//   base_url: "http://localhost:8080/api/",
//   version: "1.0",
//   token: "",
//   image_path: "http://localhost:/fullstack/",
// };


// Helper to get consistent API URL
const getDynamicBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl && !envUrl.includes("localhost")) return envUrl.endsWith('/') ? envUrl : `${envUrl}/`;

  // Fallback for local/mobile testing
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    // If we're on a real IP or Railway, but backend is localhost, try to point to the same host on port 8080
    if (host !== 'localhost' && (!envUrl || envUrl.includes('localhost'))) {
      return `http://${host}:8080/api/`;
    }
  }
  return "http://localhost:8080/api/";
};

const formattedBaseUrl = getDynamicBaseUrl();
const defaultImagePath = formattedBaseUrl.replace('/api/', '/public/images/');

export const Config = {
  base_url: formattedBaseUrl,
  version: "1.0",
  token: "",
  image_path: import.meta.env.VITE_IMAGE_PATH || defaultImagePath,
  platform_url: import.meta.env.VITE_PLATFORM_URL || "http://localhost:3000",
  optimizeCloudinary: (url, transform = "f_auto,q_auto") => {
    if (!url || typeof url !== 'string' || !url.includes("cloudinary.com")) return url;
    if (url.includes("/upload/f_auto") || url.includes("/upload/w_")) return url;
    if (url.includes("/upload/")) {
      return url.replace("/upload/", `/upload/${transform}/`);
    }
    return url;
  },
  getFullImagePath: (imagePart) => {
    if (!imagePart) return "";
    if (imagePart.startsWith('http')) return Config.optimizeCloudinary(imagePart);
    const base = Config.image_path.endsWith('/') ? Config.image_path : `${Config.image_path}/`;
    return Config.optimizeCloudinary(`${base}${imagePart}`);
  },
  getProductImagePath: (imagePart) => {
    if (!imagePart) return "";
    if (imagePart.startsWith('http') || Config.image_path.includes('cloudinary')) return Config.getFullImagePath(imagePart);
    const base = Config.image_path.endsWith('/') ? Config.image_path : `${Config.image_path}/`;
    return Config.optimizeCloudinary(`${base}image_pos/${imagePart}`);
  },
};