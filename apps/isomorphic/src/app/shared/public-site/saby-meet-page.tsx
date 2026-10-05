'use client';

import PublicThemeToggleButton from './public-theme-toggle-button';
import SabyMeetSection from './saby-meet-section';
import { usePublicTheme, type PublicThemeMode } from './use-public-theme';

export default function SabyMeetPageClient({
  initialTheme = 'dark',
}: {
  initialTheme?: PublicThemeMode;
}) {
  const { isLightTheme, toggleTheme } = usePublicTheme(initialTheme, {
    storageKey: 'saby:theme-preference:public-pages',
  });

  return (
    <main
      className={`min-h-screen ${
        isLightTheme ? 'bg-[#f5f5f3] text-[#111827]' : 'bg-[#0b0f16] text-white'
      }`}
    >
      <div className="fixed right-4 top-4 z-50">
        <PublicThemeToggleButton
          mode={isLightTheme ? 'light' : 'dark'}
          onChange={toggleTheme}
        />
      </div>
      <SabyMeetSection isLightTheme={isLightTheme} />
    </main>
  );
}
