import { Link } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";

export function NotFound() {
  return (
    <div>
      <PageHeader title="Page not found" intro="That address doesn't exist." />
      <Link to="/" className="font-medium text-accent underline underline-offset-4">
        Go to the estimate form
      </Link>
    </div>
  );
}