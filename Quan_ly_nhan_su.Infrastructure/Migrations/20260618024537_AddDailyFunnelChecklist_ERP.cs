using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Quan_ly_nhan_su.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddDailyFunnelChecklist_ERP : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "ConsultingAt",
                table: "Leads",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ContactedAt",
                table: "Leads",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "MeetingAt",
                table: "Leads",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "NewAt",
                table: "Leads",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "SignedAt",
                table: "Leads",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EvalConsulting",
                table: "DailyReports",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EvalContacted",
                table: "DailyReports",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EvalMeeting",
                table: "DailyReports",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EvalNew",
                table: "DailyReports",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EvalSigned",
                table: "DailyReports",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FailureReasonAnalysis",
                table: "DailyReports",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "TargetConsulting",
                table: "DailyReports",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "TargetContacted",
                table: "DailyReports",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "TargetMeeting",
                table: "DailyReports",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "TargetNew",
                table: "DailyReports",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "TargetSigned",
                table: "DailyReports",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ConsultingAt",
                table: "Leads");

            migrationBuilder.DropColumn(
                name: "ContactedAt",
                table: "Leads");

            migrationBuilder.DropColumn(
                name: "MeetingAt",
                table: "Leads");

            migrationBuilder.DropColumn(
                name: "NewAt",
                table: "Leads");

            migrationBuilder.DropColumn(
                name: "SignedAt",
                table: "Leads");

            migrationBuilder.DropColumn(
                name: "EvalConsulting",
                table: "DailyReports");

            migrationBuilder.DropColumn(
                name: "EvalContacted",
                table: "DailyReports");

            migrationBuilder.DropColumn(
                name: "EvalMeeting",
                table: "DailyReports");

            migrationBuilder.DropColumn(
                name: "EvalNew",
                table: "DailyReports");

            migrationBuilder.DropColumn(
                name: "EvalSigned",
                table: "DailyReports");

            migrationBuilder.DropColumn(
                name: "FailureReasonAnalysis",
                table: "DailyReports");

            migrationBuilder.DropColumn(
                name: "TargetConsulting",
                table: "DailyReports");

            migrationBuilder.DropColumn(
                name: "TargetContacted",
                table: "DailyReports");

            migrationBuilder.DropColumn(
                name: "TargetMeeting",
                table: "DailyReports");

            migrationBuilder.DropColumn(
                name: "TargetNew",
                table: "DailyReports");

            migrationBuilder.DropColumn(
                name: "TargetSigned",
                table: "DailyReports");
        }
    }
}
