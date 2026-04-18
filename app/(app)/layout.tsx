import { MockSimulationBoot } from "@/components/shared/MockSimulationBoot";
import { KeepaliveBoot } from "@/components/shared/KeepaliveBoot";
import { AppShell } from "@/components/shared/AppShell";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <MockSimulationBoot />
      <KeepaliveBoot />
      <AppShell>{children}</AppShell>
    </>
  );
}
