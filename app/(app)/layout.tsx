import { MockSimulationBoot } from "@/components/shared/MockSimulationBoot";
import { KeepaliveBoot } from "@/components/shared/KeepaliveBoot";
import { FirebaseBoot } from "@/components/shared/FirebaseBoot";
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
      <FirebaseBoot />
      <AppShell>{children}</AppShell>
    </>
  );
}
