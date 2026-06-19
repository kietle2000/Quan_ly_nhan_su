using System;
using System.Collections.Generic;

namespace Quan_ly_nhan_su.Application.DTOs
{
    public class LeadDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string? FacebookUrl { get; set; }
        public string Source { get; set; } = string.Empty;
        public Guid? OwnerId { get; set; }
        public string? OwnerName { get; set; }
        public string Status { get; set; } = string.Empty; // New, Contacted, Consulting, Signed, Lost
        public decimal? Revenue { get; set; }
        public string? ContractFile { get; set; }
        public string? FailureReason { get; set; }
        public string? Notes { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }

        public DateTime? NewAt { get; set; }
        public DateTime? ContactedAt { get; set; }
        public DateTime? ConsultingAt { get; set; }
        public DateTime? MeetingAt { get; set; }
        public DateTime? SignedAt { get; set; }
        public List<LeadActivityLogDto> ActivityLogs { get; set; } = new();
    }

    public class CreateLeadDto
    {
        public string Name { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string? FacebookUrl { get; set; }
        public string Source { get; set; } = string.Empty;
        public Guid? OwnerId { get; set; }
        public string? Notes { get; set; }
    }

    public class UpdateLeadDto
    {
        public string Name { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string? FacebookUrl { get; set; }
        public string Source { get; set; } = string.Empty;
        public Guid? OwnerId { get; set; }
        public string Status { get; set; } = string.Empty;
        public decimal? Revenue { get; set; }
        public string? ContractFile { get; set; }
        public string? FailureReason { get; set; }
        public string? Notes { get; set; }

        public DateTime? NewAt { get; set; }
        public DateTime? ContactedAt { get; set; }
        public DateTime? ConsultingAt { get; set; }
        public DateTime? MeetingAt { get; set; }
        public DateTime? SignedAt { get; set; }
    }

    public class LeadActivityLogDto
    {
        public Guid Id { get; set; }
        public Guid LeadId { get; set; }
        public Guid EmployeeId { get; set; }
        public string EmployeeName { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public DateTime ActivityDate { get; set; }
        public DateTime? NextFollowUpDate { get; set; }
    }

    public class CreateLeadActivityLogDto
    {
        public string Content { get; set; } = string.Empty;
        public DateTime? NextFollowUpDate { get; set; }
    }

    public class KpiDto
    {
        public Guid Id { get; set; }
        public Guid EmployeeId { get; set; }
        public string EmployeeName { get; set; } = string.Empty;
        public string TargetName { get; set; } = string.Empty;
        public double TargetValue { get; set; }
        public double CurrentValue { get; set; }
        public string Unit { get; set; } = string.Empty;
        public string Period { get; set; } = string.Empty; // Weekly, Monthly, Yearly
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public string Status { get; set; } = string.Empty; // InProgress, Achieved, Failed
    }

    public class CreateKpiDto
    {
        public Guid EmployeeId { get; set; }
        public string TargetName { get; set; } = string.Empty;
        public double TargetValue { get; set; }
        public string Unit { get; set; } = "VNĐ";
        public string Period { get; set; } = "Monthly"; // Weekly, Monthly, Yearly
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
    }

    public class UpdateKpiValueDto
    {
        public double CurrentValue { get; set; }
    }

    public class ImportLeadItemDto
    {
        public string Name { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string? FacebookUrl { get; set; }
        public string Source { get; set; } = string.Empty;
        public string? Notes { get; set; }
    }

    public class ImportLeadsRequestDto
    {
        public List<ImportLeadItemDto> Leads { get; set; } = new();
        public List<Guid> EmployeeIds { get; set; } = new();
    }
}
