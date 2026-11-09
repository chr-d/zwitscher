import { Link } from "react-router";

export default function NotFound() {
  return (
    <>
      <title>404 NotFound - zwitscher</title>
      <section className="flex min-h-full flex-col items-center bg-neutral">
        <div className="m-8 max-w-md rounded-[6px] bg-base-100 p-6 text-center text-base-content sm:m-16">
          <p className="text-5xl font-black text-primary">404</p>
          <h1 className="mt-3 text-2xl font-bold">Page not found</h1>
          <p className="mt-2">
            We couldn't find that page. Check the URL or return to the feed.
          </p>
          <Link to="/" className="btn mt-4 btn-primary">
            Go to Home
          </Link>
        </div>
      </section>
    </>
  );
}
