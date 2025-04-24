
# SubTrackr - Subscription Management Application

SubTrackr is a comprehensive web application for managing and tracking your subscriptions, helping you stay on top of recurring payments and avoid unnecessary expenses.

![SubTrackr Logo](generated-icon.png)

## Features

### Core Functionality
- **Subscription Management**: Add, edit, and remove subscription services
- **Dashboard**: Visualize spending patterns with summary cards and charts
- **Categorization**: Organize subscriptions by category with color-coding
- **Service Library**: Browse and import from a pre-defined library of popular services

### Notification System
- **Email Notifications**: Receive reminders about upcoming payments
- **Push Notifications**: Get browser notifications (where supported)
- **Pushover Integration**: Connect with Pushover for mobile notifications
- **Pushbullet Integration**: Use Pushbullet for cross-device alerts
- **Configurable Reminders**: Set when to be notified before payments are due

### User Experience
- **Responsive Design**: Works on desktop and mobile devices
- **Tabbed Settings Interface**: Easy management of all application settings
- **Dark/Light Mode**: Choose your preferred theme
- **User Management**: Add household members to track shared subscriptions

### Technical Features
- **REST API**: Comprehensive backend API for all operations
- **PostgreSQL Database**: Persistent storage for subscriptions and settings
- **Docker Support**: Easy deployment with Docker and docker-compose

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL (optional if using Docker)

### Development Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/subtrackr.git
cd subtrackr
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. The application will be available at [http://localhost:5000](http://localhost:5000)

### Using Docker

The application includes Docker and docker-compose configurations for easy deployment:

1. Build and start the containers:
```bash
docker-compose up -d
```

2. The application will be available at [http://localhost:5000](http://localhost:5000)

## Database Schema

SubTrackr stores the following data:

- **Subscriptions**: Details about each subscription including payment amounts, billing cycles, and due dates
- **Categories**: Custom categories to organize subscriptions
- **Users/Household Members**: Information about users who share the subscription tracking
- **API Keys**: Securely stored integration keys for notification services
- **Notifications**: Records of sent notifications and their status

## API Endpoints

The application provides a RESTful API for all operations:

- `GET /api/subscriptions`: List all subscriptions
- `POST /api/subscriptions`: Create a new subscription
- `GET /api/subscriptions/:id`: Get a specific subscription
- `PUT /api/subscriptions/:id`: Update a subscription
- `DELETE /api/subscriptions/:id`: Delete a subscription
- `GET /api/categories`: List all categories
- `GET /api/services`: List available service templates
- `GET /api/settings/notifications`: Get notification settings
- `PUT /api/settings/notifications`: Update notification settings

## Notification Setup

To enable notifications:

1. Go to the Notifications page
2. Configure your email address for email notifications
3. For Pushover notifications, enter your Pushover user key and API token
4. For Pushbullet notifications, enter your Pushbullet access token
5. For browser notifications, allow the permissions when prompted

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
