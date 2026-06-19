using System;
using System.Collections.Generic;
using Quan_ly_nhan_su.Domain.Enums;

namespace Quan_ly_nhan_su.Domain.Entities
{
    public class Lead
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string? FacebookUrl { get; set; }
        
        // Nguồn khách hàng: Facebook, Website, Giới thiệu, v.v.
        public string Source { get; set; } = string.Empty; 
        
        public Guid? OwnerId { get; set; } // Nhân viên phụ trách
        public Employee? Owner { get; set; }

        public LeadStatus Status { get; set; } = LeadStatus.New;

        public decimal? Revenue { get; set; }
        public string? ContractFile { get; set; }
        public string? FailureReason { get; set; }
        public string? Notes { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        // Mốc thời gian Phễu Khách hàng
        public DateTime? NewAt { get; set; }
        public DateTime? ContactedAt { get; set; }
        public DateTime? ConsultingAt { get; set; }
        public DateTime? MeetingAt { get; set; }
        public DateTime? SignedAt { get; set; }

        public ICollection<LeadActivityLog> ActivityLogs { get; set; } = new List<LeadActivityLog>();
    }
}
