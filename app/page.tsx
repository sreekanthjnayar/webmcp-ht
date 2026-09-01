import { Providers } from "@/app/providers";
import { SimulatorApp } from "@/components/simulator-app";

export default function Home() {
  return (
    <Providers>
      <SimulatorApp />
    </Providers>
  );
}