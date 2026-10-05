import Link from 'next/link';
import { PiArrowLeft, PiBuildings } from 'react-icons/pi';

export default function StudioPlaceholderPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 text-center dark:bg-gray-900">
      <div className="mx-auto max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-950">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <PiBuildings className="h-7 w-7" />
        </div>
        <h1 className="mb-2 text-xl font-bold text-gray-900 dark:text-gray-100">
          Studio Preview Placeholder
        </h1>
        <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
          Studio and Workspace are internal modules excluded from this public frontend working copy.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-white transition hover:bg-primary/90"
        >
          <PiArrowLeft className="h-4 w-4" />
          Return to Public Landing Page
        </Link>
      </div>
    </div>
  );
}
