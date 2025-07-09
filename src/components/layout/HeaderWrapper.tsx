// src/components/layout/HeaderWrapper.tsx
"use client";

import { usePathname } from 'next/navigation';
import Header from './Header';

/**
 * A wrapper component for the Header that conditionally renders it based on the current pathname.
 * The Header is not rendered on presenter-specific pages.
 * @returns {JSX.Element} The rendered HeaderWrapper component.
 */
export default function HeaderWrapper() {
  const pathname = usePathname();
  const isPresenterPage = pathname?.startsWith('/presenter/') || false;

  return (
    <>
      {!isPresenterPage && <Header />}
    </>
  );
}