using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Quan_ly_nhan_su.Application.Interfaces;
using Quan_ly_nhan_su.Domain.Entities;

namespace Quan_ly_nhan_su.Infrastructure.Persistence
{
    public class ApplicationDbContext : DbContext
    {
        private readonly ICurrentUserService _currentUserService;

        public ApplicationDbContext(
            DbContextOptions<ApplicationDbContext> options,
            ICurrentUserService currentUserService) : base(options)
        {
            _currentUserService = currentUserService;
        }

        public DbSet<Employee> Employees => Set<Employee>();
        public DbSet<Department> Departments => Set<Department>();
        public DbSet<Position> Positions => Set<Position>();
        public DbSet<Attendance> Attendances => Set<Attendance>();
        public DbSet<LeaveRequest> LeaveRequests => Set<LeaveRequest>();
        public DbSet<WeeklyWorkPlan> WeeklyWorkPlans => Set<WeeklyWorkPlan>();
        public DbSet<WorkPlanItem> WorkPlanItems => Set<WorkPlanItem>();
        public DbSet<DailyReport> DailyReports => Set<DailyReport>();
        public DbSet<WeeklyReport> WeeklyReports => Set<WeeklyReport>();
        public DbSet<ReportAttachment> ReportAttachments => Set<ReportAttachment>();
        public DbSet<Lead> Leads => Set<Lead>();
        public DbSet<LeadActivityLog> LeadActivityLogs => Set<LeadActivityLog>();
        public DbSet<Kpi> Kpis => Set<Kpi>();
        public DbSet<Notification> Notifications => Set<Notification>();
        public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
        
        public DbSet<Student> Students => Set<Student>();
        public DbSet<Class> Classes => Set<Class>();
        public DbSet<ClassSchedule> ClassSchedules => Set<ClassSchedule>();
        public DbSet<Enrollment> Enrollments => Set<Enrollment>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure Guid Primary Keys
            modelBuilder.Entity<Employee>().HasKey(e => e.Id);
            modelBuilder.Entity<Department>().HasKey(d => d.Id);
            modelBuilder.Entity<Position>().HasKey(p => p.Id);
            modelBuilder.Entity<Attendance>().HasKey(a => a.Id);
            modelBuilder.Entity<LeaveRequest>().HasKey(l => l.Id);
            modelBuilder.Entity<WeeklyWorkPlan>().HasKey(w => w.Id);
            modelBuilder.Entity<WorkPlanItem>().HasKey(wi => wi.Id);
            modelBuilder.Entity<DailyReport>().HasKey(dr => dr.Id);
            modelBuilder.Entity<WeeklyReport>().HasKey(wr => wr.Id);
            modelBuilder.Entity<ReportAttachment>().HasKey(ra => ra.Id);
            modelBuilder.Entity<Lead>().HasKey(l => l.Id);
            modelBuilder.Entity<LeadActivityLog>().HasKey(lal => lal.Id);
            modelBuilder.Entity<Kpi>().HasKey(k => k.Id);
            modelBuilder.Entity<Notification>().HasKey(n => n.Id);
            modelBuilder.Entity<AuditLog>().HasKey(al => al.Id);

            // Configure Relationships
            modelBuilder.Entity<Employee>()
                .HasOne(e => e.Department)
                .WithMany(d => d.Employees)
                .HasForeignKey(e => e.DepartmentId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<Employee>()
                .HasOne(e => e.Position)
                .WithMany(p => p.Employees)
                .HasForeignKey(e => e.PositionId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<Department>()
                .HasOne(d => d.Manager)
                .WithMany()
                .HasForeignKey(d => d.ManagerId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<LeaveRequest>()
                .HasOne(l => l.Employee)
                .WithMany(e => e.LeaveRequests)
                .HasForeignKey(l => l.EmployeeId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<LeaveRequest>()
                .HasOne(l => l.ApprovedBy)
                .WithMany()
                .HasForeignKey(l => l.ApprovedById)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Attendance>()
                .HasOne(a => a.Employee)
                .WithMany(e => e.Attendances)
                .HasForeignKey(a => a.EmployeeId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<WeeklyWorkPlan>()
                .HasOne(w => w.Employee)
                .WithMany(e => e.WeeklyWorkPlans)
                .HasForeignKey(w => w.EmployeeId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<WorkPlanItem>()
                .HasOne(wi => wi.WeeklyWorkPlan)
                .WithMany(w => w.WorkPlanItems)
                .HasForeignKey(wi => wi.WeeklyWorkPlanId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<WorkPlanItem>()
                .HasOne(wi => wi.Supporter)
                .WithMany()
                .HasForeignKey(wi => wi.SupporterId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<DailyReport>()
                .HasOne(dr => dr.Employee)
                .WithMany(e => e.DailyReports)
                .HasForeignKey(dr => dr.EmployeeId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<WeeklyReport>()
                .HasOne(wr => wr.Employee)
                .WithMany(e => e.WeeklyReports)
                .HasForeignKey(wr => wr.EmployeeId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<ReportAttachment>()
                .HasOne(ra => ra.DailyReport)
                .WithMany(dr => dr.Attachments)
                .HasForeignKey(ra => ra.DailyReportId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<ReportAttachment>()
                .HasOne(ra => ra.WeeklyReport)
                .WithMany(wr => wr.Attachments)
                .HasForeignKey(ra => ra.WeeklyReportId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Lead>()
                .HasOne(l => l.Owner)
                .WithMany(e => e.ManagedLeads)
                .HasForeignKey(l => l.OwnerId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<LeadActivityLog>()
                .HasOne(lal => lal.Lead)
                .WithMany(l => l.ActivityLogs)
                .HasForeignKey(lal => lal.LeadId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<LeadActivityLog>()
                .HasOne(lal => lal.Employee)
                .WithMany(e => e.LeadActivityLogs)
                .HasForeignKey(lal => lal.EmployeeId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Kpi>()
                .HasOne(k => k.Employee)
                .WithMany(e => e.Kpis)
                .HasForeignKey(k => k.EmployeeId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Notification>()
                .HasOne(n => n.Recipient)
                .WithMany()
                .HasForeignKey(n => n.RecipientId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<AuditLog>()
                .HasOne(al => al.Employee)
                .WithMany()
                .HasForeignKey(al => al.EmployeeId)
                .OnDelete(DeleteBehavior.SetNull);

            // Class Management Configurations
            modelBuilder.Entity<Student>().HasKey(s => s.Id);
            modelBuilder.Entity<Class>().HasKey(c => c.Id);
            modelBuilder.Entity<ClassSchedule>().HasKey(cs => cs.Id);
            modelBuilder.Entity<Enrollment>().HasKey(e => e.Id);

            modelBuilder.Entity<Class>()
                .HasOne(c => c.Instructor)
                .WithMany()
                .HasForeignKey(c => c.InstructorId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<ClassSchedule>()
                .HasOne(cs => cs.Class)
                .WithMany(c => c.Schedules)
                .HasForeignKey(cs => cs.ClassId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Enrollment>()
                .HasOne(e => e.Student)
                .WithMany(s => s.Enrollments)
                .HasForeignKey(e => e.StudentId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Enrollment>()
                .HasOne(e => e.Class)
                .WithMany(c => c.Enrollments)
                .HasForeignKey(e => e.ClassId)
                .OnDelete(DeleteBehavior.Cascade);
        }

        public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            var auditEntries = OnBeforeSaveChanges();
            var result = await base.SaveChangesAsync(cancellationToken);
            await OnAfterSaveChanges(auditEntries);
            return result;
        }

        private List<AuditEntry> OnBeforeSaveChanges()
        {
            ChangeTracker.DetectChanges();
            var auditEntries = new List<AuditEntry>();
            var userId = _currentUserService.UserId;

            foreach (var entry in ChangeTracker.Entries())
            {
                if (entry.Entity is AuditLog || entry.State == EntityState.Detached || entry.State == EntityState.Unchanged)
                    continue;

                var auditEntry = new AuditEntry(entry)
                {
                    TableName = entry.Entity.GetType().Name,
                    EmployeeId = userId
                };
                auditEntries.Add(auditEntry);

                foreach (var property in entry.Properties)
                {
                    string propertyName = property.Metadata.Name;
                    if (property.Metadata.IsPrimaryKey())
                    {
                        auditEntry.KeyValues[propertyName] = property.CurrentValue ?? string.Empty;
                        continue;
                    }

                    switch (entry.State)
                    {
                        case EntityState.Added:
                            auditEntry.NewValues[propertyName] = property.CurrentValue ?? string.Empty;
                            break;
                        case EntityState.Deleted:
                            auditEntry.OldValues[propertyName] = property.OriginalValue ?? string.Empty;
                            break;
                        case EntityState.Modified:
                            if (property.IsModified)
                            {
                                auditEntry.OldValues[propertyName] = property.OriginalValue ?? string.Empty;
                                auditEntry.NewValues[propertyName] = property.CurrentValue ?? string.Empty;
                            }
                            break;
                    }
                }
            }

            // Return pre-saved entries (with assigned temp/real Guid IDs)
            return auditEntries;
        }

        private Task OnAfterSaveChanges(List<AuditEntry> auditEntries)
        {
            if (auditEntries == null || auditEntries.Count == 0)
                return Task.CompletedTask;

            foreach (var auditEntry in auditEntries)
            {
                var auditLog = new AuditLog
                {
                    Id = Guid.NewGuid(),
                    EmployeeId = auditEntry.EmployeeId,
                    Action = auditEntry.Action,
                    TableName = auditEntry.TableName,
                    RecordId = JsonSerializer.Serialize(auditEntry.KeyValues),
                    OldValues = auditEntry.OldValues.Count == 0 ? null : JsonSerializer.Serialize(auditEntry.OldValues),
                    NewValues = auditEntry.NewValues.Count == 0 ? null : JsonSerializer.Serialize(auditEntry.NewValues),
                    Timestamp = DateTime.UtcNow
                };

                AuditLogs.Add(auditLog);
            }

            return base.SaveChangesAsync();
        }
    }

    internal class AuditEntry
    {
        public AuditEntry(EntityEntry entry)
        {
            Entry = entry;
            Action = entry.State switch
            {
                EntityState.Added => "Create",
                EntityState.Deleted => "Delete",
                EntityState.Modified => "Update",
                _ => string.Empty
            };
        }

        public EntityEntry Entry { get; }
        public string Action { get; set; }
        public string TableName { get; set; } = string.Empty;
        public Guid? EmployeeId { get; set; }
        public Dictionary<string, object> KeyValues { get; } = new();
        public Dictionary<string, object> OldValues { get; } = new();
        public Dictionary<string, object> NewValues { get; } = new();
    }
}
