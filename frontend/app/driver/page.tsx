import { getMe } from "@/lib/api";
import { DriverReportForm } from "@/components/shuttle/driver-report-form";

export const dynamic = "force-dynamic";

export default async function DriverPage() {
  const me = await getMe();
  const role = me.ok ? me.data.subsystemRole : null;

  if (role !== "STAFF" && role !== "ADMIN") {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-24 text-center">
        <h1 className="mb-2 text-xl font-bold text-gray-900">ไม่มีสิทธิ์เข้าหน้านี้</h1>
        <p className="max-w-md text-gray-600">หน้ารายงานตำแหน่งรถสำหรับเจ้าหน้าที่และผู้ดูแลระบบเท่านั้น</p>
      </div>
    );
  }

  return <DriverReportForm />;
}
