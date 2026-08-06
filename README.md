# S3 Explorer

A modern web application for browsing and managing files on Amazon S3 Storage.

![S3 Explorer](https://img.shields.io/badge/React-18-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![License](https://img.shields.io/badge/License-GPLv3-green)

## Features

- 📁 **Browse S3 Buckets** - Navigate through folders and files with an intuitive interface
- 🎹 **Media Preview** - Built-in video player and image viewer for instant preview
- 🗑️ **File Management** - Delete files directly from the browser interface
- 🔐 **Secure Authentication** - Safe credential storage using browser cookies
- 📱 **Responsive Design** - Works seamlessly on desktop, tablet, and mobile devices
- ⚡ **Fast Performance** - Built with Next.js for fast development and optimized production builds
- 🎨 **Modern UI** - Beautiful interface using shadcn/ui components and Tailwind CSS

## Tech Stack

### Frontend
- **React 18** - Modern React with hooks and concurrent features
- **TypeScript** - Type-safe development experience
- **Next.js 16** - React framework with App Router
- **Next.js App Router** - File-based client-side routing
- **React Query (TanStack Query)** - Server state management

### UI & Styling
- **shadcn/ui** - High-quality component library built on Radix UI
- **Radix UI** - Accessible, unstyled components
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Beautiful icon library

### AWS Integration
- **AWS SDK v3** - Official AWS JavaScript SDK
- **@aws-sdk/client-s3** - S3 service client
- **@aws-sdk/s3-request-presigner** - Generate presigned URLs

### Forms & Validation
- **React Hook Form** - Performant forms with easy validation
- **Zod** - TypeScript-first schema validation

## Quick Start

### Prerequisites

- Node.js 18.18+ 
- npm, yarn, pnpm, or bun

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/starfall-org/s3explorer.git
cd s3explorer
```

2. **Install dependencies**
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. **Start development server**
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

4. **Open your browser**
Navigate to `http://localhost:3000`

## Configuration

The application requires AWS S3 credentials. You'll be prompted to provide:

- **S3 Endpoint** - Your S3-compatible endpoint URL
- **Access Key ID** - Your AWS access key
- **Secret Access Key** - Your AWS secret key
- **Bucket Name** - The name of your S3 bucket

These credentials are securely stored in browser cookies for convenience.

## Connection Modes

When logging in, you can choose how the app connects to S3:

- **Browser (Trình duyệt)** — The app uses the AWS SDK directly from the
  browser. This requires your S3 endpoint to support **CORS** (be sure to
  allow the app's origin).
- **Server (Máy chủ)** — The app routes all S3 requests through the Next.js
  server via `/api/s3/*` routes, which proxy the calls server-side. This
  **avoids CORS entirely** and works with any S3-compatible endpoint.

Files are served through a same-origin proxy URL (`/api/s3/proxy?key=...`) in
server mode, so video/audio/image/text previews and downloads work without
extra CORS configuration. The selected mode is stored in the
`s3ConnectionMode` cookie and can be changed later from the connection
settings dialog.

## Usage Guide

### 1. Login
Enter your S3 credentials on the login page to authenticate.

### 2. Navigate Files
- Click on folders to explore their contents
- Use the breadcrumb navigation or back button to return to previous folders
- The current path is always displayed at the top of the page

### 3. Preview Media
- **Videos**: Click any video file to open the built-in video player
- **Images**: Click images to view them in a fullscreen modal
- Use the escape key or close button to exit preview mode

### 4. Manage Files
- Click the delete button next to any file to remove it
- Confirm deletion in the dialog that appears
- Use the refresh button to reload the current directory

## Development

### Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server (after build)
npm run start

# Run ESLint
npm run lint
```

### Project Structure

```
src/
├── app/                # Next.js App Router
│   ├── layout.tsx      # Root layout with providers
│   ├── page.tsx        # Main file browser
│   ├── login/          # Authentication page
│   │   └── page.tsx
│   └── not-found.tsx   # 404 page
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui components
│   ├── FileList.tsx    # File listing component
│   ├── VideoPlayer.tsx # Video player component
│   ├── AudioPlayer.tsx # Audio/music player component
│   ├── TextViewer.tsx  # Text file viewer component
│   └── CacheManager.tsx # Media cache manager
├── hooks/              # Custom React hooks
├── lib/                # Utility functions
└── utils/              # S3 client utilities
```

## Build & Deployment

### Production Build

```bash
npm run build
```

The optimized build will be in the `.next` directory.

### Deployment Options

1. **Node.js Hosting**
   - Deploy to Vercel, Netlify, or any Node.js hosting service
   - Run `npm run build` then `npm run start`
   - The application is a pure client-side app powered by Next.js

## Security Considerations

- Credentials are stored only in browser cookies
- No server-side storage of sensitive information
- Direct S3 API calls from the client
- Consider using CORS restrictions on your S3 bucket

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the GNU General Public License v3.0. See the [LICENSE](LICENSE) file for details.

## Support

If you encounter any issues or have questions:

- Open an issue on GitHub
- Check the existing documentation
- Review the code comments for additional context

## Acknowledgments

- Built with [React](https://reactjs.org/)
- UI components by [shadcn/ui](https://ui.shadcn.com/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- AWS integration by [AWS SDK](https://aws.amazon.com/sdk-for-javascript/)
