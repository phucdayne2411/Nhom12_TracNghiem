import { useState, useEffect } from 'react';
// Sử dụng instance api chung để tự động xử lý xác thực
import { api } from '../context/auth-context'; 
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Search, Trash2, Loader2, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';

// Import thư viện Excel
import * as XLSX from 'xlsx';

interface ResultData {
  id: number;
  studentName: string;
  studentEmail: string;
  examName: string;
  subject: any;
  score: number;
  total_correct: number;
  completedAt: string;
}

export function ResultsManagement() {
  const [results, setResults] = useState<ResultData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. LẤY DANH SÁCH KẾT QUẢ TỪ BACKEND
  const fetchResults = async (searchQuery = '') => {
    try {
      setLoading(true);
      const response = await api.get('/admin/results', {
        params: { search: searchQuery }
      });
      
      const mappedData = response.data.map((item: any) => ({
        id: item.id,
        studentName: item.user?.name || item.studentName || 'N/A',
        studentEmail: item.user?.email || item.studentEmail || 'N/A',
        examName: item.exam?.name || item.examName || 'Bài thi không tên',
        subject: item.exam?.subject || item.subject || 'N/A',
        score: item.score,
        total_correct: item.total_correct,
        completedAt: item.completed_at || item.completedAt
      }));
      
      setResults(mappedData);
    } catch (error: any) {
      console.error("Lỗi khi tải kết quả:", error);
      toast.error('Không thể tải danh sách kết quả thi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchResults(searchTerm);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  // 2. XÓA KẾT QUẢ (HỦY BÀI THI)
  const handleDelete = async (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa vĩnh viễn kết quả bài thi này?')) {
      return;
    }

    try {
      setIsSubmitting(true);
      await api.delete(`/admin/results/${id}`);
      toast.success('Đã xóa kết quả thành công');
      fetchResults(searchTerm);
    } catch (error: any) {
      toast.error('Lỗi khi xóa kết quả');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. XUẤT EXCEL TỪ DỮ LIỆU FRONTEND
  const handleExport = () => {
    if (results.length === 0) {
      toast.warning('Không có dữ liệu kết quả để xuất Excel!');
      return;
    }

    toast.info('Đang chuẩn bị file Excel, vui lòng đợi...');

    try {
      // 3.1. Format lại dữ liệu để hiển thị đẹp trong Excel (Đổi tên cột tiếng Việt)
      const exportData = results.map((result, index) => ({
        'STT': index + 1,
        'Họ và Tên': result.studentName,
        'Email': result.studentEmail,
        'Tên bài thi': result.examName,
        'Môn học': typeof result.subject === 'object' ? (result.subject?.name || 'N/A') : result.subject,
        'Điểm số': result.score,
        'Số câu đúng': result.total_correct,
        'Ngày nộp bài': new Date(result.completedAt).toLocaleString('vi-VN')
      }));

      // 3.2. Tạo Worksheet (Bảng tính) từ dữ liệu đã format
      const worksheet = XLSX.utils.json_to_sheet(exportData);

      // Chỉnh độ rộng các cột cho dễ nhìn
      worksheet['!cols'] = [
        { wch: 5 },   // STT
        { wch: 25 },  // Họ tên
        { wch: 30 },  // Email
        { wch: 35 },  // Tên bài thi
        { wch: 25 },  // Môn học
        { wch: 10 },  // Điểm
        { wch: 15 },  // Số câu đúng
        { wch: 25 },  // Ngày nộp
      ];

      // 3.3. Tạo Workbook (File Excel) và gắn bảng tính vào
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Kết quả sinh viên");

      // 3.4. Xuất file và kích hoạt tải xuống
      const fileName = `Ket_Qua_Thi_${new Date().getTime()}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      toast.success('Xuất file Excel thành công!');
    } catch (error) {
      console.error("Lỗi khi xuất Excel:", error);
      toast.error('Có lỗi xảy ra trong quá trình tạo file Excel');
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Quản lý Kết quả</h1>
          <p className="text-gray-500 mt-1">Theo dõi điểm số và thống kê chi tiết của sinh viên</p>
        </div>
        <Button 
          variant="outline" 
          onClick={handleExport} 
          className="gap-2 border-green-600 text-green-700 hover:bg-green-50"
        >
          <FileSpreadsheet className="h-4 w-4" /> Xuất Excel
        </Button>
      </div>

      {/* Search Bar */}
      <Card className="shadow-sm border-none bg-white">
        <CardContent className="p-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Tìm tên SV, email hoặc tên bài thi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-11 border-gray-200"
            />
          </div>
        </CardContent>
      </Card>

      {/* Results Table */}
      <Card className="shadow-sm border-none bg-white overflow-hidden">
        <CardHeader className="border-b border-gray-50">
          <CardTitle className="text-lg font-semibold">Danh sách bài nộp ({results.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="font-bold text-gray-700">Sinh viên</TableHead>
                  <TableHead className="font-bold text-gray-700">Bài thi</TableHead>
                  <TableHead className="font-bold text-gray-700">Môn học</TableHead>
                  <TableHead className="font-bold text-gray-700">Ngày nộp</TableHead>
                  <TableHead className="font-bold text-gray-700 text-right">Điểm số</TableHead>
                  <TableHead className="font-bold text-gray-700 text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-gray-400">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                      Đang tải kết quả thi từ hệ thống...
                    </TableCell>
                  </TableRow>
                ) : results.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-gray-400 italic">
                      Không tìm thấy dữ liệu kết quả phù hợp.
                    </TableCell>
                  </TableRow>
                ) : (
                  results.map((result) => (
                    <TableRow key={result.id} className="hover:bg-gray-50/50 transition-colors">
                      <TableCell>
                        <div>
                          <p className="font-semibold text-gray-900">{result.studentName}</p>
                          <p className="text-xs text-gray-500 font-mono">{result.studentEmail}</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-gray-700">{result.examName}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                          {typeof result.subject === 'object' ? result.subject.name : result.subject}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {new Date(result.completedAt).toLocaleString('vi-VN', {
                          day: '2-digit', month: '2-digit', year: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={`text-lg font-bold ${result.score >= 50 ? 'text-green-600' : 'text-red-600'}`}>
                          {result.score} <span className="text-[10px] text-gray-400 font-normal">/ 100</span>
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(result.id)}
                          disabled={isSubmitting}
                          className="text-gray-400 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
