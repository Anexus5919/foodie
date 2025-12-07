import { Metadata } from "next";
import { Suspense } from "react";
import SearchClient from "./client";
import { Skeleton } from "../../components/ui/skeleton";

export const metadata: Metadata = {
  title: "Search | Foodie",
  description: "Find your favorite food",
};

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="container py-8"><Skeleton className="h-96" /></div>}>
      <SearchClient />
    </Suspense>
  );
}