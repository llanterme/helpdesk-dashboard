# Task 01: Project Setup & Infrastructure

## Overview
Initialize the monorepo structure, dependencies, and development tooling for the helpdesk system.

## Prerequisites
- Node.js 18+ installed
- MySQL 8.0 available (Railway or local)
- Git repository initialized

## Technical Requirements

### Project Structure
```
helpdesk-system/
├── apps/
│   └── web/                    # Next.js 14 app
│       ├── src/
│       │   ├── app/           # App router pages
│       │   ├── components/    # React components
│       │   ├── lib/          # Utilities
│       │   └── stores/        # Zustand stores
│       ├── package.json
│       └── next.config.js
├── packages/
│   ├── database/              # Prisma schema
│   │   ├── prisma/
│   │   └── package.json
│   ├── shared/               # TypeScript types
│   │   ├── src/
│   │   └── package.json
│   └── ui/                   # Shared components
│       ├── src/
│       └── package.json
├── package.json              # Root workspace config
├── turbo.json               # Turborepo config
└── .env.example             # Environment template
```

### Dependencies

**Root Package**
```json
{
  "workspaces": ["apps/*", "packages/*"],
  "devDependencies": {
    "turbo": "^1.10.0",
    "typescript": "^5.2.0"
  }
}
```

**Web App (`apps/web/package.json`)**
```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "typescript": "^5.2.0",
    "tailwindcss": "^3.3.0",
    "zustand": "^4.4.0",
    "@tanstack/react-query": "^4.36.0",
    "next-auth": "^4.24.0"
  }
}
```

**Database Package (`packages/database/package.json`)**
```json
{
  "dependencies": {
    "prisma": "^5.6.0",
    "@prisma/client": "^5.6.0"
  }
}
```

### Configuration Files

**Turborepo (`turbo.json`)**
```json
{
  "pipeline": {
    "dev": {
      "cache": false,
      "persistent": true
    },
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**"]
    }
  }
}
```

**Next.js Config (`apps/web/next.config.js`)**
```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  transpilePackages: ["@helpdesk/shared", "@helpdesk/ui"],
}

module.exports = nextConfig
```

**TailwindCSS Config (`apps/web/tailwind.config.js`)**
```js
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        slate: {
          800: '#1e293b',
          900: '#0f172a',
        },
        amber: {
          500: '#f59e0b',
        },
      },
    },
  },
  plugins: [],
}
```

**TypeScript Config (`apps/web/tsconfig.json`)**
```json
{
  "extends": "next/tsconfig.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@helpdesk/shared": ["../../packages/shared/src"],
      "@helpdesk/ui": ["../../packages/ui/src"],
      "@helpdesk/database": ["../../packages/database/src"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
```

## Implementation Steps

1. **Initialize Root Workspace**
   ```bash
   mkdir helpdesk-system && cd helpdesk-system
   npm init -w apps/web -w packages/database -w packages/shared -w packages/ui
   ```

2. **Install Dependencies**
   ```bash
   npm install turbo typescript --save-dev
   cd apps/web && npm install next react react-dom typescript tailwindcss
   cd ../../packages/database && npm install prisma @prisma/client
   ```

3. **Create Configuration Files**
   - `turbo.json` for monorepo orchestration
   - `next.config.js` for Next.js setup
   - `tailwind.config.js` for styling
   - TypeScript configs for each package

4. **Setup Development Scripts**
   ```json
   {
     "scripts": {
       "dev": "turbo run dev",
       "build": "turbo run build",
       "lint": "turbo run lint"
     }
   }
   ```

5. **Environment Configuration**
   - Create `.env.example` with required variables
   - Setup `.env.local` for development

## Acceptance Criteria

### ✅ Project Structure
- [ ] Monorepo structure matches specification
- [ ] All packages have proper `package.json` files
- [ ] Workspace dependencies properly configured

### ✅ Development Environment
- [ ] `npm run dev` starts Next.js development server
- [ ] Hot reloading works for file changes
- [ ] TypeScript compilation works without errors
- [ ] TailwindCSS classes apply correctly

### ✅ Package Integration
- [ ] Shared packages can be imported across apps
- [ ] Turborepo caching and pipeline works
- [ ] Build process completes successfully

### ✅ Basic Pages
- [ ] Root page (`/`) renders successfully
- [ ] 404 page works correctly
- [ ] App router navigation functional

## Testing Instructions

1. **Verify Setup**
   ```bash
   npm run dev
   # Should start development server on http://localhost:3000
   ```

2. **Test Hot Reloading**
   - Modify `apps/web/src/app/page.tsx`
   - Verify changes appear without manual refresh

3. **Test Package Imports**
   - Create simple export in `packages/shared`
   - Import and use in `apps/web`
   - Verify no compilation errors

4. **Test Build Process**
   ```bash
   npm run build
   # Should complete without errors
   ```

## Architecture Patterns Established

- **Monorepo**: Turborepo for workspace management
- **Type Safety**: TypeScript across all packages
- **Styling**: TailwindCSS utility-first approach
- **Build System**: Next.js 14 with App Router
- **Package Structure**: Clear separation of concerns

## Files Created
```
helpdesk-system/
├── package.json
├── turbo.json
├── .env.example
├── apps/web/
│   ├── package.json
│   ├── next.config.js
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── src/app/
│       ├── page.tsx
│       ├── layout.tsx
│       └── globals.css
└── packages/
    ├── database/package.json
    ├── shared/package.json
    └── ui/package.json
```

---
**Next Task**: `02-database-schema.md` - Setup Prisma schema and core database models