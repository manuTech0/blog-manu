import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center w-screen h-screen bg-background text-gray-800">
      <h1 className="text-8xl font-bold">404</h1>
      <p className="mt-3 text-lg text-gray-500">
        The page you’re looking for doesn’t exist.
      </p>
      <Link
        href="/"
        className="mt-6 px-5 py-2.5 bg-gray-800 text-white rounded-md hover:bg-gray-700 transition-colors"
      >
        Back to Home
      </Link>
    </div>
  );
}
