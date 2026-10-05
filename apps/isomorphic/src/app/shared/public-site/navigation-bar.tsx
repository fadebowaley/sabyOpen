'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import PublicAuthModal from '@/app/shared/public-site/public-auth-modal';

interface NavigationBarProps {
  onJoinClick?: () => void;
}

export default function NavigationBar({ onJoinClick }: NavigationBarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const pathname = usePathname() || '/';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setIsMobileMenuOpen(false);
  };

  const handleJoinClick = () => {
    if (onJoinClick) {
      onJoinClick();
    } else {
      setIsAuthModalOpen(true);
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <nav
        className={`sticky top-0 z-50 w-full transition-all duration-300 ${
          isScrolled ? 'bg-white shadow-md' : 'bg-white'
        }`}
      >
        <div className="mx-auto max-w-7xl px-6 py-1">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <img
                src="/saby-logo.png"
                alt="SABY Logo"
                className="w-auto"
                style={{ height: '120px' }}
              />
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden items-center gap-8 md:flex">
              <button
                onClick={() => scrollToSection('features-section')}
                className="text-sm font-medium text-black transition-colors hover:text-blue-600"
              >
                Features
              </button>
              <button
                onClick={() => scrollToSection('use-cases-section')}
                className="text-sm font-medium text-black transition-colors hover:text-blue-600"
              >
                Use Cases
              </button>
              <button
                onClick={() => scrollToSection('faqs-section')}
                className="text-sm font-medium text-black transition-colors hover:text-blue-600"
              >
                FAQs
              </button>
              <button
                onClick={handleJoinClick}
                className="rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-2 text-sm font-medium text-white shadow-lg shadow-blue-500/30 transition-all hover:from-blue-400 hover:to-blue-500"
              >
                Request Demo
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="p-2 text-black md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isMobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="mt-4 border-t border-gray-200 pb-4 pt-4 md:hidden">
              <div className="flex flex-col gap-4">
                <button
                  onClick={() => scrollToSection('features-section')}
                  className="text-left font-medium text-black transition-colors hover:text-blue-600"
                >
                  Features
                </button>
                <button
                  onClick={() => scrollToSection('use-cases-section')}
                  className="text-left font-medium text-black transition-colors hover:text-blue-600"
                >
                  Use Cases
                </button>
                <button
                  onClick={() => scrollToSection('faqs-section')}
                  className="text-left font-medium text-black transition-colors hover:text-blue-600"
                >
                  FAQs
                </button>
                <button
                  onClick={handleJoinClick}
                  className="mt-2 w-full rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-2 text-center font-medium text-white transition-all hover:from-blue-400 hover:to-blue-500"
                >
                  Request Demo
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      <PublicAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        callbackPath={pathname}
        isLightTheme
      />
    </>
  );
}
