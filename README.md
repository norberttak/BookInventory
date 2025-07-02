# Book Inventory Desktop Application

A desktop application for managing your personal book collection with barcode scanning capabilities. Built with Blazor Server and packaged as an Electron app for cross-platform desktop use.

## Features

- 📚 **Book Management**: Add, edit, and organize your books
- 📱 **Barcode Scanner**: Scan ISBN barcodes to automatically fetch book information
- 🏠 **Location Tracking**: Track where books are located in your home
- 📝 **Notes**: Add personal notes to each book
- 🔍 **Search & Filter**: Find books quickly
- 💾 **SQLite Database**: All data stored locally

## Tech Stack

- **Backend**: ASP.NET Core Blazor Server (.NET 9)
- **Frontend**: Blazor Interactive Server Components
- **Database**: SQLite with Entity Framework Core
- **Desktop**: Electron
- **Barcode Scanning**: QuaggaJS
- **Book Data**: Google Books API

## Prerequisites

- [.NET 9 SDK](https://dotnet.microsoft.com/download/dotnet/9.0)
- [Node.js](https://nodejs.org/) (v16 or later)
- Git

## Development Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd BookInventory
   ```

2. **Install .NET dependencies**
   ```bash
   dotnet restore
   ```

3. **Install Node.js dependencies**
   ```bash
   npm install
   ```

4. **Run in development mode**
   ```bash
   npm run electron-dev
   ```
   This will start the Blazor server and open the Electron app.

## Building for Production

To build the desktop application:

```bash
npm run build
```

This will:
- Build the Blazor application with platform-specific runtime
- Package everything into an Electron application
- Create platform-specific installers in the `release/` directory

### Platform-specific builds

The build script automatically detects your platform and builds accordingly:
- **macOS**: Creates `.dmg` files for both x64 and ARM64
- **Windows**: Creates `.exe` installer
- **Linux**: Creates AppImage

## Project Structure

```
BookInventory/
├── Components/           # Blazor components
│   ├── Pages/           # Page components
│   └── Layout/          # Layout components
├── Data/                # Database context
├── Models/              # Data models
├── Services/            # Business logic services
├── wwwroot/             # Static web assets
├── electron/            # Electron configuration
│   ├── main.js         # Main Electron process
│   └── preload.js      # Preload script
├── build-electron.sh    # Build script
└── package.json        # Node.js dependencies
```

## Usage

### Adding Books

1. **Manual Entry**: Click "Add New Book" and fill in the details
2. **Barcode Scanning**: Click "Scan Barcode" to use your camera to scan ISBN barcodes

### Managing Books

- **Edit**: Click the edit button on any book entry
- **Notes**: Add or modify notes for better organization
- **Location**: Track where each book is stored in your home

### Database

The SQLite database (`books.db`) is created automatically and stores all your book data locally. No internet connection required after the initial book data fetch.

## Troubleshooting

### Common Issues

1. **Camera Permission**: Ensure your browser/Electron app has camera permissions for barcode scanning
2. **Build Errors**: Make sure all prerequisites are installed and up to date
3. **Database Issues**: Delete `books.db` to reset the database if needed

### Logs

Check the console output in development mode for detailed error messages.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).