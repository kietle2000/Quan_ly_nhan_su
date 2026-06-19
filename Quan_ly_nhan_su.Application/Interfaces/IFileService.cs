using System.IO;
using System.Threading.Tasks;

namespace Quan_ly_nhan_su.Application.Interfaces
{
    public interface IFileService
    {
        Task<string> SaveFileAsync(Stream fileStream, string fileName, string subFolder);
        void DeleteFile(string relativePath);
    }
}
