import { Suspense } from "react";
import { GenerateView } from "@/components/GenerateView";

export const metadata = { title: "Investigating | OAuth App Guides" };

export default function GeneratePage() {
  return (
    <Suspense>
      <GenerateView />
    </Suspense>
  );
}
