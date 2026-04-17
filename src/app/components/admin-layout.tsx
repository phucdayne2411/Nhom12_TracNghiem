import { useState } from 'react';
import { Navigate, useNavigate, Outlet, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/auth-context';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  FileText, 
  ClipboardList, 
  LogOut, 
  Menu, 
  X,
  GraduationCap
} from 'lucide-react';
import { Button } from './ui/button';

export function AdminLayout() {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation(); // Đã thêm dòng này để khắc phục lỗi
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (loading) {
    return null;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  const handleLogout = async () => {
    navigate('/', { replace: true });
    await logout();
  };

  const menuItems = [
    { label: 'Tổng quan', path: '/admin/dashboard', icon: LayoutDashboard, allowedRoles: ['admin', 'teacher'] },
    { label: 'Quản lý môn học', path: '/admin/subjects', icon: GraduationCap, allowedRoles: ['admin'] },
    { label: 'Quản lý tài khoản', path: '/admin/users', icon: Users, allowedRoles: ['admin'] },
    { label: 'Ngân hàng câu hỏi', path: '/admin/questions', icon: BookOpen, allowedRoles: ['admin', 'teacher'] },
    { label: 'Quản lý bài thi', path: '/admin/exams', icon: FileText, allowedRoles: ['admin', 'teacher'] },
    { label: 'Kết quả thi', path: '/admin/results', icon: ClipboardList, allowedRoles: ['admin', 'teacher'] },
  ];

  // Lọc menu dựa trên role của người dùng
  const authorizedMenu = menuItems.filter(item => item.allowedRoles.includes(user?.role || ''));

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar dành cho Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r shadow-sm">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-blue-600 flex items-center gap-2">
            <FileText className="h-8 w-8" /> UIT Exam
          </h2>
        </div>
        
        <nav className="flex-1 px-4 space-y-1">
          {authorizedMenu.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link 
                key={item.path} 
                to={item.path} 
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t">
          <div className="flex items-center gap-3 px-4 py-3 mb-2">
            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-semibold truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 truncate">
                {user?.role === 'admin' ? 'Quản trị viên' : 'Giáo viên'}
              </p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 gap-3" 
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" /> Đăng xuất
          </Button>
        </div>
      </aside>

      {/* Main Content & Mobile Header */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="lg:hidden bg-white border-b h-16 flex items-center justify-between px-4 shrink-0">
          <h2 className="text-xl font-bold text-blue-600">UIT Exam</h2>
          <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X /> : <Menu />}
          </Button>
        </header>
        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}