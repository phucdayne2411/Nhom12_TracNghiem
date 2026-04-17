import { useState, useEffect } from 'react';
// Sử dụng api instance chung để tự động xử lý Token
import { api } from '../context/auth-context'; 
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Plus, Search, Edit, Trash2, Loader2, ShieldCheck, UserCircle } from 'lucide-react';
import { toast } from 'sonner';

interface UserData {
  id: number;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

export function UsersManagement() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student'
  });

  // 1. TẢI DANH SÁCH TÀI KHOẢN TỪ BACKEND
  const fetchUsers = async () => {
    try {
      setLoading(true);
      // Gọi qua api instance đã có baseURL: https://onlineexambe.onrender.com/api
      const response = await api.get('/admin/users', {
        params: { search: searchTerm }
      });
      setUsers(response.data);
    } catch (error: any) {
      console.error("Lỗi khi tải danh sách:", error);
      toast.error('Không thể kết nối với máy chủ để tải danh sách tài khoản');
    } finally {
      setLoading(false);
    }
  };

  // Áp dụng Debounce cho ô tìm kiếm để tránh gọi API quá nhiều
  useEffect(() => {
    const delay = setTimeout(() => fetchUsers(), 500);
    return () => clearTimeout(delay);
  }, [searchTerm]);

  // 2. XỬ LÝ LƯU (TẠO MỚI HOẶC CẬP NHẬT)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation cơ bản
    if (!formData.name.trim() || !formData.email.trim()) {
      toast.error('Vui lòng điền đầy đủ Họ tên và Email');
      return;
    }
    if (!editingUser && (!formData.password || formData.password.length < 6)) {
      toast.error('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingUser) {
        // Cập nhật tài khoản hiện có
        await api.put(`/admin/users/${editingUser.id}`, formData);
        toast.success('Cập nhật thông tin thành công');
      } else {
        // Tạo tài khoản mới
        await api.post('/admin/users', formData);
        toast.success('Cấp tài khoản mới thành công');
      }
      fetchUsers(); // Tải lại danh sách sau khi lưu
      handleDialogClose();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Có lỗi xảy ra khi lưu tài khoản';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. XỬ LÝ XÓA TÀI KHOẢN
  const handleDelete = async (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa tài khoản này? Hành động này không thể hoàn tác.')) {
      return;
    }

    try {
      setIsSubmitting(true);
      await api.delete(`/admin/users/${id}`);
      toast.success('Đã xóa tài khoản vĩnh viễn');
      fetchUsers();
    } catch (error: any) {
      toast.error('Lỗi khi xóa tài khoản. Vui lòng thử lại sau.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (user: UserData) => {
    setEditingUser(user);
    setFormData({ name: user.name, email: user.email, password: '', role: user.role });
    setIsAddDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsAddDialogOpen(false);
    setEditingUser(null);
    setFormData({ name: '', email: '', password: '', role: 'student' });
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Quản lý Tài khoản</h1>
          <p className="text-gray-500 mt-1">Quản lý phân quyền và cấp phát tài khoản cho giáo viên, học sinh</p>
        </div>
        <Button
          className="gap-2 bg-blue-600 hover:bg-blue-700 shadow-md transition-all active:scale-95"
          onClick={() => setIsAddDialogOpen(true)}
          disabled={isSubmitting}
        >
          <Plus className="h-4 w-4" />
          Thêm tài khoản mới
        </Button>
      </div>

      {/* Search Bar Section */}
      <Card className="shadow-sm border-none bg-white">
        <CardContent className="p-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="Tìm kiếm theo tên hoặc email..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="pl-10 h-11 border-gray-200" 
            />
          </div>
        </CardContent>
      </Card>

      {/* Table Section */}
      <Card className="shadow-sm border-none bg-white overflow-hidden">
        <CardHeader className="border-b border-gray-50">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <UserCircle className="h-5 w-5 text-blue-500" />
            Danh sách tài khoản ({users.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="font-bold text-gray-700">Họ và tên</TableHead>
                  <TableHead className="font-bold text-gray-700">Email đăng nhập</TableHead>
                  <TableHead className="font-bold text-gray-700">Phân quyền</TableHead>
                  <TableHead className="font-bold text-gray-700">Ngày tạo</TableHead>
                  <TableHead className="font-bold text-gray-700 text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-gray-400">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                      Đang tải dữ liệu từ máy chủ...
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-gray-400 italic">
                      Chưa có dữ liệu tài khoản nào.
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((u) => (
                    <TableRow key={u.id} className="hover:bg-gray-50/50 transition-colors">
                      <TableCell className="font-semibold text-gray-900">{u.name}</TableCell>
                      <TableCell className="text-gray-600">{u.email}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                          u.role === 'teacher' || u.role === 'admin' 
                            ? 'bg-purple-100 text-purple-700' 
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {u.role === 'teacher' ? <ShieldCheck className="h-3 w-3" /> : null}
                          {u.role === 'teacher' ? 'Giáo viên' : u.role === 'admin' ? 'Quản trị viên' : 'Học sinh'}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {new Date(u.created_at).toLocaleDateString('vi-VN')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(u)}
                            disabled={isSubmitting}
                            className="text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(u.id)}
                            disabled={isSubmitting}
                            className="text-gray-400 hover:text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
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

      {/* Form Dialog Section */}
      <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
        if (!open) handleDialogClose();
        setIsAddDialogOpen(open);
      }}>
        <DialogContent className="max-w-md bg-white border-none rounded-xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {editingUser ? 'Cập nhật thông tin' : 'Cấp tài khoản mới'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-5 py-4">
            <div className="space-y-2">
              <Label className="font-semibold text-gray-700">Loại tài khoản</Label>
              <select
                className="flex h-11 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                disabled={isSubmitting || !!editingUser}
              >
                <option value="student">Học sinh (Sinh viên)</option>
                <option value="teacher">Giáo viên (Giảng viên)</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <Label className="font-semibold text-gray-700">Họ và tên</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="VD: Lê Đặng Hải Phục"
                disabled={isSubmitting}
                required
                className="h-11 border-gray-200"
              />
            </div>

            <div className="space-y-2">
              <Label className="font-semibold text-gray-700">Email đăng nhập</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="vd: student@stu.edu.vn"
                disabled={isSubmitting}
                required
                className="h-11 border-gray-200"
              />
            </div>

            <div className="space-y-2">
              <Label className="font-semibold text-gray-700">
                {editingUser ? 'Mật khẩu mới (Bỏ trống nếu không đổi)' : 'Mật khẩu khởi tạo'}
              </Label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                disabled={isSubmitting}
                required={!editingUser}
                minLength={6}
                className="h-11 border-gray-200"
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0 mt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={handleDialogClose}
                disabled={isSubmitting}
              >
                Hủy bỏ
              </Button>
              <Button
                type="submit"
                className="bg-blue-600 text-white hover:bg-blue-700 px-6"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang xử lý
                  </>
                ) : (
                  editingUser ? 'Cập nhật' : 'Tạo ngay'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}