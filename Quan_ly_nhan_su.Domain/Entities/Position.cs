using System;
using System.Collections.Generic;

namespace Quan_ly_nhan_su.Domain.Entities
{
    public class Position
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;

        public ICollection<Employee> Employees { get; set; } = new List<Employee>();
    }
}
