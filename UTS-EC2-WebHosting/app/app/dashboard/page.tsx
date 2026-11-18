import { redirect } from "next/navigation";
import DeploymentDashboard from "@/components/deployment-dashboard";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/?next=%2Fdashboard%23pipeline");
  return <DeploymentDashboard user={user} />;
}
