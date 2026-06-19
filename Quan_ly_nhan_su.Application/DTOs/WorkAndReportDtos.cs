using System;
using System.Collections.Generic;

namespace Quan_ly_nhan_su.Application.DTOs
{
    public class WeeklyWorkPlanDto
    {
        public Guid Id { get; set; }
        public Guid EmployeeId { get; set; }
        public string EmployeeName { get; set; } = string.Empty;
        public int WeekNumber { get; set; }
        public int Year { get; set; }
        public string Target { get; set; } = string.Empty;
        public string? Notes { get; set; }
        
        // Funnel targets
        public int TargetNew { get; set; }
        public int TargetContacted { get; set; }
        public int TargetConsulting { get; set; }
        public int TargetMeeting { get; set; }
        public int TargetSigned { get; set; }

        // Funnel actuals (Calculated automatically)
        public int ActualNew { get; set; }
        public int ActualContacted { get; set; }
        public int ActualConsulting { get; set; }
        public int ActualMeeting { get; set; }
        public int ActualSigned { get; set; }

        // Funnel evaluations
        public string? EvalNew { get; set; }
        public string? EvalContacted { get; set; }
        public string? EvalConsulting { get; set; }
        public string? EvalMeeting { get; set; }
        public string? EvalSigned { get; set; }

        public string? FailureReasonAnalysis { get; set; }
        public string? AdminFeedback { get; set; }

        public DateTime CreatedAt { get; set; }
        public List<WorkPlanItemDto> WorkPlanItems { get; set; } = new();
    }

    public class CreateWeeklyWorkPlanDto
    {
        public Guid? EmployeeId { get; set; }
        public int WeekNumber { get; set; }
        public int Year { get; set; }
        public string Target { get; set; } = string.Empty;
        public string? Notes { get; set; }
        
        public int TargetNew { get; set; }
        public int TargetContacted { get; set; }
        public int TargetConsulting { get; set; }
        public int TargetMeeting { get; set; }
        public int TargetSigned { get; set; }

        public string? EvalNew { get; set; }
        public string? EvalContacted { get; set; }
        public string? EvalConsulting { get; set; }
        public string? EvalMeeting { get; set; }
        public string? EvalSigned { get; set; }

        public string? FailureReasonAnalysis { get; set; }

        public List<CreateWorkPlanItemDto> WorkPlanItems { get; set; } = new();
    }

    public class WorkPlanItemDto
    {
        public Guid Id { get; set; }
        public Guid WeeklyWorkPlanId { get; set; }
        public string TaskName { get; set; } = string.Empty;
        public string ActionPlan { get; set; } = string.Empty;
        public Guid? SupporterId { get; set; }
        public string? SupporterName { get; set; }
        public DateTime Deadline { get; set; }
        public string Kpi { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty; // Pending, InProgress, Completed, Cancelled
        public string? Notes { get; set; }
    }

    public class CreateWorkPlanItemDto
    {
        public string TaskName { get; set; } = string.Empty;
        public string ActionPlan { get; set; } = string.Empty;
        public Guid? SupporterId { get; set; }
        public DateTime Deadline { get; set; }
        public string Kpi { get; set; } = string.Empty;
        public string? Notes { get; set; }
    }

    public class UpdateWorkPlanItemDto
    {
        public string TaskName { get; set; } = string.Empty;
        public string ActionPlan { get; set; } = string.Empty;
        public Guid? SupporterId { get; set; }
        public DateTime Deadline { get; set; }
        public string Kpi { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string? Notes { get; set; }
    }

    public class DailyReportDto
    {
        public Guid Id { get; set; }
        public Guid EmployeeId { get; set; }
        public string EmployeeName { get; set; } = string.Empty;
        public DateTime Date { get; set; }
        public string Content { get; set; } = string.Empty;
        public double ProgressPercentage { get; set; }

        public int TargetNew { get; set; }
        public int TargetContacted { get; set; }
        public int TargetConsulting { get; set; }
        public int TargetMeeting { get; set; }
        public int TargetSigned { get; set; }

        public int ActualNew { get; set; }
        public int ActualContacted { get; set; }
        public int ActualConsulting { get; set; }
        public int ActualMeeting { get; set; }
        public int ActualSigned { get; set; }

        public string? EvalNew { get; set; }
        public string? EvalContacted { get; set; }
        public string? EvalConsulting { get; set; }
        public string? EvalMeeting { get; set; }
        public string? EvalSigned { get; set; }

        public string? FailureReasonAnalysis { get; set; }
        public string? AdminFeedback { get; set; }

        public DateTime CreatedAt { get; set; }
        public List<ReportAttachmentDto> Attachments { get; set; } = new();
    }

    public class CreateDailyReportDto
    {
        public DateTime Date { get; set; }
        public string Content { get; set; } = string.Empty;
        public double ProgressPercentage { get; set; }

        public int TargetNew { get; set; }
        public int TargetContacted { get; set; }
        public int TargetConsulting { get; set; }
        public int TargetMeeting { get; set; }
        public int TargetSigned { get; set; }

        public string? EvalNew { get; set; }
        public string? EvalContacted { get; set; }
        public string? EvalConsulting { get; set; }
        public string? EvalMeeting { get; set; }
        public string? EvalSigned { get; set; }

        public string? FailureReasonAnalysis { get; set; }
    }

    public class WeeklyReportDto
    {
        public Guid Id { get; set; }
        public Guid EmployeeId { get; set; }
        public string EmployeeName { get; set; } = string.Empty;
        public int WeekNumber { get; set; }
        public int Year { get; set; }
        public string Content { get; set; } = string.Empty;
        public string NextWeekPlan { get; set; } = string.Empty;
        public string? AdminFeedback { get; set; }
        public DateTime CreatedAt { get; set; }
        public List<ReportAttachmentDto> Attachments { get; set; } = new();
    }

    public class CreateWeeklyReportDto
    {
        public int WeekNumber { get; set; }
        public int Year { get; set; }
        public string Content { get; set; } = string.Empty;
        public string NextWeekPlan { get; set; } = string.Empty;
    }

    public class ReportAttachmentDto
    {
        public Guid Id { get; set; }
        public string FileName { get; set; } = string.Empty;
        public string FilePath { get; set; } = string.Empty;
        public string FileType { get; set; } = string.Empty;
        public DateTime UploadedAt { get; set; }
    }

    public class FeedbackDto
    {
        public string Feedback { get; set; } = string.Empty;
    }
}
