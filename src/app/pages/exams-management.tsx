import { useState, useEffect } from 'react';
// Import instance api dùng chung để tự động đính kèm Token
import { api } from '../context/auth-context'; 
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Plus, Search, Edit, Trash2, Calendar, Clock } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';

interface SubjectItem {
  id: number;
  name: string;
}

interface ExamItem {
  id: string;
  name: string;
  subjectId: number;
  subjectName: string;
  startTime: string;
  endTime: string;
  duration: number;
  status: 'upcoming' | 'ongoing' | 'completed';
  totalQuestions: number;
  password?: string;
}

export function ExamsManagement() {
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<ExamItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    subjectId: '',
    startTime: '',
    endTime: '',
    duration: 60,
    totalQuestions: 30,
    password: ''
  });

  // 1. Tải danh sách môn học cho Select box
  const fetchSubjects = async () => {
    try {
      const response = await api.get('/admin/subjects');
      setSubjects(response.data);
    } catch (error: any) {
      console.error('Lỗi tải môn học:', error);
    }
  };

  // 2. Tải danh sách bài thi từ Backend
  const fetchExams = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/exams');
      
      // Chuyển đổi dữ liệu từ Backend (snake_case) sang Frontend (camelCase)
      const mappedExams: ExamItem[] = response.data.map((exam: any) => ({
        id: String(exam.id),
        name: exam.name,
        subjectId: Number(exam.subject_id),
        subjectName: exam.subject?.name || 'N/A',
        startTime: exam.start_time,
        endTime: exam.end_time,
        duration: exam.duration,
        status: exam.status, // Giả sử Backend trả về: upcoming, ongoing, completed
        totalQuestions: exam.total_questions,
        password: exam.password || ''
      }));
      
      setExams(mappedExams);
    } catch (error: any) {
      toast.error('Không tải được danh sách bài thi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
    fetchExams();
  }, []);

  // 3. Xử lý Thêm hoặc Cập nhật
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.subjectId || !formData.startTime) {
      toast.error('Vui lòng điền đầy đủ các thông tin bắt buộc');
      return;
    }

    const payload = {
      name: formData.name,
      subject_id: Number(formData.subjectId),
      start_time: formData.startTime,
      end_time: formData.endTime,
      duration: formData.duration,
      total_questions: formData.totalQuestions,
      password: formData.password || null
    };

    try {
      setIsSubmitting(true);
      if (editingExam) {
        await api.put(`/admin/exams/${editingExam.id}`, payload);
        toast.success('Cập nhật bài thi thành công');
      } else {
        await api.post('/admin/exams', payload);
        toast.success('Tạo bài thi mới thành công');
      }
      fetchExams();
      handleDialogClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (exam: ExamItem) => {
    setEditingExam(exam);
    setFormData({
      name: exam.name,
      subjectId: exam.subjectId.toString(),
      // Format lại datetime-local string (YYYY-MM-DDTHH:mm)
      startTime: new Date(exam.startTime).toISOString().slice(0, 16),
      endTime: new Date(exam.endTime).toISOString().slice(0, 16),
      duration: exam.duration,
      totalQuestions: exam.totalQuestions,
      password: exam.password || ''
    });
    setIsAddDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bài thi này?')) return;

    try {
      await api.delete(`/admin/exams/${id}`);
      toast.success('Đã xóa bài thi');
      fetchExams();
    } catch (error: any) {
      toast.error('Không thể xóa bài thi');
    }
  };

  const handleDialogClose = () => {
    setIsAddDialogOpen(false);
    setEditingExam(null);
    setFormData({
      name: '',
      subjectId: '',
      startTime: '',
      endTime: '',
      duration: 60,
      totalQuestions: 30,
      password: ''
    });
  };

  const filteredExams = exams.filter(exam =>
    exam.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    exam.subjectName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý bài thi</h1>
          <p className="text-gray-500">Thiết lập và quản lý các kỳ thi trực tuyến</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Tạo bài thi mới
        </Button>
      </div>

      <Card className="shadow-sm border-none bg-white">
        <CardContent className="p-6">
          <div className="relative max-w-sm mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Tìm theo tên bài thi, môn học..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="rounded-xl border border-gray-100 overflow-hidden">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="w-12 text-center">STT</TableHead>
                  <TableHead>Thông tin bài thi</TableHead>
                  <TableHead>Môn học</TableHead>
                  <TableHead>Thời gian</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-10 text-gray-400 italic">Đang tải dữ liệu...</TableCell></TableRow>
                ) : filteredExams.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-10 text-gray-400 italic">Trống</TableCell></TableRow>
                ) : (
                  filteredExams.map((exam, index) => (
                    <TableRow key={exam.id} className="hover:bg-gray-50/50 transition-colors">
                      <TableCell className="text-center font-medium">{index + 1}</TableCell>
                      <TableCell>
                        <div className="font-semibold text-gray-900">{exam.name}</div>
                        <div className="text-xs text-gray-500 flex items-center gap-2 mt-1">
                          <Clock className="h-3 w-3" /> {exam.duration} phút | <Calendar className="h-3 w-3" /> {exam.totalQuestions} câu
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100">{exam.subjectName}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {new Date(exam.startTime).toLocaleString('vi-VN')}
                      </TableCell>
                      <TableCell>
                        {exam.status === 'ongoing' ? (
                          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Đang diễn ra</Badge>
                        ) : exam.status === 'upcoming' ? (
                          <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">Sắp tới</Badge>
                        ) : (
                          <Badge variant="secondary">Đã kết thúc</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(exam)}><Edit className="h-4 w-4 text-gray-600" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(exam.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
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

      {/* Form Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingExam ? 'Chỉnh sửa bài thi' : 'Thêm bài thi mới'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label>Tên bài thi</Label>
                <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label>Môn học</Label>
                <select 
                  className="w-full h-10 px-3 rounded-md border border-input bg-white text-sm"
                  value={formData.subjectId}
                  onChange={e => setFormData({...formData, subjectId: e.target.value})}
                  required
                >
                  <option value="">-- Chọn môn --</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Mật khẩu (nếu có)</Label>
                <Input value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Bắt đầu</Label>
                <Input type="datetime-local" value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label>Kết thúc</Label>
                <Input type="datetime-local" value={formData.endTime} onChange={e => setFormData({...formData, endTime: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label>Thời gian làm bài (phút)</Label>
                <Input type="number" value={formData.duration} onChange={e => setFormData({...formData, duration: parseInt(e.target.value)})} required />
              </div>
              <div className="space-y-2">
                <Label>Số câu hỏi</Label>
                <Input type="number" value={formData.totalQuestions} onChange={e => setFormData({...formData, totalQuestions: parseInt(e.target.value)})} required />
              </div>
            </div>
            <DialogFooter className="pt-6">
              <Button type="button" variant="ghost" onClick={handleDialogClose}>Hủy</Button>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Đang lưu...' : 'Lưu bài thi'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}