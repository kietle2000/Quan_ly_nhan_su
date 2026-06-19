using FluentValidation;
using Quan_ly_nhan_su.Application.DTOs;

namespace Quan_ly_nhan_su.Application.Validators
{
    public class LoginRequestValidator : AbstractValidator<LoginRequest>
    {
        public LoginRequestValidator()
            : base()
        {
            RuleFor(x => x.Email)
                .NotEmpty().WithMessage("Email không được để trống.")
                .EmailAddress().WithMessage("Email không đúng định dạng.");

            RuleFor(x => x.Password)
                .NotEmpty().WithMessage("Mật khẩu không được để trống.")
                .MinimumLength(6).WithMessage("Mật khẩu phải từ 6 ký tự trở lên.");
        }
    }

    public class RegisterRequestValidator : AbstractValidator<RegisterRequest>
    {
        public RegisterRequestValidator()
            : base()
        {
            RuleFor(x => x.FullName)
                .NotEmpty().WithMessage("Họ tên không được để trống.");

            RuleFor(x => x.Email)
                .NotEmpty().WithMessage("Email không được để trống.")
                .EmailAddress().WithMessage("Email không đúng định dạng.");

            RuleFor(x => x.Password)
                .NotEmpty().WithMessage("Mật khẩu không được để trống.")
                .MinimumLength(6).WithMessage("Mật khẩu phải từ 6 ký tự trở lên.");

            RuleFor(x => x.Phone)
                .NotEmpty().WithMessage("Số điện thoại không được để trống.");

            RuleFor(x => x.Role)
                .NotEmpty().WithMessage("Vai trò không được để trống.")
                .Must(role => role == "Admin" || role == "Manager" || role == "Employee")
                .WithMessage("Vai trò phải thuộc Admin, Manager hoặc Employee.");
        }
    }

    public class CreateLeaveRequestValidator : AbstractValidator<CreateLeaveRequestDto>
    {
        public CreateLeaveRequestValidator()
            : base()
        {
            RuleFor(x => x.StartDate)
                .NotEmpty().WithMessage("Ngày bắt đầu không được để trống.")
                .GreaterThanOrEqualTo(System.DateTime.Today.AddDays(-1))
                .WithMessage("Ngày bắt đầu không thể là quá khứ.");

            RuleFor(x => x.EndDate)
                .NotEmpty().WithMessage("Ngày kết thúc không được để trống.")
                .GreaterThanOrEqualTo(x => x.StartDate)
                .WithMessage("Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu.");

            RuleFor(x => x.Reason)
                .NotEmpty().WithMessage("Lý do nghỉ phép không được để trống.");
        }
    }

    public class CreateLeadValidator : AbstractValidator<CreateLeadDto>
    {
        public CreateLeadValidator()
            : base()
        {
            RuleFor(x => x.Name)
                .NotEmpty().WithMessage("Tên khách hàng không được để trống.");

            RuleFor(x => x.Phone)
                .NotEmpty().WithMessage("Số điện thoại không được để trống.");

            RuleFor(x => x.Source)
                .NotEmpty().WithMessage("Nguồn khách hàng không được để trống.");
        }
    }
}
