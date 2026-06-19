namespace Quan_ly_nhan_su.Domain.Enums
{
    public enum LeadStatus
    {
        New = 1,          // Mới nhận
        Contacted = 2,    // Đã liên hệ
        Consulting = 3,   // Đang tư vấn
        Signed = 4,       // Đã ký hợp đồng
        Lost = 5,         // Thất bại
        Meeting = 6       // Hẹn gặp / Lên văn phòng
    }
}
