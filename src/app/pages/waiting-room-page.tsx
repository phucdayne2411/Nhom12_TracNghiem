import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
// Sử dụng api instance từ context để đồng bộ Token
import { api } from '../context/auth-context'; 
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { ArrowLeft, Clock, FileText, AlertCircle, CheckCircle2, Loader2, BookOpen, Lock } from 'lucide-react';
import { toast } from 'sonner';

export function WaitingRoomPage() {
  const { examId } = useParams();
  const navigate = useNavigate();
  
  const [exam, setExam] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeUntilStart, setTimeUntilStart] = useState<number>(0);
  const [canStart, setCanStart] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordRequired, setPasswordRequired] = useState(false);
  const [passwordVerified, setPasswordVerified] = useState(false);

  // 1. Tải thông tin bài thi chi tiết từ Backend
  useEffect(() => {
    const fetchExamDetail = async () => {
      if (!examId) return;
      try {
        setLoading(true);
        const response = await api.get(`/student/exams/${examId}`);
        
        // Nếu bài thi đã làm rồi thì đá thẳng sang trang kết quả
        if (response.data.is_completed) {
          toast.info("Bạn đã làm bài thi này. Chuyển đến trang kết quả.");
          navigate(`/student/result/${examId}`, { replace: true });
          return;
        }

        setExam(response.data);
        setPasswordRequired(!!response.data.password);
        setPasswordVerified(!response.data.password); // Nếu không có password thì coi như đã verified
      } catch (error: any) {
        console.error("Lỗi tải thông tin bài thi:", error);
        toast.error("Không tìm thấy thông tin bài thi.");
      } finally {
        setLoading(false);
      }
    };

    fetchExamDetail();
  }, [examId, navigate]);

  // 3. Hàm xác thực mật khẩu
  const verifyPassword = async () => {
    if (!password.trim()) {
      toast.error('Vui lòng nhập mật khẩu');
      return;
    }

    try {
      const response = await api.get(`/student/exams/${examId}`, {
        params: { password }
      });
      setExam(response.data);
      setPasswordVerified(true);
      toast.success('Mật khẩu chính xác!');
    } catch (error: any) {
      console.error("Lỗi xác thực mật khẩu:", error);
      toast.error(error.response?.data?.message || 'Mật khẩu không đúng');
    }
  };

  // 2. Logic tính toán thời gian đếm ngược
  useEffect(() => {
    if (!exam) return;

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const startTime = new Date(exam.start_time).getTime();
      const endTime = new Date(exam.end_time).getTime();
      
      const diff = startTime - now;
      
      if (now >= startTime && now < endTime) {
        setCanStart(true);
        setTimeUntilStart(0);
        clearInterval(timer);
      } else if (diff > 0) {
        setTimeUntilStart(Math.floor(diff / 1000));
      } else if (now >= endTime) {
        // Nếu đã quá giờ kết thúc
        setCanStart(false);
        setTimeUntilStart(-1); 
        clearInterval(timer);
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [exam]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-gray-500 italic text-sm">Đang xác thực thông tin phòng thi...</p>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full shadow-xl border-none p-6 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-900">Lỗi truy cập</h3>
          <p className="text-gray-600 mt-2">Bài thi không tồn tại hoặc đã bị gỡ bỏ.</p>
          <Button className="mt-6 w-full" onClick={() => navigate('/student/dashboard')}>Quay lại Dashboard</Button>
        </Card>
      </div>
    );
  }

  const formatCountdown = (seconds: number) => {
    if (seconds < 0) return "Đã hết thời gian thi";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header Navigation */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-10 p-4">
        <div className="max-w-4xl mx-auto flex items-center">
          <Button variant="ghost" size="sm" onClick={() => navigate('/student/dashboard')} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Quay lại
          </Button>
          <span className="ml-auto text-xs font-bold text-gray-400 uppercase tracking-widest">Phòng chờ thi</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 mt-8 space-y-6 animate-in fade-in duration-700">
        {/* Exam Summary Info */}
        <Card className="shadow-lg border-none overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-3xl font-bold leading-tight">{exam.name}</CardTitle>
                <p className="text-blue-100 mt-2 font-medium flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  {typeof exam.subject === 'object'
                    ? exam.subject?.name || exam.subject_name || 'N/A'
                    : exam.subject_name || exam.subject || 'N/A'}
                </p>
              </div>
              <Badge className="bg-white/20 text-white border-none px-4 py-1 text-sm uppercase">Trực tuyến</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-8 bg-white">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm border border-blue-100">
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-bold uppercase">Số câu hỏi</p>
                  <p className="font-bold text-xl text-gray-800">{exam.total_questions || exam.totalQuestions}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-green-50 flex items-center justify-center text-green-600 shadow-sm border border-green-100">
                  <Clock className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-bold uppercase">Thời gian</p>
                  <p className="font-bold text-xl text-gray-800">{exam.duration} phút</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600 shadow-sm border border-purple-100">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-bold uppercase">Thang điểm</p>
                  <p className="font-bold text-xl text-gray-800">100 / 100</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Section */}
        <Card className="shadow-lg border-none">
          <CardContent className="p-10">
            {passwordRequired && !passwordVerified ? (
              <div className="text-center space-y-6">
                <div className="h-24 w-24 rounded-full bg-blue-50 flex items-center justify-center mx-auto border-4 border-blue-100">
                  <Lock className="h-10 w-10 text-blue-500" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-gray-900">Bài thi được bảo vệ</h3>
                  <p className="text-gray-500">Vui lòng nhập mật khẩu để truy cập bài thi.</p>
                </div>
                <div className="max-w-sm mx-auto space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium">Mật khẩu bài thi</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Nhập mật khẩu..."
                      className="text-center text-lg"
                      onKeyPress={(e) => e.key === 'Enter' && verifyPassword()}
                    />
                  </div>
                  <Button 
                    size="lg"
                    className="w-full h-12 font-bold"
                    onClick={verifyPassword}
                  >
                    Xác nhận mật khẩu
                  </Button>
                </div>
              </div>
            ) : !canStart ? (
              <div className="text-center space-y-6">
                <div className="h-24 w-24 rounded-full bg-yellow-50 flex items-center justify-center mx-auto border-4 border-yellow-100 animate-pulse">
                  <Clock className="h-10 w-10 text-yellow-500" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-gray-900">Vui lòng chờ đến giờ thi</h3>
                  <p className="text-gray-500">Hệ thống sẽ mở khóa nút làm bài sau:</p>
                </div>
                <div className="text-6xl font-black text-blue-600 tracking-tighter tabular-nums">
                  {formatCountdown(timeUntilStart)}
                </div>
                <Button disabled className="mt-4 h-12 px-10 rounded-full font-bold opacity-50">
                  Chưa đến giờ làm bài
                </Button>
              </div>
            ) : (
              <div className="text-center space-y-6">
                <div className="h-24 w-24 rounded-full bg-green-50 flex items-center justify-center mx-auto border-4 border-green-100">
                  <CheckCircle2 className="h-12 w-12 text-green-600" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-green-600">Phòng thi đã mở!</h3>
                  <p className="text-gray-600">Tất cả dữ liệu đã sẵn sàng, bạn có thể bắt đầu ngay bây giờ.</p>
                </div>
                <Button 
                  size="lg"
                  className="mt-4 h-14 px-12 rounded-full font-bold bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-600/20 text-lg transition-all active:scale-95"
                  onClick={() => navigate(`/student/exam/${exam.id}`)}
                >
                  Bắt đầu làm bài thi
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Rules & Regulations */}
        <Card className="shadow-md border-none overflow-hidden">
          <CardHeader className="bg-gray-50 border-b">
            <CardTitle className="text-lg font-bold flex items-center gap-2 text-gray-700">
              <AlertCircle className="h-5 w-5 text-blue-500" />
              Nội quy phòng thi trực tuyến
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <Alert className="mb-6 bg-blue-50 border-blue-100 text-blue-800">
              <AlertDescription className="font-medium">
                Vui lòng đảm bảo kết nối mạng ổn định trước khi nhấn "Bắt đầu". Sau khi vào thi, đồng hồ sẽ không ngừng lại.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
              {[
                `Thời gian làm bài là ${exam.duration} phút.`,
                `Bài thi gồm ${exam.total_questions || exam.totalQuestions} câu hỏi trắc nghiệm.`,
                "Hệ thống tự động nộp bài khi hết giờ.",
                "Mỗi câu hỏi chỉ có 01 đáp án đúng duy nhất.",
                "Không được chuyển tab hoặc thoát trình duyệt.",
                "Đảm bảo thiết bị còn đủ dung lượng pin.",
                "Mọi hành vi gian lận sẽ bị hệ thống ghi nhận."
              ].map((rule, i) => (
                <div key={i} className="flex items-start gap-3 text-sm text-gray-600">
                  <div className="h-5 w-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 text-[10px] font-bold">
                    {i + 1}
                  </div>
                  <span>{rule}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}