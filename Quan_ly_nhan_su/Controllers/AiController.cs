using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Quan_ly_nhan_su.Application.Interfaces;
using Quan_ly_nhan_su.Domain.Entities;
using Quan_ly_nhan_su.Domain.Enums;

namespace Quan_ly_nhan_su.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/ai")]
    public class AiController : ControllerBase
    {
        private readonly IUnitOfWork _unitOfWork;

        public AiController(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        private Guid CurrentUserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        [HttpGet("assistant/daily-brief")]
        public async Task<IActionResult> GetDailyBrief()
        {
            var now = DateTime.UtcNow;
            
            // Lấy Leads
            var leads = await _unitOfWork.Repository<Lead>().Query(l => l.OwnerId == CurrentUserId).ToListAsync();
            var newLeads = leads.Count(l => l.Status == LeadStatus.New);
            var consultingLeads = leads.Count(l => l.Status == LeadStatus.Consulting);
            
            // Lấy KPIs hôm nay
            var kpis = await _unitOfWork.Repository<Kpi>().Query(k => k.EmployeeId == CurrentUserId && k.StartDate <= now && k.EndDate >= now).ToListAsync();
            
            // Lấy Tasks chưa xong
            var tasks = await _unitOfWork.Repository<WorkPlanItem>().Query(t => (t.SupporterId == CurrentUserId || t.WeeklyWorkPlan!.EmployeeId == CurrentUserId) && t.Status != WorkItemStatus.Completed).Include(t => t.WeeklyWorkPlan).ToListAsync();
            var overdueTasks = tasks.Count(t => t.Deadline < now);

            // Sinh thông điệp giống AI (Mô phỏng AI / Mock AI)
            string message = "👋 Chào bạn! Dưới đây là phân tích của AI Assistant cho công việc hôm nay:\n\n";

            if (newLeads > 0)
            {
                message += $"📞 Bạn đang có **{newLeads} khách hàng mới** chưa được liên hệ. Hãy ưu tiên gọi cho họ để tăng tỷ lệ chuyển đổi nhé.\n";
            }
            if (consultingLeads > 0)
            {
                message += $"💬 Có **{consultingLeads} khách hàng đang tư vấn**. Đừng quên gửi tin nhắn chăm sóc họ hôm nay!\n";
            }
            
            if (overdueTasks > 0)
            {
                message += $"⚠️ Cảnh báo: Bạn đang có **{overdueTasks} công việc đã quá hạn**. Hãy hoàn thành sớm.\n";
            }
            else if (tasks.Count > 0)
            {
                message += $"📝 Hôm nay bạn có **{tasks.Count} công việc** cần xử lý.\n";
            }

            foreach (var kpi in kpis)
            {
                if (kpi.CurrentValue < kpi.TargetValue)
                {
                    double remaining = kpi.TargetValue - kpi.CurrentValue;
                    message += $"🎯 Bạn còn thiếu **{remaining} {kpi.Unit}** để đạt chỉ tiêu '{kpi.TargetName}'. Cố lên!\n";
                }
                else
                {
                    message += $"🏆 Chúc mừng! Bạn đã hoàn thành chỉ tiêu '{kpi.TargetName}'.\n";
                }
            }

            if (newLeads == 0 && overdueTasks == 0 && tasks.Count == 0)
            {
                message += "✨ Hiện tại mọi thứ đều ổn định, không có công việc nào bị tồn đọng!";
            }

            return Ok(new { message = message });
        }
    }
}
