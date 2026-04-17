import { useState } from 'react';
// Import api từ context để gọi endpoint thực tế
import { api } from '../context/auth-context'; 
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { ArrowLeft, CheckCircle2, GraduationCap, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Kiểm tra định dạng email cơ bản
    if (!email.trim()) {
      toast.error("Vui lòng nhập địa chỉ email");
      return;
    }

    setIsSubmitting(true);
    try {
      // Gọi API gửi yêu cầu quên mật khẩu đến Backend Laravel
      // Endpoint giả định: /api/forgot-password
      await api.post('/forgot-password', { email });
      
      setSubmitted(true);
      toast.success("Yêu cầu đã được gửi!");
    } catch (error: any) {
      console.error("Lỗi quên mật khẩu:", error);
      const message = error.response?.data?.message || "Có lỗi xảy ra, vui lòng thử lại sau";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo and Title */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-xl bg-primary flex items-center justify-center shadow-lg">
              <GraduationCap className="h-9 w-9 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">Quên mật khẩu</h1>
          <p className="text-gray-600">Khôi phục quyền truy cập vào UIT Exam</p>
        </div>

        {/* Form Card */}
        <Card className="shadow-xl border-0 bg-white">
          <CardHeader>
            <CardTitle>Khôi phục mật khẩu</CardTitle>
            <CardDescription>
              {submitted 
                ? 'Vui lòng kiểm tra hộp thư của bạn'
                : 'Hệ thống sẽ gửi một liên kết đặt lại mật khẩu qua email'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {submitted ? (
              <div className="space-y-4">
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800 leading-relaxed">
                    Liên kết đặt lại mật khẩu đã được gửi đến <strong>{email}</strong>. 
                    Vui lòng kiểm tra hộp thư của bạn (kể cả thư mục spam).
                  </AlertDescription>
                </Alert>

                <Button
                  variant="outline"
                  className="w-full h-11"
                  onClick={() => setSubmitted(false)}
                >
                  Gửi lại yêu cầu khác
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">Địa chỉ Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="example@stu.edu.vn"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isSubmitting}
                    className="h-11 border-gray-200 focus:ring-primary"
                  />
                </div>

                <Button type="submit" className="w-full h-11 font-semibold" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang xử lý...
                    </>
                  ) : (
                    "Gửi liên kết khôi phục"
                  )}
                </Button>
              </form>
            )}

            <div className="mt-6 text-center">
              <a 
                href="/" 
                className="text-sm font-medium text-primary hover:text-primary/80 transition-colors inline-flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Quay lại trang đăng nhập
              </a>
            </div>
          </CardContent>
        </Card>
        
        <p className="text-center text-xs text-gray-400">
          © 2026 UIT Exam System. All rights reserved.
        </p>
      </div>
    </div>
  );
}