using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Quan_ly_nhan_su.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddWeeklyFunnelReport_ERP : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "EvalConsulting",
                table: "WeeklyWorkPlans",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EvalContacted",
                table: "WeeklyWorkPlans",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EvalMeeting",
                table: "WeeklyWorkPlans",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EvalNew",
                table: "WeeklyWorkPlans",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EvalSigned",
                table: "WeeklyWorkPlans",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FailureReasonAnalysis",
                table: "WeeklyWorkPlans",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "TargetConsulting",
                table: "WeeklyWorkPlans",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "TargetContacted",
                table: "WeeklyWorkPlans",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "TargetMeeting",
                table: "WeeklyWorkPlans",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "TargetNew",
                table: "WeeklyWorkPlans",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "TargetSigned",
                table: "WeeklyWorkPlans",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EvalConsulting",
                table: "WeeklyWorkPlans");

            migrationBuilder.DropColumn(
                name: "EvalContacted",
                table: "WeeklyWorkPlans");

            migrationBuilder.DropColumn(
                name: "EvalMeeting",
                table: "WeeklyWorkPlans");

            migrationBuilder.DropColumn(
                name: "EvalNew",
                table: "WeeklyWorkPlans");

            migrationBuilder.DropColumn(
                name: "EvalSigned",
                table: "WeeklyWorkPlans");

            migrationBuilder.DropColumn(
                name: "FailureReasonAnalysis",
                table: "WeeklyWorkPlans");

            migrationBuilder.DropColumn(
                name: "TargetConsulting",
                table: "WeeklyWorkPlans");

            migrationBuilder.DropColumn(
                name: "TargetContacted",
                table: "WeeklyWorkPlans");

            migrationBuilder.DropColumn(
                name: "TargetMeeting",
                table: "WeeklyWorkPlans");

            migrationBuilder.DropColumn(
                name: "TargetNew",
                table: "WeeklyWorkPlans");

            migrationBuilder.DropColumn(
                name: "TargetSigned",
                table: "WeeklyWorkPlans");
        }
    }
}
