using Microsoft.EntityFrameworkCore;
using BookInventory.Data;
using BookInventory.Models;

namespace BookInventory.Services
{
    public class BookService
    {
        private readonly BookContext _context;

        public BookService(BookContext context)
        {
            _context = context;
        }

        public async Task<List<Book>> GetAllBooksAsync()
        {
            return await _context.Books.OrderByDescending(b => b.DateAdded).ToListAsync();
        }

        public async Task<Book?> GetBookByIdAsync(int id)
        {
            return await _context.Books.FindAsync(id);
        }

        public async Task<Book> AddBookAsync(Book book)
        {
            book.DateAdded = DateTime.Now;
            _context.Books.Add(book);
            await _context.SaveChangesAsync();
            return book;
        }

        public async Task<Book> UpdateBookAsync(Book book)
        {
            _context.Books.Update(book);
            await _context.SaveChangesAsync();
            return book;
        }

        public async Task DeleteBookAsync(int id)
        {
            var book = await _context.Books.FindAsync(id);
            if (book != null)
            {
                _context.Books.Remove(book);
                await _context.SaveChangesAsync();
            }
        }

        public async Task<List<Book>> SearchBooksAsync(string searchTerm)
        {
            if (string.IsNullOrWhiteSpace(searchTerm))
            {
                return await GetAllBooksAsync();
            }

            var lowerSearchTerm = searchTerm.ToLower();
            return await _context.Books
                .Where(b => b.Title.ToLower().Contains(lowerSearchTerm) ||
                           b.Author.ToLower().Contains(lowerSearchTerm) ||
                           b.Location.ToLower().Contains(lowerSearchTerm) ||
                           (b.Notes != null && b.Notes.ToLower().Contains(lowerSearchTerm)))
                .OrderByDescending(b => b.DateAdded)
                .ToListAsync();
        }

        public async Task<int> GetTotalBooksCountAsync()
        {
            return await _context.Books.CountAsync();
        }

        public async Task<int> GetUniqueLocationsCountAsync()
        {
            return await _context.Books
                .Select(b => b.Location.ToLower())
                .Distinct()
                .CountAsync();
        }

        public async Task<List<string>> GetAllLocationsAsync()
        {
            return await _context.Books
                .Select(b => b.Location)
                .Distinct()
                .OrderBy(l => l)
                .ToListAsync();
        }
    }
}