import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "pic.pulpitstream.com",
                pathname: "/**",
            },
        ],
    },
};

module.exports = nextConfig;
