/** @type {import('next').NextConfig} */
const nextConfig = {
  // Next.js crée le mini-serveur optimisé
  output: 'standalone',
  
  // Proxy pour contourner les blocages de cookies tiers du navigateur
  async rewrites() {
    return [
      {
        // Toutes les requêtes du navigateur vers /api/...
        source: '/api/:path*',
        // ...sont redirigées de manière invisible vers l'API Render
        destination: 'https://journal-collectif-api.onrender.com/api/:path*'
      }
    ];
  }
};

export default nextConfig;
