import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const MilestoneSection = () => {
  const [expandedIndex, setExpandedIndex] = useState(null);

  const toggleItem = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const items = [
    {
      title: "5 Giá trị cốt lõi",
      content: [
        "1. Chuyên môn hàng đầu: Chúng tôi tự hào vì 100% bác sĩ tại Nha Khoa Việt Hàn đều là những chuyên gia chính quy chuyên khoa Răng Hàm Mặt. Điều này đảm bảo rằng mỗi dịch vụ chúng tôi cung cấp đều đạt tiêu chuẩn y tế cao nhất, mang lại sự an tâm cho khách hàng.",
        "2. Sức khỏe bệnh nhân là ưu tiên tuyệt đối: Chúng tôi luôn đặt sức khỏe và sự an toàn của bệnh nhân lên hàng đầu. Mọi quyết định, mọi hành động đều hướng tới việc mang lại giải pháp điều trị tốt nhất cho khách hàng.",
        "3. Tận tâm và trung thực: Chúng tôi cam kết phục vụ khách hàng với sự chân thành, minh bạch. Chăm sóc khách hàng như chính người thân trong gia đình mình.",
        "4. Luôn đổi mới và phát triển: Chúng tôi không ngừng học hỏi, cải tiến trang thiết bị và công nghệ. Nâng cao năng lực bản thân để đáp ứng nhu cầu ngày càng cao của khách hàng và thị trường.",
        "5. Đề cao trách nhiệm xã hội: Chúng tôi tự hào khi được đóng góp tích cực vào cộng đồng và xã hội. Bằng việc thực hiện các hoạt động thiện nguyện, chia sẻ yêu thương với những hoàn cảnh khó khăn.",
      ],
      icon: "+",
    },
    {
      title: "Đội ngũ nhân sự",
      content: "Tại DentistEZ, đội ngũ bác sĩ đều tốt nghiệp chính quy ngành Răng Hàm Mặt từ các trường đại học y hàng đầu tại Việt Nam như Đại học Y Dược TP. Hồ Chí Minh, Đại học Y Dược Hà Nội, và Đại học Y Dược Huế. Với nhiều năm kinh nghiệm trong nghề và không ngừng học hỏi để nâng cao chuyên môn, các bác sĩ tại DentistEZ luôn tận tâm trong từng ca điều trị, đề cao y đức và trách nhiệm với bệnh nhân. Nhờ vậy, phòng khám nhận được sự tin tưởng và yêu mến từ đông đảo khách hàng tại Nha Trang, Khánh Hòa cũng như khách hàng quốc tế.",
      icon: "+",
    },
    {
      title: "Nỗ lực vì cộng đồng",
      content: "Thường xuyên tổ chức khám, tư vấn và chăm sóc răng miệng miễn phí cho người dân.",
      icon: "+",
    },
  ];

  return (
    <section className="container-fluid py-5 bg-light">
      <div className="row align-items-center justify-content-between">
        {/* Left: Content */}
        <div className="col-md-6 mb-4 mb-md-0 px-4">
          <h2 className="text-primary font-weight-bold text-uppercase mb-2" style={{ fontSize: '1.25rem', letterSpacing: '0.1em' }}>
            DentistEZ
          </h2>
          <h1 className="text-primary font-weight-bold mb-4" style={{ fontSize: '2.5rem', lineHeight: '1.2' }}>
            5 Năm - Một chặng đường
          </h1>
          <div className="accordion">
            {items.map((item, index) => (
              <div key={index} className="card mb-3 shadow-sm">
                <button
                  className="card-header btn d-flex justify-content-between align-items-center text-left bg-white border-0"
                  onClick={() => toggleItem(index)}
                  style={{ transition: 'background-color 0.3s ease' }}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#e9ecef')}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#fff')}
                >
                  <span className="text-primary font-weight-bold" style={{ fontSize: '1.1rem' }}>{item.title}</span>
                  <span
                    className="text-white rounded-circle d-flex align-items-center justify-content-center"
                    style={{
                      width: '2.5rem',
                      height: '2.5rem',
                      background: 'linear-gradient(135deg, #007bff, #0056b3)',
                      fontSize: '1.5rem',
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                    }}
                  >
                    {expandedIndex === index ? "-" : "+"}
                  </span>
                </button>
                <AnimatePresence initial={false}>
                  {expandedIndex === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="card-body">
                        {Array.isArray(item.content) ? (
                          item.content.map((value, idx) => (
                            <p key={idx} className="text-muted mb-2" style={{ fontSize: '0.9rem', lineHeight: '1.6' }}>
                              {value}
                            </p>
                          ))
                        ) : (
                          <p className="text-muted" style={{ fontSize: '0.9rem', lineHeight: '1.6' }}>{item.content}</p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Image (Commented Out) */}
        <div className="col-md-6 px-4">
          <img
            src="/images/homepage3.jpg"
            alt="Nha sĩ đang làm việc"
            className="img-fluid rounded shadow-lg"
            style={{ transition: 'transform 0.3s ease' }}
            onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
            onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          />
        </div>
      </div>
    </section>
  );
};

export default MilestoneSection;