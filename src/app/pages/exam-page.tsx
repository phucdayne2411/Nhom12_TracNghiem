import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
// Sử dụng api instance từ context để tự động đính kèm Token
import { api } from '../context/auth-context'; 
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Label } from '../components/ui/label';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Clock, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { toast } from 'sonner';

interface QuestionItem {
  id: string;
  questionText: string;
  options: { id: string; text: string; label: 'A' | 'B' | 'C' | 'D' }[];
}

export function ExamPage() {
  const { examId } = useParams();
  const navigate = useNavigate();
  
  const [exam, setExam] = useState<any>(null);
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(0); 
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Tải thông tin đề thi và câu hỏi từ Backend
  useEffect(() => {
    const loadExam = async () => {
      if (!examId) return;
      try {
        const response = await api.get(`/student/exams/${examId}`);
        const examData = response.data;
        
        setExam(examData);
        setTimeLeft(examData.duration * 60);

        const mappedQuestions = examData.questions.map((q: any) => ({
          id: q.id.toString(),
          questionText: q.content,
          options: [
            { id: 'A', text: q.option_a, label: 'A' },
            { id: 'B', text: q.option_b, label: 'B' },
            { id: 'C', text: q.option_c, label: 'C' },
            { id: 'D', text: q.option_d, label: 'D' }
          ]
        }));
        setQuestions(mappedQuestions);
      } catch (error) {
        console.error('Lỗi tải đề thi:', error);
        toast.error("Không thể tải đề thi. Vui lòng thử lại!");
      } finally {
        setLoading(false);
      }
    };
    loadExam();
  }, [examId]);

  // 2. Bộ đếm ngược thời gian
  useEffect(() => {
    if (!exam || loading || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          autoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [exam, loading, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerChange = (value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questions[currentQuestionIndex].id]: value
    }));
  };

  // 3. Hàm nộp bài lên Backend
  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await api.post(
        `/student/exams/${examId}/submit`,
        { answers },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        }
      );

      toast.success(response.data.message || "Nộp bài thành công!");
      navigate(`/student/result/${examId}`);
    } catch (error: any) {
      console.error("Lỗi nộp bài:", error);
      const message = error?.response?.data?.message || error?.message || "Lỗi khi gửi bài làm. Vui lòng kiểm tra kết nối!";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
      setShowSubmitDialog(false);
    }
  };

  const autoSubmit = () => {
    toast.info("Hết giờ! Hệ thống đang tự động nộp bài.");
    handleSubmit();
  };

  if (loading) return <div className="h-screen flex items-center justify-center italic text-gray-500">Đang tải câu hỏi...</div>;
  if (!exam || questions.length === 0) return <div className="p-10 text-center">Không tìm thấy dữ liệu bài thi.</div>;

  const currentQuestion = questions[currentQuestionIndex];
  const answeredCount = Object.keys(answers).length;
  const unansweredCount = questions.length - answeredCount;

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      {/* Sticky Header */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-10 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="font-bold text-xl text-blue-700">{exam.name}</h1>
            <p className="text-sm text-gray-500 uppercase">{exam.subject_name || exam.subject}</p>
          </div>
          <div className="flex items-center gap-6">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${timeLeft < 300 ? 'bg-red-50 border-red-200 text-red-600' : 'bg-gray-50 border-gray-200 text-gray-700'}`}>
              <Clock className="h-5 w-5" />
              <span className="font-mono text-xl font-bold">{formatTime(timeLeft)}</span>
            </div>
            <Button onClick={() => setShowSubmitDialog(true)} disabled={isSubmitting}>Nộp bài</Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Vùng hiển thị câu hỏi */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-md">
            <CardContent className="p-8">
              <div className="mb-8">
                <span className="text-blue-600 font-bold text-sm uppercase tracking-wider">Câu hỏi {currentQuestionIndex + 1}</span>
                <h3 className="text-xl font-medium text-gray-800 mt-2 leading-relaxed">
                  {currentQuestion.questionText}
                </h3>
              </div>

              <RadioGroup 
                value={answers[currentQuestion.id] || ''} 
                onValueChange={handleAnswerChange}
                className="space-y-4"
              >
                {currentQuestion.options.map((option) => (
                  <div 
                    key={option.id}
                    className={`flex items-center space-x-3 p-4 rounded-xl border-2 transition-all cursor-pointer ${
                      answers[currentQuestion.id] === option.id ? 'border-blue-500 bg-blue-50' : 'border-gray-100 hover:bg-gray-50'
                    }`}
                  >
                    <RadioGroupItem value={option.id} id={option.id} />
                    <Label htmlFor={option.id} className="flex-1 cursor-pointer text-base font-normal flex items-center">
                      <span className="w-8 h-8 flex items-center justify-center rounded-full bg-white border mr-3 font-bold text-sm">{option.label}</span>
                      {option.text}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setCurrentQuestionIndex(prev => prev - 1)} disabled={currentQuestionIndex === 0}>Câu trước</Button>
            <Button onClick={() => setCurrentQuestionIndex(prev => prev + 1)} disabled={currentQuestionIndex === questions.length - 1}>Câu tiếp theo</Button>
          </div>
        </div>

        {/* Panel danh sách câu hỏi bên phải */}
        <div className="space-y-6">
          <Card className="shadow-md border-none sticky top-28">
            <CardContent className="p-6">
              <h4 className="font-bold text-gray-800 mb-4">Tiến độ làm bài</h4>
              <div className="grid grid-cols-5 gap-2">
                {questions.map((q, idx) => (
                  <button
                    key={q.id}
                    onClick={() => setCurrentQuestionIndex(idx)}
                    className={`h-10 rounded-lg font-bold transition-all ${
                      idx === currentQuestionIndex ? 'bg-blue-600 text-white' : 
                      answers[q.id] ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>
              <div className="mt-6 pt-4 border-t flex justify-between text-sm">
                <span>Đã làm: <b className="text-green-600">{answeredCount}</b></span>
                <span>Còn lại: <b className="text-red-500">{unansweredCount}</b></span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialog xác nhận nộp bài */}
      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bạn có muốn kết thúc bài thi?</DialogTitle>
            <DialogDescription>
              Hệ thống ghi nhận bạn còn <b>{unansweredCount}</b> câu chưa trả lời.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSubmitDialog(false)}>Tiếp tục làm</Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Đang nộp..." : "Xác nhận nộp bài"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
