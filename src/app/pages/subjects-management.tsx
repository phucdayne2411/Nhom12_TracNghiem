import { useState, useEffect, useRef } from 'react';
// Sử dụng instance api chung để tự động xử lý Token
import { api } from '../context/auth-context'; 
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Plus, Search, Edit, Trash2, Loader2, BookOpen, Upload } from 'lucide-react';
import { toast } from 'sonner';

// Import thư viện Excel
import * as XLSX from 'xlsx';

interface Subject {
  id: number;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export function SubjectsManagement() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  // Tham chiếu đến thẻ input file ẩn
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Tải danh sách môn học từ Backend Render
  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/subjects');
      setSubjects(response.data);
    } catch (error: any) {
      console.error('Lỗi tải danh sách môn học:', error);
      toast.error('Không thể kết nối với máy chủ để tải môn học');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  // 2. Xử lý Thêm hoặc Cập nhật môn học
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Vui lòng nhập tên môn học');
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingSubject) {
        await api.put(`/admin/subjects/${editingSubject.id}`, formData);
        toast.success('Cập nhật môn học thành công');
      } else {
        await api.post('/admin/subjects', formData);
        toast.success('Thêm môn học mới thành công');
      }
      fetchSubjects(); // Refresh danh sách
      handleDialogClose();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Có lỗi xảy ra khi lưu dữ liệu';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (subject: Subject) => {
    setEditingSubject(subject);
    setFormData({ name: subject.name, description: subject.description || '' });
    setIsAddDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa môn học này? Lưu ý: Các bài thi liên quan có thể bị ảnh hưởng.')) {
      return;
    }

    try {
      setIsSubmitting(true);
      await api.delete(`/admin/subjects/${id}`);
      toast.success('Xóa môn học thành công');
      fetchSubjects();
    } catch (error: any) {
      toast.error('Không thể xóa môn học. Vui lòng kiểm tra lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDialogClose = () => {
    setIsAddDialogOpen(false);
    setEditingSubject(null);
    setFormData({ name: '', description: '' });
  };

  const resetForm = () => {
    setFormData({ name: '', description: '' });
    setEditingSubject(null);
  };

  // 3. Xử lý IMPORT EXCEL
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileExt = file.name.split('.').pop()?.toLowerCase();
    if (fileExt !== 'xlsx' && fileExt !== 'xls') {
      toast.error('Vui lòng chọn file Excel định dạng .xlsx hoặc .xls');
      return;
    }

    toast.info('Đang đọc file Excel...');
    const reader = new FileReader();

    reader.onload = async (evt) => {
      try {
        setIsSubmitting(true);
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });

        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];

        const data = XLSX.utils.sheet_to_json(ws);

        if (data.length === 0) {
          toast.warning('File Excel trống!');
          return;
        }

        console.log("Dữ liệu đọc được từ Excel:", data);
        
        // GỌI API BACKEND Ở ĐÂY ĐỂ LƯU VÀO DATABASE
        // await api.post('/admin/subjects/import', { subjects: data });
        // toast.success(`Đã nhập thành công ${data.length} môn học!`);
        // fetchSubjects(); 
        
        toast.success(`Đã đọc thành công ${data.length} dòng. Xem Console để thấy dữ liệu.`);

      } catch (error) {
        console.error('Lỗi đọc file Excel:', error);
        toast.error('Có lỗi xảy ra khi xử lý file Excel');
      } finally {
        setIsSubmitting(false);
        if (fileInputRef.current) fileInputRef.current.value = ''; // Reset input
      }
    };

    reader.readAsBinaryString(file);
  };

  const filteredSubjects = subjects.filter(subject =>
    subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (subject.description && subject.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-6 lg:p-8 space-y-6 animate-in fade-in duration-500">
      {/* Input ẩn để chọn file Excel */}
      <input 
        type="file" 
        accept=".xlsx, .xls" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        className="hidden" 
      />

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Quản lý môn học</h1>
          <p className="text-gray-500 mt-1">Quản lý danh mục các môn học trong hệ thống thi</p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="gap-2 bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
            onClick={handleImportClick}
            disabled={isSubmitting}
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            Import Excel
          </Button>

          <Button
            className="gap-2 bg-blue-600 hover:bg-blue-700 shadow-md transition-all active:scale-95"
            onClick={() => {
              resetForm();
              setIsAddDialogOpen(true);
            }}
            disabled={isSubmitting}
          >
            <Plus className="w-4 h-4" />
            Thêm môn học mới
          </Button>
        </div>
      </div>

      {/* Search Bar Section */}
      <Card className="shadow-sm border-none bg-white">
        <CardContent className="p-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Tìm kiếm môn học theo tên hoặc mô tả..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-11 border-gray-200 focus:ring-blue-500"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table Section */}
      <Card className="shadow-sm border-none bg-white overflow-hidden">
        <CardHeader className="border-b border-gray-50">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-500" />
            Danh sách môn học ({filteredSubjects.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="w-20 font-bold text-gray-700 text-center">ID</TableHead>
                  <TableHead className="font-bold text-gray-700">Tên môn học</TableHead>
                  <TableHead className="font-bold text-gray-700">Mô tả</TableHead>
                  <TableHead className="font-bold text-gray-700">Ngày tạo</TableHead>
                  <TableHead className="font-bold text-gray-700 text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-gray-400">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                      Đang tải danh sách môn học...
                    </TableCell>
                  </TableRow>
                ) : filteredSubjects.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-gray-400 italic">
                      Không tìm thấy môn học nào phù hợp.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSubjects.map((subject) => (
                    <TableRow key={subject.id} className="hover:bg-gray-50/50 transition-colors">
                      <TableCell className="text-center font-mono text-gray-500">{subject.id}</TableCell>
                      <TableCell className="font-semibold text-gray-900">{subject.name}</TableCell>
                      <TableCell className="max-w-xs">
                        <p className="truncate text-gray-600 text-sm" title={subject.description}>
                          {subject.description || <span className="text-gray-300 italic">Không có mô tả</span>}
                        </p>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {new Date(subject.created_at).toLocaleDateString('vi-VN')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(subject)}
                            disabled={isSubmitting}
                            className="text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(subject.id)}
                            disabled={isSubmitting}
                            className="text-gray-400 hover:text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog Form Section */}
      <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
        if (!open) handleDialogClose();
        setIsAddDialogOpen(open);
      }}>
        <DialogContent className="max-w-md bg-white rounded-xl shadow-2xl border-none">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">
              {editingSubject ? 'Chỉnh sửa môn học' : 'Thêm môn học mới'}
            </DialogTitle>
            <DialogDescription className="text-gray-500">
              {editingSubject ? 'Cập nhật lại thông tin mô tả cho môn học này.' : 'Nhập thông tin để tạo một môn học mới trong hệ thống.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-5 py-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="font-semibold text-gray-700">Tên môn học <span className="text-red-500">*</span></Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="VD: Cấu trúc dữ liệu và giải thuật"
                  disabled={isSubmitting}
                  required
                  className="h-11 border-gray-200 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description" className="font-semibold text-gray-700">Mô tả chi tiết</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Nhập mục tiêu hoặc mô tả ngắn gọn về môn học..."
                  disabled={isSubmitting}
                  rows={4}
                  className="border-gray-200 focus:ring-blue-500"
                />
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0 mt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={handleDialogClose}
                disabled={isSubmitting}
                className="hover:bg-gray-100"
              >
                Hủy bỏ
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700 px-6 font-semibold"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang xử lý
                  </>
                ) : (
                  editingSubject ? 'Cập nhật ngay' : 'Tạo môn học'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
