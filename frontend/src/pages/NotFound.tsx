// Last Modified: 2025-11-23 17:30
import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
      <div className="text-center px-6">
        <div className="relative">
          <h1 className="text-[12rem] font-bold text-muted-foreground/20 select-none">
            404
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-primary/10 rounded-full p-8">
              <div className="bg-primary/20 rounded-full p-6">
                <div className="bg-primary rounded-full p-4">
                  <span className="text-4xl font-bold text-primary-foreground">?</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <h2 className="text-3xl font-bold mt-8 mb-4">Page Not Found</h2>
        <p className="text-muted-foreground text-lg mb-8 max-w-md mx-auto">
          The page you're looking for doesn't exist or has been moved to a new location.
        </p>

        <div className="flex items-center justify-center gap-4">
          <Link
            to="/"
            className="px-6 py-3 rounded-lg border hover:bg-muted transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </Link>
          <Link
            to="/dashboard"
            className="px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-2"
          >
            <Home className="w-4 h-4" />
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}