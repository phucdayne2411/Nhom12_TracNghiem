import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// Sử dụng instance api dùng chung để tự động đính kèm Token
import { api } from '../context/auth-context'; 
import { useAuth } from '../context/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Clock, BookOpen, AlertCircle, PlayCircle, Eye, LogOut, Loader2, Calendar } from 'lucide-react';
import { toast } from 'sonner';

interface Exam {
  id: number;
  name: string;
  subject: string;
  start_time: string;
  end_time: string;
  duration: number;
  total_questions: number;
  status: 'upcoming' | 'ongoing' | 'completed';
}

export function StudentDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [exams, setExams] = useState<Exam[]>([]);

  // 1. Tải danh sách bài thi từ Backend Render
  const fetchExams = async () => {
    setLoading(true);
    try {
      // Gọi API lấy danh sách bài thi dành cho sinh viên
      const response = await api.get('/student/exams');
      setExams(response.data);
    } catch (error: any) {
      console.error("Lỗi khi tải bài thi:", error);
      toast.error("Không thể tải danh sách bài thi. Vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
    toast.success("Đã đăng xuất thành công");
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      year: 'numeric'
    });
  };

  // 2. Hàm render từng cột trạng thái bài thi
  const renderExamColumn = (title: string, icon: any, colorClass: string, status: string) => {
    const filtered = exams.filter(e => e.status === status);
    const Icon = icon;

    return (
      <Card className="border-none shadow-md bg-white h-full overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
        <CardHeader className="border-b bg-gray-50/50 p-5">
          <CardTitle className="flex items-center gap-3 text-lg font-bold text-gray-800">
            <div className={`p-2 rounded-xl bg-white shadow-sm border border-gray-100 ${colorClass}`}>
              <Icon className="h-5 w-5" />
            </div>
            {title}
            <span className="ml-auto text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full font-medium">
              {filtered.length}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-4 max-h-[600px] overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
              <p className="text-sm text-gray-400 italic">Đang đồng bộ...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="bg-gray-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <BookOpen className="h-6 w-6 text-gray-300" />
              </div>
              <p className="text-sm text-gray-400 italic">Hiện tại không có bài thi nào</p>
            </div>
          ) : (
            filtered.map((exam) => (
              <div 
                key={exam.id} 
                className="p-4 rounded-2xl border border-gray-100 bg-white hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300 group"
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-gray-900 leading-tight group-hover:text-blue-600 transition-colors">{exam.name}</h4>
                </div>
                <p className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-4">{exam.subject || exam.subject_name || 'N/A'}</p>
                
                <div className="space-y-2 mb-5">
                  <div className="flex items-center gap-2 text-[13px] text-gray-500">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{formatDateTime(exam.start_time)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[13px] text-gray-500">
                    <Clock className="h-3.5 w-3.5" />
                    <span>Thời gian làm bài: <b>{exam.duration} phút</b></span>
                  </div>
                </div>

                {status === 'ongoing' && (
                  <Button 
                    className="w-full bg-green-600 hover:bg-green-700 shadow-lg shadow-green-600/20 gap-2 h-10 font-bold"
                    onClick={() => navigate(`/student/waiting-room/${exam.id}`)}
                  >
                    <PlayCircle className="h-4 w-4" /> Làm bài ngay
                  </Button>
                )}
                {status === 'completed' && (
                  <Button 
                    variant="outline" 
                    className="w-full gap-2 border-2 h-10 font-bold hover:bg-gray-50 transition-colors"
                    onClick={() => navigate(`/student/result/${exam.id}`)}
                  >
                    <Eye className="h-4 w-4" /> Xem kết quả
                  </Button>
                )}
                {status === 'upcoming' && (
                  <Button disabled variant="secondary" className="w-full gap-2 h-10 font-bold opacity-60">
                    <Clock className="h-4 w-4" /> Chờ ngày thi
                  </Button>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Student Header */}
      <header className="bg-white border-b sticky top-0 z-20 backdrop-blur-md bg-white/80">
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary p-2 rounded-xl text-white shadow-lg shadow-primary/20">
              <BookOpen className="h-6 w-6" />
            </div>
            <div className="hidden xs:block">
              <span className="text-xl font-black tracking-tighter text-gray-900">UIT EXAM</span>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none">Student Portal</p>
            </div>
          </div>
          
          <div className="flex items-center gap-5">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-black text-gray-900">{user?.name}</p>
              <p className="text-[11px] text-gray-500 font-medium">MSSV: {user?.mssv || 'N/A'}</p>
            </div>
            <div className="h-8 w-px bg-gray-200 hidden sm:block"></div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-red-500 hover:bg-red-50 rounded-full transition-colors"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 lg:p-10">
        <div className="mb-10 animate-in fade-in slide-in-from-left-4 duration-700">
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Danh sách bài thi</h2>
          <p className="text-gray-500 font-medium mt-1">Lựa chọn bài thi đúng lịch trình để bắt đầu bài làm của bạn.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 pb-10">
          {renderExamColumn('Sắp diễn ra', AlertCircle, 'text-yellow-500', 'upcoming')}
          {renderExamColumn('Đang diễn ra', PlayCircle, 'text-green-500', 'ongoing')}
          {renderExamColumn('Đã kết thúc', BookOpen, 'text-gray-500', 'completed')}
        </div>
      </main>
      
      <footer className="max-w-7xl mx-auto px-6 py-8 border-t text-center text-xs text-gray-400 font-medium uppercase tracking-widest">
        © 2026 UIT Exam Management System
      </footer>
    </div>
  );
}
