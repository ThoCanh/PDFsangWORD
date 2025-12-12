"use client";

import React, { useMemo, useState } from "react";
import {
  Award,
  FileText,
  FileType,
  Image as ImageIcon,
  Minus,
  Plus,
  Shield,
  ThumbsUp,
  Zap,
} from "lucide-react";

type FAQ = { question: string; answer: string };

type Props = {
  onStart: () => void;
};

function HeroIllustration() {
  return (
    <svg
      viewBox="0 0 600 450"
      className="w-full h-full drop-shadow-2xl rounded-2xl"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="bg-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4A7C7C" />
          <stop offset="100%" stopColor="#6EBDBD" />
        </linearGradient>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="6" floodOpacity="0.15" />
        </filter>
      </defs>
      <rect width="600" height="450" fill="url(#bg-grad)" />
      <circle cx="50" cy="50" r="150" fill="white" fillOpacity="0.05" />
      <circle cx="550" cy="400" r="100" fill="white" fillOpacity="0.05" />
      <g transform="translate(300, 225)">
        <line
          x1="-80"
          y1="0"
          x2="80"
          y2="0"
          stroke="white"
          strokeWidth="2"
          strokeDasharray="6 4"
          strokeOpacity="0.6"
        />
        <g transform="translate(-140, -80)">
          <rect
            x="0"
            y="0"
            width="100"
            height="140"
            rx="12"
            fill="white"
            filter="url(#shadow)"
          />
          <rect x="15" y="20" width="70" height="8" rx="4" fill="#E2E8F0" />
          <rect x="15" y="40" width="70" height="8" rx="4" fill="#E2E8F0" />
          <rect x="15" y="60" width="40" height="8" rx="4" fill="#E2E8F0" />
          <rect x="20" y="95" width="60" height="25" rx="6" fill="#FEE2E2" />
          <text
            x="50"
            y="112"
            textAnchor="middle"
            fill="#EF4444"
            fontSize="14"
            fontWeight="800"
            fontFamily="sans-serif"
          >
            PDF
          </text>
        </g>
        <g transform="translate(40, -80)">
          <rect
            x="0"
            y="0"
            width="100"
            height="140"
            rx="12"
            fill="white"
            filter="url(#shadow)"
          />
          <rect x="15" y="20" width="70" height="8" rx="4" fill="#DBEAFE" />
          <rect x="15" y="40" width="70" height="8" rx="4" fill="#DBEAFE" />
          <rect x="15" y="60" width="40" height="8" rx="4" fill="#DBEAFE" />
          <rect x="20" y="95" width="60" height="25" rx="6" fill="#DBEAFE" />
          <text
            x="50"
            y="112"
            textAnchor="middle"
            fill="#3B82F6"
            fontSize="14"
            fontWeight="800"
            fontFamily="sans-serif"
          >
            DOC
          </text>
        </g>
        <g transform="translate(0, 0)">
          <circle cx="0" cy="0" r="30" fill="white" filter="url(#shadow)" />
          <path
            d="M-5 -8 L5 0 L-5 8 M8 -8 L8 8"
            stroke="#4A7C7C"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            transform="translate(-2, 0)"
          />
        </g>
      </g>
      <circle cx="150" cy="350" r="4" fill="white" fillOpacity="0.6" />
      <circle cx="450" cy="100" r="6" fill="white" fillOpacity="0.4" />
      <circle cx="520" cy="250" r="3" fill="white" fillOpacity="0.8" />
    </svg>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  desc,
  color,
}: {
  icon: React.ElementType;
  title: string;
  desc: string;
  color: string;
}) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className={`mb-4 inline-block p-3 rounded-full bg-blue-50 ${color}`}>
        <Icon size={24} />
      </div>
      <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600 leading-relaxed">{desc}</p>
    </div>
  );
}

function FormatCard({
  title,
  desc,
  bg,
  textColor = "text-gray-900",
  descColor = "text-gray-600",
  iconColor,
  icon: Icon,
}: {
  title: string;
  desc: string;
  bg: string;
  textColor?: string;
  descColor?: string;
  iconColor: string;
  icon: React.ElementType;
}) {
  return (
    <div
      className={`${bg} p-6 rounded-xl h-full flex flex-col justify-between min-h-[180px] transition-transform hover:-translate-y-1 duration-300`}
    >
      <div className="mb-4">
        <div
          className={`w-12 h-12 flex items-center justify-center rounded-lg border-2 border-current opacity-80 ${iconColor}`}
        >
          <Icon size={28} />
        </div>
      </div>
      <div>
        <h3 className={`font-bold ${textColor} mb-1`}>{title}</h3>
        <p className={`text-xs ${descColor}`}>{desc}</p>
      </div>
    </div>
  );
}

function AccordionItem({
  question,
  answer,
  isOpen,
  onClick,
}: {
  question: string;
  answer: string;
  isOpen: boolean;
  onClick: () => void;
}) {
  return (
    <div className="mb-3">
      <button
        onClick={onClick}
        className="w-full flex items-center justify-between p-5 bg-white rounded-lg shadow-sm hover:bg-gray-50 transition-colors text-left"
      >
        <span className="font-semibold text-gray-800 text-sm md:text-base pr-4">
          {question}
        </span>
        <span className="text-gray-500 shrink-0">
          {isOpen ? <Minus size={20} /> : <Plus size={20} />}
        </span>
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="p-5 pt-2 text-gray-600 text-sm bg-white rounded-b-lg">
          {answer}
        </div>
      </div>
    </div>
  );
}

export default function AboutPage({ onStart }: Props) {
  const featuresData = useMemo(
    () => [
      {
        icon: Shield,
        color: "text-blue-600",
        title: "Bảo mật và Riêng tư",
        desc: "Tệp của bạn được mã hóa và tự động xóa sau khi chuyển đổi để đảm bảo quyền riêng tư.",
      },
      {
        icon: Zap,
        color: "text-blue-500",
        title: "Tốc độ xử lý nhanh",
        desc: "Máy chủ mạnh mẽ xử lý tệp của bạn trong vài giây, vì vậy bạn không phải chờ đợi.",
      },
      {
        icon: Award,
        color: "text-blue-600",
        title: "Chất lượng chuyển đổi cao",
        desc: "Duy trì chất lượng và định dạng gốc của tệp sau khi chuyển đổi.",
      },
      {
        icon: ThumbsUp,
        color: "text-blue-500",
        title: "Giao diện thân thiện",
        desc: "Giao diện sạch sẽ và đơn giản giúp việc chuyển đổi tệp trở nên dễ dàng.",
      },
    ],
    []
  );

  const formatsData = useMemo(
    () => [
      {
        title: "PDF sang Word",
        desc: "Chuyển đổi tài liệu PDF sang tệp Word có thể chỉnh sửa.",
        bg: "bg-[#F5E6D8]",
        iconColor: "text-gray-700",
        icon: FileText,
      },
      {
        title: "JPG sang PNG",
        desc: "Chuyển đổi hình ảnh JPG sang PNG với hỗ trợ độ trong suốt.",
        bg: "bg-[#3A7D75]",
        textColor: "text-white",
        descColor: "text-gray-200",
        iconColor: "text-white",
        icon: ImageIcon,
      },
      {
        title: "PNG sang JPG",
        desc: "Chuyển đổi hình ảnh PNG sang định dạng JPG tiêu chuẩn.",
        bg: "bg-[#F3EFE0]",
        iconColor: "text-gray-700",
        icon: ImageIcon,
      },
      {
        title: "Word sang PDF",
        desc: "Chuyển đổi tài liệu Word sang định dạng PDF phổ biến.",
        bg: "bg-[#EAE4D3]",
        iconColor: "text-gray-700",
        icon: FileType,
      },
    ],
    []
  );

  const faqsData: FAQ[] = useMemo(
    () => [
      {
        question: "Dịch vụ có miễn phí không?",
        answer: "Có, chúng tôi cung cấp dịch vụ chuyển đổi tệp cơ bản hoàn toàn miễn phí cho mọi người dùng.",
      },
      {
        question: "Tệp của tôi có được bảo mật không?",
        answer: "Tuyệt đối an toàn. Chúng tôi sử dụng mã hóa SSL và tự động xóa tệp của bạn khỏi máy chủ sau một khoảng thời gian.",
      },
      {
        question: "Thời gian chuyển đổi mất bao lâu?",
        answer: "Hầu hết các tệp được chuyển đổi trong vòng chưa đầy 1 phút, tùy thuộc vào kích thước tệp.",
      },
      {
        question: "Có giới hạn kích thước tệp không?",
        answer: "Bạn có thể giới hạn theo gói. Nâng cấp để xử lý tệp lớn hơn và nhiều lượt hơn.",
      },
    ],
    []
  );

  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-[#F9FAFB] font-sans text-gray-800">
      <main className="max-w-6xl mx-auto px-4 py-8 md:py-16 space-y-20 md:space-y-32">
        <section className="grid md:grid-cols-2 gap-10 items-center">
          <div className="space-y-6 order-2 md:order-1">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-[1.15]">
              Chuyển Đổi Tệp <br className="hidden md:block" />
              Đơn Giản và <br className="hidden md:block" />
              Hiệu Quả
            </h1>
            <p className="text-gray-600 text-base md:text-lg max-w-md leading-relaxed">
              Dễ dàng chuyển đổi các tệp của bạn giữa các định dạng khác nhau chỉ
              với vài cú nhấp chuột. An toàn, nhanh chóng và chất lượng cao.
            </p>
            <div className="pt-2">
              <button
                onClick={onStart}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-bold shadow-lg shadow-blue-600/30 transition-all transform hover:scale-105 active:scale-95 w-full md:w-auto"
              >
                Bắt đầu chuyển đổi
              </button>
            </div>
          </div>
          <div className="order-1 md:order-2 w-full aspect-[4/3] relative group">
            <HeroIllustration />
            <div className="absolute -inset-4 bg-teal-500/20 blur-3xl rounded-full -z-10 opacity-70 group-hover:opacity-100 transition-opacity duration-500" />
          </div>
        </section>

        <section>
          <div className="mb-10 md:mb-14">
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-3">
              Tại sao chọn chúng tôi?
            </h2>
            <p className="text-gray-500 max-w-2xl">
              Khám phá những lợi ích chính khi sử dụng công cụ chuyển đổi tệp.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuresData.map((feature, idx) => (
              <FeatureCard key={idx} {...feature} />
            ))}
          </div>
        </section>

        <section>
          <div className="mb-10">
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-3">
              Các định dạng được hỗ trợ
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {formatsData.map((format, idx) => (
              <FormatCard key={idx} {...format} />
            ))}
          </div>
        </section>

        <section className="max-w-3xl mx-auto w-full">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900">
              Câu hỏi thường gặp
            </h2>
          </div>
          <div className="space-y-2">
            {faqsData.map((faq, idx) => (
              <AccordionItem
                key={idx}
                question={faq.question}
                answer={faq.answer}
                isOpen={openFaqIndex === idx}
                onClick={() =>
                  setOpenFaqIndex((v) => (v === idx ? null : idx))
                }
              />
            ))}
          </div>
        </section>
      </main>

      <footer className="bg-white border-t mt-20 py-10 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center text-sm text-gray-500 gap-4">
          <p>© 2024 DocuFlowAI.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-gray-900">
              Chính sách bảo mật
            </a>
            <a href="#" className="hover:text-gray-900">
              Điều khoản dịch vụ
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
