import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
// Sử dụng api instance từ context để lấy dữ liệu thật
import { api } from '../context/auth-context'; 
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { CheckCircle2, XCircle, Award, Clock, Calendar, Home, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function ResultPage() {
  const { examId } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [resultData, setResultData] = useState<any>(null);

  useEffect(() => {
    const fetchResult = async () => {
      if (!examId) return;
      try {
        setLoading(true);
        // Gọi API lấy kết quả bài thi cụ thể của sinh viên này
        const response = await api.get(`/student/exams/${examId}/result`);
        setResultData(response.data);
      } catch (error: any) {
        console.error("Lỗi tải kết quả:", error);
        toast.error("Không tìm thấy kết quả thi hoặc bạn chưa hoàn thành bài thi này.");
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [examId]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-gray-500 italic">Đang chấm điểm và tải kết quả...</p>
      </div>
    );
  }

  if (!resultData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md shadow-xl border-none p-6 text-center">
          <Award className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Dữ liệu kết quả không khả dụng.</p>
          <Button className="mt-6" onClick={() => navigate('/student/dashboard')}>Quay lại trang chủ</Button>
        </Card>
      </div>
    );
  }

  // Xử lý logic hiển thị dựa trên dữ liệu từ Backend
  const score = resultData.score || 0;
  const correctCount = resultData.total_correct || 0;
  const totalQuestions = resultData.total_questions || 0;
  const wrongCount = totalQuestions - correctCount;
  const accuracy = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;
  const subjectName = resultData.subject_name || resultData.subject?.name || resultData.subject || 'N/A';
  const durationMinutes = resultData.duration || resultData.duration_minutes || '--';
  const finishedAt = resultData.completed_at || resultData.submitted_at || resultData.created_at;

  const getScoreGrade = (s: number) => {
    if (s >= 80) return { label: 'Xuất sắc', color: 'bg-green-500' };
    if (s >= 65) return { label: 'Khá / Giỏi', color: 'bg-blue-500' };
    if (s >= 50) return { label: 'Trung bình', color: 'bg-yellow-500' };
    return { label: 'Chưa đạt', color: 'bg-red-500' };
  };

  const grade = getScoreGrade(score);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white pb-12">
      {/* Header Navigation */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <Button variant="ghost" size="sm" onClick={() => navigate('/student/dashboard')} className="gap-2">
            <Home className="h-4 w-4" /> Về trang chủ
          </Button>
          <Badge variant="outline" className="px-3 py-1">ID Bài thi: {examId}</Badge>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 mt-8 space-y-8">
        {/* Tiêu đề kết quả */}
        <div className="text-center space-y-2 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-lg mb-2">
            <Award className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Kết Quả Thi</h1>
          <p className="text-lg text-blue-600 font-medium">{resultData.exam_name}</p>
        </div>

        {/* Thẻ điểm số chính */}
        <Card className="shadow-2xl border-none overflow-hidden animate-in zoom-in-95 duration-700">
          <div className={`p-10 text-center text-white bg-gradient-to-br from-blue-600 to-indigo-700`}>
            <p className="text-blue-100 uppercase tracking-widest text-sm font-bold mb-2">Tổng điểm của bạn</p>
            <div className="text-8xl font-black mb-4 tracking-tighter">
              {score}
            </div>
            <Badge className={`${grade.color} text-white border-none text-lg px-6 py-1 shadow-md`}>
              {grade.label}
            </Badge>
          </div>
          
          <CardContent className="p-8 bg-white">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-green-50 rounded-2xl border border-green-100">
                <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="text-xs text-green-700 font-bold uppercase">Câu đúng</p>
                <p className="text-3xl font-bold text-green-600">{correctCount}</p>
              </div>

              <div className="text-center p-6 bg-red-50 rounded-2xl border border-red-100">
                <XCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                <p className="text-xs text-red-700 font-bold uppercase">Câu sai</p>
                <p className="text-3xl font-bold text-red-600">{wrongCount}</p>
              </div>

              <div className="text-center p-6 bg-blue-50 rounded-2xl border border-blue-100">
                <Award className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <p className="text-xs text-blue-700 font-bold uppercase">Tổng số câu</p>
                <p className="text-3xl font-bold text-blue-600">{totalQuestions}</p>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t space-y-4">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-gray-500">
                  <Calendar className="h-4 w-4" />
                  <span>Ngày hoàn thành:</span>
                </div>
                <span className="font-semibold text-gray-800">
                  {finishedAt ? new Date(finishedAt).toLocaleString('vi-VN') : 'Chưa có'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-gray-500">
                  <Clock className="h-4 w-4" />
                  <span>Thời gian làm bài:</span>
                </div>
                <span className="font-semibold text-gray-800">{durationMinutes} phút</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Phân tích tỷ lệ */}
        <Card className="shadow-lg border-none">
          <CardHeader>
            <CardTitle className="text-lg">Phân tích chi tiết</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600 font-medium">Tỷ lệ trả lời chính xác</span>
                <span className="font-bold text-blue-600">{accuracy.toFixed(1)}%</span>
              </div>
              <div className="h-4 bg-gray-100 rounded-full overflow-hidden p-1">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all duration-1000"
                  style={{ width: `${accuracy}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-xs text-gray-500 font-bold uppercase mb-1">Môn học</p>
                <p className="font-bold text-gray-800">{subjectName}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-xs text-gray-500 font-bold uppercase mb-1">Trạng thái bài thi</p>
                <Badge className="bg-green-600">Đã hoàn thành</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Nút hành động */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Button 
            variant="outline" 
            size="lg"
            className="px-8 font-bold border-2"
            onClick={() => navigate('/student/dashboard')}
          >
            Quay lại trang chủ
          </Button>
          <Button 
            size="lg"
            className="px-8 font-bold bg-blue-600 hover:bg-blue-700 shadow-md"
            onClick={() => window.print()}
          >
            In kết quả thi
          </Button>
        </div>
      </div>
    </div>
  );
}
