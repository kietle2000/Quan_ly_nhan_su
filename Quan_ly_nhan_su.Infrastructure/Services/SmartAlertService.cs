using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Quan_ly_nhan_su.Domain.Entities;
using Quan_ly_nhan_su.Domain.Enums;
using Quan_ly_nhan_su.Infrastructure.Persistence;

namespace Quan_ly_nhan_su.Infrastructure.Services
{
    public class SmartAlertService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<SmartAlertService> _logger;

        public SmartAlertService(IServiceProvider serviceProvider, ILogger<SmartAlertService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Smart Alert Background Service is starting.");

            // Loop forever until stopped
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await CheckOverdueLeadsAsync(stoppingToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error occurred executing Smart Alert check.");
                }

                // Chờ 1 giờ rồi quét lại (hoặc chỉnh lại theo nhu cầu thực tế)
                await Task.Delay(TimeSpan.FromHours(1), stoppingToken);
            }
        }

        private async Task CheckOverdueLeadsAsync(CancellationToken stoppingToken)
        {
            using var scope = _serviceProvider.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

            var threeDaysAgo = DateTime.UtcNow.AddDays(-3);

            // Tìm các Lead đã nhận quá 3 ngày nhưng vẫn ở trạng thái New (chưa liên hệ)
            // Hoặc có ActivityLogs nhưng log cuối cùng đã quá 3 ngày
            var overdueLeads = await dbContext.Leads
                .Include(l => l.ActivityLogs)
                .Where(l => l.Status != LeadStatus.Signed && l.Status != LeadStatus.Lost)
                .Where(l => l.OwnerId != null)
                .ToListAsync(stoppingToken);

            foreach (var lead in overdueLeads)
            {
                // Kiểm tra log cuối cùng
                var lastActivity = lead.ActivityLogs.OrderByDescending(al => al.ActivityDate).FirstOrDefault();
                
                bool needsAlert = false;
                if (lastActivity == null)
                {
                    // Nếu chưa có activity nào và thời gian tạo quá 3 ngày
                    if (lead.CreatedAt < threeDaysAgo) needsAlert = true;
                }
                else
                {
                    if (lastActivity.ActivityDate < threeDaysAgo) needsAlert = true;
                }

                if (needsAlert && lead.OwnerId.HasValue)
                {
                    // Kiểm tra xem đã bắn thông báo hôm nay chưa để tránh spam
                    var alreadyNotified = await dbContext.Notifications
                        .AnyAsync(n => n.RecipientId == lead.OwnerId.Value 
                                    && n.Title.Contains("Khách hàng cần chăm sóc")
                                    && n.Content.Contains(lead.Name)
                                    && n.CreatedAt >= DateTime.UtcNow.Date, stoppingToken);

                    if (!alreadyNotified)
                    {
                        var notification = new Notification
                        {
                            Id = Guid.NewGuid(),
                            RecipientId = lead.OwnerId.Value,
                            Title = "Khách hàng cần chăm sóc!",
                            Content = $"Khách hàng '{lead.Name}' đã quá 3 ngày chưa được liên lạc. Hãy gọi cho họ ngay nhé!",
                            IsRead = false,
                            CreatedAt = DateTime.UtcNow,
                            Link = $"/dashboard/crm?leadId={lead.Id}"
                        };
                        dbContext.Notifications.Add(notification);
                        _logger.LogInformation($"Created alert for Lead {lead.Id} - Owner {lead.OwnerId}");
                    }
                }
            }

            await dbContext.SaveChangesAsync(stoppingToken);
        }
    }
}
