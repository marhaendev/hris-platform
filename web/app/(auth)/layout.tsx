import { getSession } from "@/lib/session";
import DashboardClientLayout from "./DashboardClientLayout";
import { redirect } from "next/navigation";

export default async function Layout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getSession();

    if (!session) {
        redirect("/login");
    }

    return (
        <DashboardClientLayout user={session}>
            {children}
        </DashboardClientLayout>
    );
}
