import Link from 'next/link';
import { Button } from 'rizzui';
import { PiArrowLeftBold, PiArrowSquareOutBold, PiCubeBold } from 'react-icons/pi';

export default function StudioPlaceholderPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-12 dark:bg-gray-900">
      <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-lg dark:border-gray-800 dark:bg-gray-950">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <PiCubeBold className="h-8 w-8" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">
          Studio & Workspace Module
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
          You are working inside the decoupled <strong className="text-gray-900 dark:text-white">Public Frontend</strong> copy.
          The enterprise Studio, form builders, and internal dashboards are housed in the main Saby codebase.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/">
            <Button className="w-full sm:w-auto flex items-center gap-2">
              <PiArrowLeftBold className="h-4 w-4" />
              Return to Saby Chat
            </Button>
          </Link>
          <a
            href="https://saby.ai/studio"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" className="w-full sm:w-auto flex items-center gap-2">
              Open Live Studio
              <PiArrowSquareOutBold className="h-4 w-4" />
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}
