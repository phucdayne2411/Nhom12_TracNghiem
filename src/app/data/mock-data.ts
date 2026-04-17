export interface Exam {
  id: string;
  name: string;
  subject: string;
  startTime: string;
  endTime: string;
  duration: number; // minutes
  status: 'upcoming' | 'ongoing' | 'completed';
  totalQuestions: number;
  password?: string;
}

export interface Question {
  id: string;
  examId: string;
  questionText: string;
  options: {
    id: string;
    text: string;
    label: 'A' | 'B' | 'C' | 'D';
  }[];
  correctAnswer: string;
  subject: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface ExamResult {
  id: string;
  examId: string;
  studentId: string;
  studentName: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  completedAt: string;
}

export interface Student {
  id: string;
  name: string;
  mssv: string;
  email: string;
  class: string;
}

// Mock data
export const mockExams: Exam[] = [
  {
    id: 'exam1',
    name: 'Kiểm tra giữa kỳ - Cấu trúc dữ liệu',
    subject: 'Cấu trúc dữ liệu',
    startTime: '2026-03-30T09:00:00',
    endTime: '2026-03-30T10:30:00',
    duration: 90,
    status: 'upcoming',
    totalQuestions: 40,
    password: '123456'
  },
  {
    id: 'exam2',
    name: 'Bài tập tuần 8 - Lập trình hướng đối tượng',
    subject: 'Lập trình hướng đối tượng',
    startTime: '2026-03-28T14:00:00',
    endTime: '2026-03-28T15:00:00',
    duration: 60,
    status: 'ongoing',
    totalQuestions: 30
  },
  {
    id: 'exam3',
    name: 'Kiểm tra cuối kỳ - Cơ sở dữ liệu',
    subject: 'Cơ sở dữ liệu',
    startTime: '2026-03-20T08:00:00',
    endTime: '2026-03-20T10:00:00',
    duration: 120,
    status: 'completed',
    totalQuestions: 50
  },
  {
    id: 'exam4',
    name: 'Quiz tuần 9 - Mạng máy tính',
    subject: 'Mạng máy tính',
    startTime: '2026-03-25T10:00:00',
    endTime: '2026-03-25T10:30:00',
    duration: 30,
    status: 'completed',
    totalQuestions: 20
  }
];

export const mockQuestions: Question[] = [
  {
    id: 'q1',
    examId: 'exam2',
    questionText: 'Trong Java, từ khóa nào được sử dụng để kế thừa một lớp?',
    options: [
      { id: 'q1a', text: 'implements', label: 'A' },
      { id: 'q1b', text: 'extends', label: 'B' },
      { id: 'q1c', text: 'inherits', label: 'C' },
      { id: 'q1d', text: 'super', label: 'D' }
    ],
    correctAnswer: 'q1b',
    subject: 'Lập trình hướng đối tượng',
    difficulty: 'easy'
  },
  {
    id: 'q2',
    examId: 'exam2',
    questionText: 'Tính đóng gói (Encapsulation) trong OOP có nghĩa là gì?',
    options: [
      { id: 'q2a', text: 'Che giấu thông tin và chỉ cho phép truy cập qua các phương thức công khai', label: 'A' },
      { id: 'q2b', text: 'Cho phép một lớp kế thừa từ nhiều lớp khác', label: 'B' },
      { id: 'q2c', text: 'Tạo ra các đối tượng từ lớp', label: 'C' },
      { id: 'q2d', text: 'Ghi đè phương thức của lớp cha', label: 'D' }
    ],
    correctAnswer: 'q2a',
    subject: 'Lập trình hướng đối tượng',
    difficulty: 'medium'
  },
  {
    id: 'q3',
    examId: 'exam2',
    questionText: 'Phương thức nào sau đây không thể bị ghi đè (override) trong Java?',
    options: [
      { id: 'q3a', text: 'Public method', label: 'A' },
      { id: 'q3b', text: 'Protected method', label: 'B' },
      { id: 'q3c', text: 'Final method', label: 'C' },
      { id: 'q3d', text: 'Static method', label: 'D' }
    ],
    correctAnswer: 'q3c',
    subject: 'Lập trình hướng đối tượng',
    difficulty: 'medium'
  },
  {
    id: 'q4',
    examId: 'exam2',
    questionText: 'Constructor trong Java có đặc điểm gì?',
    options: [
      { id: 'q4a', text: 'Phải có kiểu trả về', label: 'A' },
      { id: 'q4b', text: 'Có tên giống với tên lớp', label: 'B' },
      { id: 'q4c', text: 'Không thể có tham số', label: 'C' },
      { id: 'q4d', text: 'Chỉ được gọi một lần duy nhất', label: 'D' }
    ],
    correctAnswer: 'q4b',
    subject: 'Lập trình hướng đối tượng',
    difficulty: 'easy'
  },
  {
    id: 'q5',
    examId: 'exam2',
    questionText: 'Interface trong Java có thể chứa gì?',
    options: [
      { id: 'q5a', text: 'Chỉ các phương thức trừu tượng', label: 'A' },
      { id: 'q5b', text: 'Các phương thức trừu tượng và các hằng số', label: 'B' },
      { id: 'q5c', text: 'Các phương thức cụ thể', label: 'C' },
      { id: 'q5d', text: 'Các biến instance', label: 'D' }
    ],
    correctAnswer: 'q5b',
    subject: 'Lập trình hướng đối tượng',
    difficulty: 'medium'
  }
];

// Generate more questions for a complete exam
for (let i = 6; i <= 30; i++) {
  mockQuestions.push({
    id: `q${i}`,
    examId: 'exam2',
    questionText: `Câu hỏi ${i}: Khái niệm nào sau đây là đúng về lập trình hướng đối tượng?`,
    options: [
      { id: `q${i}a`, text: 'Đáp án A cho câu hỏi ' + i, label: 'A' },
      { id: `q${i}b`, text: 'Đáp án B cho câu hỏi ' + i, label: 'B' },
      { id: `q${i}c`, text: 'Đáp án C cho câu hỏi ' + i, label: 'C' },
      { id: `q${i}d`, text: 'Đáp án D cho câu hỏi ' + i, label: 'D' }
    ],
    correctAnswer: `q${i}${['a', 'b', 'c', 'd'][Math.floor(Math.random() * 4)]}`,
    subject: 'Lập trình hướng đối tượng',
    difficulty: ['easy', 'medium', 'hard'][Math.floor(Math.random() * 3)] as 'easy' | 'medium' | 'hard'
  });
}

export const mockResults: ExamResult[] = [
  {
    id: 'result1',
    examId: 'exam3',
    studentId: 'sv001',
    studentName: 'Nguyễn Văn An',
    score: 85,
    totalQuestions: 50,
    correctAnswers: 43,
    completedAt: '2026-03-20T09:45:00'
  },
  {
    id: 'result2',
    examId: 'exam4',
    studentId: 'sv001',
    studentName: 'Nguyễn Văn An',
    score: 90,
    totalQuestions: 20,
    correctAnswers: 18,
    completedAt: '2026-03-25T10:25:00'
  }
];

export const mockStudents: Student[] = [
  { id: 'sv001', name: 'Nguyễn Văn An', mssv: '21520001', email: 'sinhvien@uit.edu.vn', class: 'KHMT2021' },
  { id: 'sv002', name: 'Trần Thị Bích', mssv: '21520002', email: '21520002@gm.uit.edu.vn', class: 'KHMT2021' },
  { id: 'sv003', name: 'Lê Văn Cường', mssv: '21520003', email: '21520003@gm.uit.edu.vn', class: 'KHMT2021' },
  { id: 'sv004', name: 'Phạm Thị Dung', mssv: '21520004', email: '21520004@gm.uit.edu.vn', class: 'KHMT2022' },
  { id: 'sv005', name: 'Hoàng Văn Em', mssv: '21520005', email: '21520005@gm.uit.edu.vn', class: 'KHMT2022' },
  { id: 'sv006', name: 'Võ Thị Phương', mssv: '21520006', email: '21520006@gm.uit.edu.vn', class: 'KHMT2022' },
  { id: 'sv007', name: 'Đặng Văn Giang', mssv: '21520007', email: '21520007@gm.uit.edu.vn', class: 'KHMT2023' },
  { id: 'sv008', name: 'Bùi Thị Hoa', mssv: '21520008', email: '21520008@gm.uit.edu.vn', class: 'KHMT2023' },
];
