import { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
// Sử dụng instance api chung để tự động xử lý Token
import { api } from '../context/auth-context'; 
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { Plus, Search, Edit, Trash2, Upload, Filter, Loader2 } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';

interface SubjectItem {
  id: number;
  name: string;
}

type DifficultyValue = 'easy' | 'medium' | 'hard';

const difficultyLabels: Record<DifficultyValue, string> = {
  easy: 'Dễ',
  medium: 'Trung bình',
  hard: 'Khó'
};

interface QuestionItem {
  id: string;
  questionText: string;
  options: Array<{ id: string; text: string; label: 'A' | 'B' | 'C' | 'D' }>;
  correctAnswer: string; // Lưu nhãn A, B, C, hoặc D
  subjectId: string;
  subject: string;
  difficulty: DifficultyValue;
}

export function QuestionsManagement() {
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuestionItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [formData, setFormData] = useState({
    questionText: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correctAnswer: 'A',
    subjectId: '',
    difficulty: 'medium' as DifficultyValue
  });

  const normalizeHeaderKey = (value: string) => value?.toString().trim().toLowerCase();

  const getMappedKey = (columnName: string) => {
    const header = normalizeHeaderKey(columnName);
    const mapping: Record<string, string> = {
      'nội dung câu hỏi': 'content',
      'câu hỏi': 'content',
      'question': 'content',
      'content': 'content',

      'đáp án a': 'option_a',
      'a': 'option_a',
      'option a': 'option_a',
      'option_a': 'option_a',

      'đáp án b': 'option_b',
      'b': 'option_b',
      'option b': 'option_b',
      'option_b': 'option_b',

      'đáp án c': 'option_c',
      'c': 'option_c',
      'option c': 'option_c',
      'option_c': 'option_c',

      'đáp án d': 'option_d',
      'd': 'option_d',
      'option d': 'option_d',
      'option_d': 'option_d',

      'đáp án đúng': 'correct_answer',
      'correct answer': 'correct_answer',
      'correct_answer': 'correct_answer',
      'đáp án đúng (a/b/c/d)': 'correct_answer',

      'môn học': 'subject_name',
      'môn học id': 'subject_id',
      'subject_id': 'subject_id',
      'subject id': 'subject_id',
      'subject': 'subject_name',

      'độ khó': 'difficulty',
      'difficulty': 'difficulty'
    };
    return mapping[header] || header;
  };

  const normalizeRow = (row: Record<string, any>) => {
    const normalized: Record<string, any> = {};
    Object.entries(row).forEach(([header, value]) => {
      const key = getMappedKey(header);
      normalized[key] = value;
    });
    return normalized;
  };

  // 1. Tải danh sách môn học
  const fetchSubjects = async () => {
    try {
      const response = await api.get('/admin/subjects');
      setSubjects(response.data);
    } catch (error: any) {
      console.error('Lỗi tải môn học:', error);
    }
  };

  // 2. Tải danh sách câu hỏi
  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (subjectFilter !== 'all') params.append('subject', subjectFilter);
      if (difficultyFilter !== 'all') params.append('difficulty', difficultyFilter);

      const response = await api.get(`/admin/questions?${params}`);
      const transformed = response.data.map((q: any) => ({
        id: q.id.toString(),
        questionText: q.content,
        options: [
          { id: 'A', text: q.option_a, label: 'A' },
          { id: 'B', text: q.option_b, label: 'B' },
          { id: 'C', text: q.option_c, label: 'C' },
          { id: 'D', text: q.option_d, label: 'D' }
        ],
        correctAnswer: q.correct_answer.toUpperCase(),
        subjectId: q.subject_id?.toString() || '',
        subject: q.subject?.name || q.subject_name || 'Không xác định',
        difficulty: (q.difficulty?.toLowerCase() as DifficultyValue) || 'medium'
      }));
      setQuestions(transformed);
    } catch (error: any) {
      toast.error('Không thể tải ngân hàng câu hỏi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  useEffect(() => {
    fetchQuestions();
  }, [subjectFilter, difficultyFilter]);

  // 3. Xử lý Thêm/Sửa
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.questionText.trim() || !formData.subjectId) {
      toast.error('Vui lòng nhập nội dung câu hỏi và chọn môn học');
      return;
    }

    const dataPayload = {
      content: formData.questionText,
      option_a: formData.optionA,
      option_b: formData.optionB,
      option_c: formData.optionC,
      option_d: formData.optionD,
      correct_answer: formData.correctAnswer,
      subject_id: Number(formData.subjectId),
      difficulty: formData.difficulty
    };

    try {
      setIsSubmitting(true);
      if (editingQuestion) {
        await api.put(`/admin/questions/${editingQuestion.id}`, dataPayload);
        toast.success('Cập nhật câu hỏi thành công');
      } else {
        await api.post('/admin/questions', dataPayload);
        toast.success('Thêm câu hỏi mới thành công');
      }
      fetchQuestions();
      handleDialogClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      if (!worksheet) {
        toast.error('Không tìm thấy sheet đầu tiên trong tệp Excel');
        return;
      }

      const rawData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });
      if (!rawData.length) {
        toast.error('Tệp Excel không có dữ liệu để import');
        return;
      }

      const subjectLookup = Object.fromEntries(subjects.map((subject) => [subject.name.toString().trim().toLowerCase(), subject.id]));
      const createPromises = rawData.map(async (row, index) => {
        const normalized = normalizeRow(row);
        const subjectIdValue = normalized.subject_id || normalized.subject_name || normalized.subject;
        const subjectId = subjectIdValue?.toString().trim();
        const subjectIdFromName = subjectLookup[subjectId?.toLowerCase() ?? ''];
        const finalSubjectId = subjectIdFromName || Number(subjectId);

        const payload = {
          content: normalized.content?.toString() || '',
          option_a: normalized.option_a?.toString() || '',
          option_b: normalized.option_b?.toString() || '',
          option_c: normalized.option_c?.toString() || '',
          option_d: normalized.option_d?.toString() || '',
          correct_answer: normalized.correct_answer?.toString().toUpperCase() || '',
          subject_id: Number(finalSubjectId),
          difficulty: normalized.difficulty?.toString().toLowerCase() || 'medium'
        };

        if (!payload.content || !payload.option_a || !payload.option_b || !payload.option_c || !payload.option_d) {
          throw new Error(`Dòng ${index + 2}: thiếu nội dung câu hỏi hoặc đáp án`);
        }

        if (!['A', 'B', 'C', 'D'].includes(payload.correct_answer)) {
          throw new Error(`Dòng ${index + 2}: đáp án đúng phải là A, B, C hoặc D`);
        }

        if (!payload.subject_id || Number.isNaN(payload.subject_id)) {
          throw new Error(`Dòng ${index + 2}: thiếu Môn học hoặc Subject ID không hợp lệ`);
        }

        if (!['easy', 'medium', 'hard'].includes(payload.difficulty)) {
          throw new Error(`Dòng ${index + 2}: Độ khó phải là easy, medium hoặc hard`);
        }

        return api.post('/admin/questions', payload);
      });

      const results = await Promise.allSettled(createPromises);
      const successful = results.filter((result) => result.status === 'fulfilled').length;
      const failed = results.filter((result) => result.status === 'rejected');

      if (successful) {
        toast.success(`Đã import thành công ${successful} câu hỏi`);
      }

      if (failed.length) {
        const errorMessage = failed.map((result) => {
          const reason = (result as PromiseRejectedResult).reason;
          return reason?.response?.data?.message || reason?.message || 'Lỗi không xác định';
        }).join('; ');
        toast.error(`Có ${failed.length} câu hỏi không được import: ${errorMessage}`);
      }

      fetchQuestions();
    } catch (error: any) {
      toast.error(error?.message || 'Lỗi khi import tệp Excel');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleEdit = (q: QuestionItem) => {
    setEditingQuestion(q);
    setFormData({
      questionText: q.questionText,
      optionA: q.options[0].text,
      optionB: q.options[1].text,
      optionC: q.options[2].text,
      optionD: q.options[3].text,
      correctAnswer: q.correctAnswer,
      subjectId: q.subjectId,
      difficulty: q.difficulty
    });
    setIsAddDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Xác nhận xóa câu hỏi này khỏi hệ thống?')) return;
    try {
      await api.delete(`/admin/questions/${id}`);
      toast.success('Đã xóa câu hỏi');
      fetchQuestions();
    } catch (error) {
      toast.error('Không thể xóa câu hỏi');
    }
  };

  const handleDialogClose = () => {
    setIsAddDialogOpen(false);
    setEditingQuestion(null);
    setFormData({
      questionText: '', optionA: '', optionB: '', optionC: '', optionD: '',
      correctAnswer: 'A', subjectId: '', difficulty: 'medium'
    });
  };

  const filteredQuestions = questions.filter(q =>
    q.questionText.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ngân hàng câu hỏi</h1>
          <p className="text-gray-500">Quản lý nội dung các câu hỏi trắc nghiệm</p>
        </div>
        <div className="flex gap-2 items-center">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button variant="outline" className="gap-2" onClick={handleImportClick} disabled={isImporting}>
            <Upload className="h-4 w-4" /> {isImporting ? 'Đang import...' : 'Import'}
          </Button>
          <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2 bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4" /> Thêm câu hỏi
          </Button>
        </div>
      </div>

      <Card className="shadow-sm border-none bg-white">
        <CardContent className="p-6 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Tìm kiếm nội dung câu hỏi..." 
                className="pl-10" 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                <SelectTrigger className="w-[180px]"><SelectValue placeholder="Môn học" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả môn</SelectItem>
                  {subjects.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                <SelectTrigger className="w-[140px]"><SelectValue placeholder="Độ khó" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả độ khó</SelectItem>
                  <SelectItem value="easy">Dễ</SelectItem>
                  <SelectItem value="medium">Trung bình</SelectItem>
                  <SelectItem value="hard">Khó</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-xl border border-gray-100 overflow-hidden">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="w-12 text-center">STT</TableHead>
                  <TableHead>Nội dung câu hỏi</TableHead>
                  <TableHead>Môn học</TableHead>
                  <TableHead>Độ khó</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-10"><Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" /></TableCell></TableRow>
                ) : filteredQuestions.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-10 text-gray-400">Không tìm thấy câu hỏi nào</TableCell></TableRow>
                ) : (
                  filteredQuestions.map((q, index) => (
                    <TableRow key={q.id} className="hover:bg-gray-50/50 transition-colors">
                      <TableCell className="text-center font-medium">{index + 1}</TableCell>
                      <TableCell className="max-w-md"><p className="truncate font-medium text-gray-700">{q.questionText}</p></TableCell>
                      <TableCell><Badge variant="secondary" className="font-normal">{q.subject}</Badge></TableCell>
                      <TableCell>
                        <Badge className={
                          q.difficulty === 'easy' ? 'bg-green-100 text-green-700 hover:bg-green-100' :
                          q.difficulty === 'hard' ? 'bg-red-100 text-red-700 hover:bg-red-100' :
                          'bg-yellow-100 text-yellow-700 hover:bg-yellow-100'
                        }>{difficultyLabels[q.difficulty]}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(q)}><Edit className="h-4 w-4 text-gray-600" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(q.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
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

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
          <DialogHeader>
            <DialogTitle>{editingQuestion ? 'Cập nhật câu hỏi' : 'Thêm câu hỏi mới'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Nội dung câu hỏi</Label>
              <Textarea rows={3} value={formData.questionText} onChange={e => setFormData({...formData, questionText: e.target.value})} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Đáp án A</Label><Input value={formData.optionA} onChange={e => setFormData({...formData, optionA: e.target.value})} required /></div>
              <div className="space-y-2"><Label>Đáp án B</Label><Input value={formData.optionB} onChange={e => setFormData({...formData, optionB: e.target.value})} required /></div>
              <div className="space-y-2"><Label>Đáp án C</Label><Input value={formData.optionC} onChange={e => setFormData({...formData, optionC: e.target.value})} required /></div>
              <div className="space-y-2"><Label>Đáp án D</Label><Input value={formData.optionD} onChange={e => setFormData({...formData, optionD: e.target.value})} required /></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Đáp án đúng</Label>
                <Select value={formData.correctAnswer} onValueChange={v => setFormData({...formData, correctAnswer: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="A">A</SelectItem><SelectItem value="B">B</SelectItem><SelectItem value="C">C</SelectItem><SelectItem value="D">D</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Môn học</Label>
                <select className="w-full h-10 px-3 rounded-md border text-sm bg-white" value={formData.subjectId} onChange={e => setFormData({...formData, subjectId: e.target.value})} required>
                  <option value="">Chọn môn</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Độ khó</Label>
                <Select value={formData.difficulty} onValueChange={(v: DifficultyValue) => setFormData({...formData, difficulty: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="easy">Dễ</SelectItem><SelectItem value="medium">Trung bình</SelectItem><SelectItem value="hard">Khó</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="pt-6">
              <Button type="button" variant="ghost" onClick={handleDialogClose}>Hủy</Button>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Đang lưu...' : 'Lưu câu hỏi'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}