# Notes Widget

A powerful rich text editor widget built with Editor.js for the TodoTrack application.

## Features

### 📝 Rich Text Editing
- **Block-based editor** with clean JSON output
- **Multiple content types**: paragraphs, headers, lists, quotes, checklists, tables, and more
- **Inline formatting**: bold, italic, highlighting, links
- **Real-time auto-save** to localStorage

### 🎨 Modern UI
- **Dark/Light theme support** that matches the app's design
- **Responsive layout** with collapsible note list
- **Smooth animations** and transitions
- **Custom styling** for all Editor.js components

### 📚 Note Management
- **Multiple notes** with individual titles
- **Note list sidebar** with creation dates
- **Edit/View modes** for each note
- **Delete functionality** with hover confirmation
- **Local storage** for persistent data

## Editor.js Tools Included

- **Header** - Multiple heading levels (H1-H6)
- **Paragraph** - Basic text blocks with inline formatting
- **List** - Ordered and unordered lists
- **Quote** - Blockquotes with captions
- **Marker** - Text highlighting
- **Checklist** - Interactive checkboxes
- **Delimiter** - Visual separators
- **Table** - Data tables with inline editing
- **Image** - Image upload and embedding
- **Link Tool** - Rich link previews

## Usage

1. **Add the widget** from the widget selector
2. **Create a new note** using the + button
3. **Switch between edit and view modes** using the edit button
4. **Toggle the note list** using the list button
5. **Edit note titles** by clicking on them
6. **Delete notes** by hovering and clicking the trash icon

## Technical Implementation

### Dependencies
- `@editorjs/editorjs` - Core editor
- `@editorjs/header` - Header blocks
- `@editorjs/list` - List blocks
- `@editorjs/paragraph` - Paragraph blocks
- `@editorjs/quote` - Quote blocks
- `@editorjs/marker` - Text highlighting
- `@editorjs/checklist` - Checklist blocks
- `@editorjs/delimiter` - Delimiter blocks
- `@editorjs/table` - Table blocks
- `@editorjs/image` - Image blocks
- `@editorjs/link` - Link tool

### Data Structure
Notes are stored in localStorage with the following structure:
```typescript
interface Note {
  id: string;
  title: string;
  content: any; // Editor.js JSON output
  createdAt: number;
  updatedAt: number;
}
```

### Styling
- Custom CSS for Editor.js components
- Dark/light theme support
- Responsive design
- Consistent with app's design system

## Future Enhancements

- **Export functionality** (PDF, Markdown, HTML)
- **Note categories/tags**
- **Search functionality**
- **Rich media support** (videos, embeds)
- **Collaborative editing**
- **Cloud sync** (optional)

## Browser Compatibility

- Modern browsers with ES6+ support
- LocalStorage required for data persistence
- Responsive design for mobile and desktop 