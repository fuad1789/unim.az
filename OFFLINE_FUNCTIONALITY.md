# Offline Functionality Documentation

## Overview

The unim.az application now supports full offline functionality, allowing users to access their selected group information and use the application without an internet connection. All user data and group information is cached locally and synchronized when online.

## Key Features

### 🔄 Offline-First Architecture

- **Automatic Caching**: Group data is automatically cached when first loaded
- **Offline Fallback**: Application works seamlessly when offline
- **Smart Sync**: Data synchronizes automatically when connection is restored
- **Persistent Storage**: User preferences and group data persist across sessions

### 📱 User Experience

- **Seamless Transition**: No interruption when going offline/online
- **Visual Indicators**: Clear offline status indicators
- **Data Freshness**: Shows when data was last synchronized
- **Manual Sync**: Users can manually trigger synchronization

## Technical Implementation

### Core Components

#### 1. Offline Manager (`src/utils/offlineManager.ts`)

Central utility for managing offline data storage and retrieval.

**Key Functions:**

- `saveOfflineGroupData()` - Cache group data for offline use
- `loadOfflineGroupData()` - Retrieve cached group data
- `saveOfflineUserPreferences()` - Store user preferences offline
- `isOffline()` - Check current online/offline status
- `isOfflineDataStale()` - Check if cached data needs updating

#### 2. Sync Manager (`src/utils/syncManager.ts`)

Handles data synchronization when online.

**Key Features:**

- Automatic sync when connection is restored
- Batch synchronization for multiple universities
- Concurrency control to prevent overwhelming the server
- Status tracking and error handling

#### 3. Offline Hook (`src/hooks/useOfflineSync.ts`)

React hook for components to easily integrate offline functionality.

**Usage:**

```typescript
const { isOffline, isStale, sync, isSyncing } = useOfflineSync({
  universityId: 11,
  autoSync: true,
});
```

#### 4. Offline Indicator (`src/components/OfflineIndicator.tsx`)

Visual component showing offline status and sync information.

**Features:**

- Real-time offline/online status
- Last sync timestamp
- Manual sync button
- Stale data warnings

### Data Flow

#### Online Mode

1. User selects university and group
2. Data is fetched from API
3. Data is cached in localStorage
4. User preferences are saved
5. Sync timestamp is updated

#### Offline Mode

1. Application detects offline status
2. Cached data is loaded from localStorage
3. User can access all functionality
4. Changes are saved locally
5. Sync is queued for when online

#### Sync Process

1. Application detects online status
2. Checks if data is stale
3. Fetches latest data from API
4. Updates local cache
5. Notifies user of successful sync

## Storage Structure

### localStorage Keys

- `unimaz-offline-group-data` - Cached group data by university
- `unimaz-offline-user-preferences` - User preferences with metadata
- `unimaz-offline-last-sync` - Last synchronization timestamp
- `unimaz-offline-mode` - Current offline mode status
- `unimaz-userdata` - User absences and grades (existing)

### Data Format

```typescript
interface OfflineData {
  universities: University[];
  groups: Record<number, Group[]>; // universityId -> groups
  lastSync: number;
  version: string;
}
```

## User Interface

### Offline Indicator

- **Green**: Online and data is fresh
- **Yellow**: Online but data is stale (with sync button)
- **Orange**: Currently offline

### Status Messages

- "Offline rejim" - When offline
- "Məlumatlar köhnədir" - When data is stale
- "Sinxronizasiya edildi" - When sync is complete
- "Son yenilənmə: X dəqiqə əvvəl" - Last sync time

## Configuration

### Auto-Sync Settings

- **Default Interval**: 30 seconds
- **Stale Data Threshold**: 7 days
- **Concurrency Limit**: 3 simultaneous requests

### Storage Limits

- **Group Data**: Cached per university
- **User Data**: Persistent across sessions
- **Sync History**: Last 30 days

## Error Handling

### Network Errors

- Graceful fallback to cached data
- User notification of sync failures
- Retry mechanism for failed syncs

### Storage Errors

- Graceful degradation if localStorage is full
- Data validation and recovery
- Export/import functionality for data backup

## Performance Optimizations

### Caching Strategy

- **Cache-First**: Always check cache before API
- **Stale-While-Revalidate**: Serve cached data while updating
- **Incremental Updates**: Only sync changed data

### Memory Management

- **Lazy Loading**: Load data only when needed
- **Cleanup**: Remove old cached data
- **Compression**: Optimize storage usage

## Browser Compatibility

### Supported Features

- localStorage API
- Online/Offline events
- Service Worker (PWA)
- Fetch API

### Fallbacks

- Manual refresh when offline
- Basic functionality without advanced features
- Error messages for unsupported browsers

## Testing

### Offline Testing

1. Open browser DevTools
2. Go to Network tab
3. Check "Offline" checkbox
4. Test application functionality

### Sync Testing

1. Load data while online
2. Go offline
3. Make changes
4. Go back online
5. Verify sync occurs

## Troubleshooting

### Common Issues

#### Data Not Syncing

- Check internet connection
- Verify API endpoints are accessible
- Check browser console for errors
- Try manual sync

#### Offline Data Missing

- Ensure data was loaded while online
- Check localStorage in DevTools
- Verify university ID is correct
- Try refreshing the page

#### Performance Issues

- Clear old cached data
- Check available storage space
- Restart browser
- Update to latest version

## Future Enhancements

### Planned Features

- **Background Sync**: Sync data in background
- **Conflict Resolution**: Handle data conflicts
- **Selective Sync**: Choose what to sync
- **Data Compression**: Reduce storage usage
- **Offline Analytics**: Track offline usage

### API Improvements

- **Delta Sync**: Only sync changes
- **Batch Operations**: Multiple operations in one request
- **Real-time Updates**: WebSocket support
- **Data Versioning**: Track data versions

## Security Considerations

### Data Privacy

- All data stored locally
- No data sent to external servers
- User controls data export/import
- Clear data functionality

### Data Integrity

- Validation of cached data
- Checksum verification
- Error recovery mechanisms
- Backup and restore options

## Conclusion

The offline functionality provides a robust, user-friendly experience that ensures users can access their academic information regardless of internet connectivity. The implementation follows modern web development best practices and provides a solid foundation for future enhancements.
