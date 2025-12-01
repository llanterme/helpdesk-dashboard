/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@helpdesk/shared", "@helpdesk/ui", "@helpdesk/database"],
}

module.exports = nextConfig