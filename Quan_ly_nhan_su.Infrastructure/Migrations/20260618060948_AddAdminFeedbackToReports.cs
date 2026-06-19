using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Quan_ly_nhan_su.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddAdminFeedbackToReports : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AdminFeedback",
                table: "WeeklyReports",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FailureReasonAnalysis",
                table: "WeeklyReports",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AdminFeedback",
                table: "DailyReports",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AdminFeedback",
                table: "WeeklyReports");

            migrationBuilder.DropColumn(
                name: "FailureReasonAnalysis",
                table: "WeeklyReports");

            migrationBuilder.DropColumn(
                name: "AdminFeedback",
                table: "DailyReports");
        }
    }
}
