import { Suspense } from "react";
import GraciasContent from "./GraciasContent";

export default function GraciasPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin w-10 h-10 border-4 border-accent border-t-transparent rounded-full" />
        </div>
      }
    >
      <GraciasContent />
    </Suspense>
  );
}
