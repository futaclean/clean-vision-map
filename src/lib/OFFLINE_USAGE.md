# Offline Support Usage Guide

The app now includes comprehensive offline support with automatic request queuing and retry.

## Features

1. **Offline Detection Banner**: Shows when connection is lost/restored
2. **Request Queue**: Automatically queues failed requests and retries when online
3. **Optimistic Updates**: UI updates immediately, syncs in background

## How to Use

### Using the Offline Supabase Wrapper

Replace direct Supabase calls with the offline wrapper for automatic queuing:

```typescript
import { offlineSupabase } from '@/lib/offlineSupabase';

// Insert
await offlineSupabase.insert('waste_reports', {
  user_id: user.id,
  location_lat: 7.3,
  // ... other data
});

// Update
await offlineSupabase.update('waste_reports', 
  { status: 'resolved' }, 
  reportId
);

// Delete
await offlineSupabase.delete('waste_reports', reportId);
```

### Using the Request Queue Directly

For more control:

```typescript
import { requestQueue } from '@/lib/requestQueue';

// Add to queue manually
requestQueue.add('insert', 'waste_reports', data);

// Check queue size
const pending = requestQueue.size();

// Process queue manually
await requestQueue.processQueue();

// Clear queue (debugging)
requestQueue.clear();
```

### Using the Online Status Hook

```typescript
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

function MyComponent() {
  const isOnline = useOnlineStatus();
  
  return (
    <div>
      {!isOnline && <p>You're offline</p>}
      {/* Your component */}
    </div>
  );
}
```

## How It Works

1. **Connection Monitoring**: Listens to browser online/offline events
2. **Automatic Queuing**: Failed requests are queued to localStorage
3. **Auto Retry**: When connection restored, queued requests retry automatically
4. **Max Retries**: Failed requests retry up to 3 times
5. **Persistence**: Queue survives page refreshes via localStorage

## Testing Offline Mode

1. Open DevTools → Network tab
2. Set throttling to "Offline"
3. Try creating/updating a report
4. See banner and queue message
5. Re-enable network
6. Watch automatic sync

## Notes

- Read operations (SELECT) are not queued (they fail immediately)
- Only mutations (INSERT/UPDATE/DELETE) are queued
- Queue is stored in localStorage and persists across sessions
- Maximum 3 retry attempts per request
