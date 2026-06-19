using System;

namespace Quan_ly_nhan_su.Domain.Entities
{
    public class ReportAttachment
    {
        public Guid Id { get; set; }
        
        public Guid? DailyReportId { get; set; }
        public DailyReport? DailyReport { get; set; }

        public Guid? WeeklyReportId { get; set; }
        public WeeklyReport? WeeklyReport { get; set; }

        public string FileName { get; set; } = string.Empty;
        public string FilePath { get; set; } = string.Empty;
        public string FileType { get; set; } = string.Empty; // e.g., image/png, application/pdf
        public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
    }
}
