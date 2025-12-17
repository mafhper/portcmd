export const auditConfig = {
  targets: [
    {
      id: 'app',
      url: 'http://localhost:5173/app/',
      thresholds: {
        performance: 0.7, // Beta target
        accessibility: 0.9,
        'best-practices': 0.9,
        seo: 0.8,
      },
    },
    {
      id: 'promo',
      url: 'http://localhost:5173/portcommand/',
      thresholds: {
        performance: 0.9,
        accessibility: 0.9,
        'best-practices': 0.9,
        seo: 0.9,
      },
    },
  ],
};