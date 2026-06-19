using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Quan_ly_nhan_su.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddLeadNotes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Notes",
                table: "Leads",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Notes",
                table: "Leads");
        }
    }
}
