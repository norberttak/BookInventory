using System.ComponentModel.DataAnnotations;

namespace BookInventory.Models
{
    public class Book
    {
        public int Id { get; set; }

        [Required]
        [StringLength(500)]
        public string Title { get; set; } = string.Empty;

        [Required]
        [StringLength(300)]
        public string Author { get; set; } = string.Empty;

        [StringLength(20)]
        public string? ISBN { get; set; }

        [Required]
        [StringLength(200)]
        public string Location { get; set; } = string.Empty;

        [StringLength(1000)]
        public string? Notes { get; set; }

        public DateTime DateAdded { get; set; } = DateTime.Now;
    }
}