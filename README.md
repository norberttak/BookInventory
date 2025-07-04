# Book Inventory Desktop Application

```This is my first AI test project. All the codes in the repository were generated by calude.ai code generator tool```


A desktop application for managing your personal book collection with barcode scanning capabilities. Built with Blazor Server and packaged as an Electron app for cross-platform desktop use.

## Features

- 📚 **Book Management**: Add, edit, and organize your books
- 📱 **Barcode Scanner**: Scan ISBN barcodes to automatically fetch book information
- 🏠 **Location Tracking**: Track where books are located in your home
- 🏷️ **Topic Classification**: Categorize books by topic with type-ahead suggestions
- 📝 **Notes**: Add personal notes to each book
- 🔍 **Search & Filter**: Find books quickly by title, author, location, topic, or notes
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

## CI/CD Pipeline

This project includes a comprehensive GitHub Actions CI/CD pipeline that automatically:

### 🔄 **Automated Builds**
- **Multi-platform support**: Windows (.exe), Linux (AppImage), macOS (DMG)
- **Triggered on**: Push to main/master/develop, pull requests, and git tags
- **Cross-platform testing**: Validates builds on Ubuntu, Windows, and macOS runners

### 📦 **Build Artifacts**
- **Windows**: NSIS installer (.exe)
- **Linux**: AppImage portable application
- **macOS**: DMG with support for both x64 and ARM64 architectures

### 🚀 **Automatic Releases**
- **Git tags**: Creates GitHub releases automatically when you push a version tag (e.g., `v1.0.0`)
- **Release assets**: All platform binaries are attached to the release
- **Release notes**: Auto-generated from commit messages

### 🧪 **Quality Assurance**
- **Automated testing**: Runs .NET tests before building
- **Build validation**: Ensures all platforms build successfully
- **Configuration validation**: Validates workflow YAML files

To trigger a release, simply tag your commit:
```bash
git tag v1.0.0
git push origin v1.0.0
```

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
