import { Providers } from "@/app/providers";
import { AppCrashFallback, ErrorBoundary } from "@/components/error-boundary";
import { SimulatorApp } from "@/components/simulator-app";

export default function Home() {
  return (
    <Providers>
      <ErrorBoundary fallback={<AppCrashFallback />}>
        <SimulatorApp />
      </ErrorBoundary>
    </Providers>
  );
}