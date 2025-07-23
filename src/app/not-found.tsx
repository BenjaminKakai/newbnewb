// app/not-found.tsx or pages/404.tsx
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white dark:bg-black flex flex-col items-center justify-center p-4">
      <div className="text-center space-y-6">
        {/* Logo */}
        <div className="mb-4">
          <img 
            src="/dark-logo.svg" 
            alt="WasaaChat" 
            className="mx-auto"
          />
        </div>
        
        {/* Not Found Text */}
        <div className="">
          <p className="text-gray-500 dark:text-white max-w-md mx-auto">
            The page you are looking for does not exist or has been moved.
          </p>
        </div>
        
        {/* Back to Home Button */}
        <div className="pt-1">
          <Link 
            href="/"
            className="inline-block bg-[#2A8FEA] text-white px-8 py-1 rounded-xl font-medium hover:bg-gray-600 transition-colors"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}