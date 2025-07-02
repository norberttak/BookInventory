using Microsoft.EntityFrameworkCore;
using BookInventory.Models;

namespace BookInventory.Data
{
    public class BookContext : DbContext
    {
        public BookContext(DbContextOptions<BookContext> options) : base(options)
        {
        }

        public DbSet<Book> Books { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Book>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Title).IsRequired().HasMaxLength(500);
                entity.Property(e => e.Author).IsRequired().HasMaxLength(300);
                entity.Property(e => e.ISBN).HasMaxLength(20);
                entity.Property(e => e.Location).IsRequired().HasMaxLength(200);
                entity.Property(e => e.Notes).HasMaxLength(1000);
                entity.Property(e => e.DateAdded).IsRequired();
            });
        }
    }
}