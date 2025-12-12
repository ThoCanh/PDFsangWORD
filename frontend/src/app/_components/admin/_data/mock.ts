import type { LucideIcon } from "lucide-react";
import { Bot, CheckCircle, Clock, FileText } from "lucide-react";

export type StatCard = {
  label: string;
  value: string;
  change: string;
  icon: LucideIcon;
  color: string;
  bg: string;
};

export type RecentDoc = {
  id: string;
  name: string;
  uploader: string;
  date: string;
  status: "completed" | "processing" | "failed" | "pending";
  confidence: number;
  type: string;
};

export type ProUser = {
  id: string;
  name: string;
  email: string;
  plan: string;
  price: string;
  status: "active" | "expired" | "warning" | "inactive" | "banned";
  renewal: string;
  usage: number;
};

export type SystemLog = {
  time: string;
  level: "INFO" | "SUCCESS" | "WARN" | "ERROR";
  message: string;
};

export type ExtendedLog = {
  id: number;
  time: string;
  level: "INFO" | "SUCCESS" | "WARN" | "ERROR";
  service: string;
  message: string;
  user: string;
};

export type UserRow = {
  id: string;
  name: string;
  email: string;
  role: "Admin" | "User";
  status: "active" | "inactive" | "banned";
  lastLogin: string;
  joinDate: string;
};

export const MOCK_STATS: StatCard[] = [
  {
    label: "Tổng tài liệu",
    value: "12,450",
    change: "+12%",
    icon: FileText,
    color: "text-blue-600",
    bg: "bg-blue-100",
  },
  {
    label: "AI Đã xử lý",
    value: "11,200",
    change: "+18%",
    icon: Bot,
    color: "text-purple-600",
    bg: "bg-purple-100",
  },
  {
    label: "Tỉ lệ chính xác",
    value: "98.5%",
    change: "+0.5%",
    icon: CheckCircle,
    color: "text-green-600",
    bg: "bg-green-100",
  },
  {
    label: "Hàng đợi xử lý",
    value: "45",
    change: "-5%",
    icon: Clock,
    color: "text-orange-600",
    bg: "bg-orange-100",
  },
];

export const RECENT_DOCS: RecentDoc[] = [
  {
    id: "DOC-001",
    name: "Hop_dong_thue_nha_A.pdf",
    uploader: "Nguyễn Văn A",
    date: "10:30 AM",
    status: "completed",
    confidence: 99,
    type: "Hợp đồng",
  },
  {
    id: "DOC-002",
    name: "Hoa_don_GTGT_T12.jpg",
    uploader: "Trần Thị B",
    date: "10:25 AM",
    status: "processing",
    confidence: 0,
    type: "Hóa đơn",
  },
  {
    id: "DOC-003",
    name: "Bao_cao_tai_chinh_2024.pdf",
    uploader: "Lê Văn C",
    date: "09:15 AM",
    status: "failed",
    confidence: 0,
    type: "Báo cáo",
  },
  {
    id: "DOC-004",
    name: "CCCD_Mat_Truoc.png",
    uploader: "Phạm Minh D",
    date: "09:00 AM",
    status: "completed",
    confidence: 92,
    type: "Giấy tờ tùy thân",
  },
  {
    id: "DOC-005",
    name: "CV_Ung_Vien_IT.pdf",
    uploader: "HR Dept",
    date: "08:45 AM",
    status: "completed",
    confidence: 88,
    type: "CV",
  },
];

export const PRO_USERS_DATA: ProUser[] = [
  {
    id: "USR-088",
    name: "Tech Solutions Ltd.",
    email: "admin@techsol.vn",
    plan: "Enterprise Năm",
    price: "12,000,000đ",
    status: "active",
    renewal: "2025-12-01",
    usage: 85,
  },
  {
    id: "USR-092",
    name: "Nguyễn Minh Tuấn",
    email: "tuan.nm@gmail.com",
    plan: "Pro Tháng",
    price: "299,000đ",
    status: "active",
    renewal: "2024-06-15",
    usage: 42,
  },
  {
    id: "USR-105",
    name: "Công ty Luật Ánh Dương",
    email: "contact@anhduonglaw.com",
    plan: "Pro Năm",
    price: "2,990,000đ",
    status: "active",
    renewal: "2024-11-20",
    usage: 60,
  },
  {
    id: "USR-112",
    name: "Lê Thị Mai",
    email: "mai.design@freelance.net",
    plan: "Pro Tháng",
    price: "299,000đ",
    status: "expired",
    renewal: "2024-05-01",
    usage: 0,
  },
  {
    id: "USR-120",
    name: "StartUp Việt",
    email: "hello@startupviet.io",
    plan: "Enterprise Tháng",
    price: "1,200,000đ",
    status: "warning",
    renewal: "2024-05-25",
    usage: 95,
  },
];

export const SYSTEM_LOGS: SystemLog[] = [
  { time: "10:31:05", level: "INFO", message: "API Gateway: Nhận request upload từ User #2912" },
  { time: "10:30:55", level: "SUCCESS", message: "AI Worker #04: Hoàn tất trích xuất dữ liệu DOC-001" },
  { time: "10:28:12", level: "WARN", message: 'OCR Module: Độ tin cậy thấp cho vùng dữ liệu "Chữ ký"' },
  { time: "10:25:00", level: "ERROR", message: "Database: Timeout kết nối tới Replica Set 2" },
];

export const EXTENDED_LOGS: ExtendedLog[] = [
  { id: 1, time: "2024-05-20 10:31:05", level: "INFO", service: "API Gateway", message: "Nhận request upload từ User #2912 (IP: 192.168.1.45)", user: "USR-2912" },
  { id: 2, time: "2024-05-20 10:30:55", level: "SUCCESS", service: "AI Worker #04", message: "Hoàn tất trích xuất dữ liệu DOC-001. Tìm thấy 14 trường.", user: "System" },
  { id: 3, time: "2024-05-20 10:28:12", level: "WARN", service: "OCR Module", message: 'Độ tin cậy thấp (45%) cho vùng dữ liệu "Chữ ký giám đốc"', user: "USR-2912" },
  { id: 4, time: "2024-05-20 10:25:00", level: "ERROR", service: "Database", message: "Connection Timeout: Không thể kết nối tới MongoDB Replica Set 2 sau 5000ms", user: "System" },
  { id: 5, time: "2024-05-20 10:24:15", level: "INFO", service: "Auth Service", message: "User #USR-092 đăng nhập thành công.", user: "USR-092" },
  { id: 6, time: "2024-05-20 10:22:10", level: "INFO", service: "Webhook", message: "Gửi callback thành công tới endpoint khách hàng (Retry: 0)", user: "System" },
  { id: 7, time: "2024-05-20 10:15:33", level: "ERROR", service: "File Storage", message: "Không tìm thấy file tại path /uploads/2024/05/temp_882.pdf", user: "USR-105" },
  { id: 8, time: "2024-05-20 10:10:00", level: "SUCCESS", service: "Billing", message: "Gia hạn tự động thành công gói Pro cho USR-088", user: "System" },
  { id: 9, time: "2024-05-20 10:05:45", level: "WARN", service: "Rate Limiter", message: "IP 113.161.x.x đã vượt quá giới hạn request/phút (Blocked)", user: "Anonymous" },
  { id: 10, time: "2024-05-20 10:01:20", level: "INFO", service: "AI Worker #01", message: "Khởi động process xử lý batch job #9921", user: "System" },
];

export const MOCK_USERS: UserRow[] = [
  { id: "USR-001", name: "Nguyễn Văn A", email: "vana@example.com", role: "User", status: "active", lastLogin: "10 phút trước", joinDate: "2024-01-15" },
  { id: "USR-002", name: "Trần Thị Admin", email: "admin.tran@docuflow.ai", role: "Admin", status: "active", lastLogin: "Vừa xong", joinDate: "2023-11-01" },
  { id: "USR-003", name: "Lê Văn C", email: "le.vanc@agency.vn", role: "User", status: "inactive", lastLogin: "2 ngày trước", joinDate: "2024-02-20" },
  { id: "USR-004", name: "Phạm Thị D", email: "dpham@company.com", role: "User", status: "banned", lastLogin: "1 tháng trước", joinDate: "2024-03-10" },
  { id: "USR-005", name: "Hoàng Minh E", email: "emin@tech.io", role: "User", status: "active", lastLogin: "5 giờ trước", joinDate: "2024-04-05" },
];
