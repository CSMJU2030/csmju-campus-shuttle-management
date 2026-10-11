import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
      <div className="text-4xl mb-4">🔍</div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">ไม่พบหน้าที่คุณต้องการ</h2>
      <p className="text-gray-600 mb-6 max-w-md">
        หน้าที่คุณพยายามเข้าถึงอาจถูกลบไปแล้ว หรือ URL ไม่ถูกต้อง
      </p>
      <Link
        href="/"
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        กลับหน้าหลัก
      </Link>
    </div>
  );
}
