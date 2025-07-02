using System.Text.Json;
using BookInventory.Models;

namespace BookInventory.Services
{
    public class BookDataService
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<BookDataService> _logger;

        public BookDataService(HttpClient httpClient, ILogger<BookDataService> logger)
        {
            _httpClient = httpClient;
            _logger = logger;
        }

        public async Task<BookData?> FetchBookDataByISBNAsync(string isbn)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(isbn))
                    return null;

                // Clean up ISBN (remove dashes, spaces)
                var cleanIsbn = isbn.Replace("-", "").Replace(" ", "").Trim();
                
                // Try Google Books API first
                var googleResult = await FetchFromGoogleBooksAsync(cleanIsbn);
                if (googleResult != null)
                    return googleResult;

                // Could add more APIs here as fallback
                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching book data for ISBN: {ISBN}", isbn);
                return null;
            }
        }

        private async Task<BookData?> FetchFromGoogleBooksAsync(string isbn)
        {
            try
            {
                var url = $"https://www.googleapis.com/books/v1/volumes?q=isbn:{isbn}";
                var response = await _httpClient.GetAsync(url);
                
                if (!response.IsSuccessStatusCode)
                    return null;

                var jsonContent = await response.Content.ReadAsStringAsync();
                var googleResponse = JsonSerializer.Deserialize<GoogleBooksResponse>(jsonContent, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                if (googleResponse?.Items?.Any() != true)
                    return null;

                var bookItem = googleResponse.Items.First();
                var volumeInfo = bookItem.VolumeInfo;

                // Extract publication year from date string
                int? publishedYear = null;
                if (!string.IsNullOrEmpty(volumeInfo.PublishedDate))
                {
                    if (DateTime.TryParse(volumeInfo.PublishedDate, out var publishedDate))
                    {
                        publishedYear = publishedDate.Year;
                    }
                    else if (int.TryParse(volumeInfo.PublishedDate.Split('-')[0], out var year))
                    {
                        publishedYear = year;
                    }
                }

                return new BookData
                {
                    Title = volumeInfo.Title,
                    Author = string.Join(", ", volumeInfo.Authors),
                    ISBN = isbn,
                    Publisher = volumeInfo.Publisher,
                    PublishedYear = publishedYear,
                    Description = volumeInfo.Description
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching from Google Books API for ISBN: {ISBN}", isbn);
                return null;
            }
        }
    }
}