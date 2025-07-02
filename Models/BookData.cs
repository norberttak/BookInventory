namespace BookInventory.Models
{
    public class BookData
    {
        public string Title { get; set; } = string.Empty;
        public string Author { get; set; } = string.Empty;
        public string? ISBN { get; set; }
        public string? Publisher { get; set; }
        public int? PublishedYear { get; set; }
        public string? Description { get; set; }
    }

    public class GoogleBooksResponse
    {
        public int TotalItems { get; set; }
        public List<GoogleBookItem> Items { get; set; } = new();
    }

    public class GoogleBookItem
    {
        public GoogleBookVolumeInfo VolumeInfo { get; set; } = new();
    }

    public class GoogleBookVolumeInfo
    {
        public string Title { get; set; } = string.Empty;
        public List<string> Authors { get; set; } = new();
        public string Publisher { get; set; } = string.Empty;
        public string PublishedDate { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public List<GoogleBookIdentifier> IndustryIdentifiers { get; set; } = new();
    }

    public class GoogleBookIdentifier
    {
        public string Type { get; set; } = string.Empty;
        public string Identifier { get; set; } = string.Empty;
    }
}