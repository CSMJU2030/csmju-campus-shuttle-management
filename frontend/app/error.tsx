'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
      <div className="text-4xl mb-4">⚠️</div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">เกิดข้อผิดพลาดในการโหลดข้อมูล</h2>
      <p className="text-gray-600 mb-6 max-w-md">
        {error.message || 'ขออภัย ไม่สามารถโหลดข้อมูลทางลัดระบบได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง'}
      </p>
      <button
        onClick={() => reset()}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        ลองใหม่อีกครั้ง
      </button>
    </div>
  );
}
