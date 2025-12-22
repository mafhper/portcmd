export const auditConfig = {
  targets: [
    {
      id: 'app',
      url: 'http://localhost:5173/portcmd/app/',
      thresholds: {
        performance: 0.7, // Beta target
        accessibility: 0.9,
        'best-practices': 0.9,
        seo: 0.8,
      },
    },
    {
      id: 'promo',
      url: 'http://localhost:5174/portcmd/',
      thresholds: {
        performance: 0.9,
        accessibility: 0.9,
        'best-practices': 0.9,
        seo: 0.9,
      },
    },
  ],
};