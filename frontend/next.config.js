const isProd = process.env.NODE_ENV === 'production'
const isStatic = process.env.STATIC_BUILD === 'true'
const repoName = 'PCDiff'

module.exports = {
  assetPrefix: isProd && !isStatic ? `/${repoName}/` : '',
  basePath: isProd && !isStatic ? `/${repoName}` : '',
  repoName: isProd && !isStatic ? `/${repoName}` : '',
  output: 'export',
  images: {
    unoptimized: true,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback.fs = false;
      config.resolve.fallback.module = false;
    }
    return config;
  },
  publicRuntimeConfig: {
    basePath: isProd && !isStatic ? `/${repoName}` : '',
  },
  async headers() {
    return [
      {
        source: '/data/:file*.json',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/json',
          },
        ],
      },
    ]
  },
}