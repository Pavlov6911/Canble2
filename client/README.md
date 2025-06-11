# Canble - Discord Clone Frontend

A modern Discord-like chat application built with React, TypeScript, and Material-UI.

## Features

- 🎨 Pure black and violet color scheme
- 💬 Real-time messaging with Socket.IO
- 🏠 Server and channel management
- 👥 Friends and direct messages
- 🎵 Voice channel support
- 📱 Responsive design
- 🌐 Internationalization support

## Tech Stack

- **Frontend**: React 19, TypeScript, Material-UI
- **State Management**: Redux Toolkit
- **Real-time**: Socket.IO Client
- **Routing**: React Router DOM
- **Forms**: React Hook Form with Yup validation
- **Styling**: Emotion, Material-UI styled components

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# API Configuration
REACT_APP_API_URL=https://your-backend-api.vercel.app/api
REACT_APP_SOCKET_URL=https://your-backend-api.vercel.app

# App Configuration
REACT_APP_APP_NAME=Canble
REACT_APP_APP_URL=https://canble.app
```

## Local Development

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test
```

## Deployment to Vercel

### Automatic Deployment

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy automatically on push

### Manual Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Environment Variables for Vercel

Set these in your Vercel dashboard:

- `REACT_APP_API_URL`: Your backend API URL
- `REACT_APP_SOCKET_URL`: Your Socket.IO server URL
- `REACT_APP_APP_NAME`: Canble
- `REACT_APP_APP_URL`: Your frontend URL

## Project Structure

```
src/
├── components/          # React components
│   ├── Auth/           # Authentication components
│   ├── Common/         # Shared components
│   ├── Dialogs/        # Modal dialogs
│   ├── Home/           # Home screen
│   └── Layout/         # Layout components
├── store/              # Redux store and slices
├── theme/              # Material-UI theme
├── types/              # TypeScript type definitions
└── i18n/               # Internationalization
```

## Key Components

- **MainLayout**: Main application layout with Discord-like structure
- **ServerSidebar**: Server list (72px width)
- **ChannelSidebar**: Channel and DM list (240px width)
- **ChatArea**: Main chat interface
- **MemberList**: Server member list (240px width)
- **UserPanel**: User controls at bottom (240px width)

## Discord-like Features

- ✅ Server and channel navigation
- ✅ Friends and direct messages
- ✅ Real-time messaging
- ✅ Voice channel indicators
- ✅ User status and presence
- ✅ Server member management
- ✅ Responsive mobile design

## Performance Optimizations

- Code splitting with React.lazy
- Memoized components with React.memo
- Optimized Redux selectors
- Virtualized lists for large datasets
- Image optimization and lazy loading

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if needed
5. Submit a pull request

## License

MIT License - see LICENSE file for details
