export default {
  async rewrites() {
    return [
      {
        source: "/clerk/:path*",
        destination: "https://frank-gull-9.clerk.accounts.dev/:path*",
      },
    ];
  },
};
