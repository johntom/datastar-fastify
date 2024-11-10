
# Stateful Gallery Application - POC Documentation

## Overview
This proof of concept demonstrates a browser-specific state management solution for a gallery application that doesn't require user authentication but needs to maintain individual user states across different views.

## Key Features
1. Anonymous State Management
   - Maintains unique browser states without user login
   - Uses session IDs to track individual browser sessions
   - Persists view preferences per browser instance

2. Use Case Implementation
   - Primary view: Image Gallery
   - Secondary view: Menu Options
   - State preservation when switching between views
   - Independent state management for concurrent users

## Technical Implementation

### State Management
- **Session Identification**: Each browser instance receives a unique session ID
- **Storage Method**: Uses browser's Local Storage
  - Key: `person`
  - Value: Session-specific state data
- **State Persistence**: Maintains throughout the entire browser session

### View Handling
1. **Main Image View**
   - Preserves user-specific viewing preferences
   - Maintains state when navigating away and returning
   - State changes are isolated to the current session

2. **Menu Options View**
   - Allows view customization
   - Changes are tracked per browser instance
   - Updates don't affect other active sessions

## Testing and Verification

### Test Scenario
1. Open two separate browser instances
2. Navigate to the gallery application in both
3. Verify in Browser Developer Tools:
   - Check Application tab
   - Locate Local Storage
   - Find `settings` key
   - Compare session states between instances

### State Verification
- Use "Get Backend State" functionality
- Confirms retrieval of session-specific state
- Validates isolation from other active sessions
- Demonstrates that backend state updates from other users don't affect current session

## Implementation Benefits
1. **Privacy**: No user authentication required
2. **Isolation**: Each browser maintains independent state
3. **Persistence**: State maintains throughout session
4. **Scalability**: Supports multiple concurrent users
5. **Simplicity**: Straightforward state management without complex authentication

## Technical Notes
- Backend state changes are isolated per session
- Session ID serves as the unique identifier
- Local Storage provides persistent state storage
- State retrieval is always session-specific
- Backend updates from other users don't override current session state

## Example Usage
```
Open 2 seperate tabs with same url  
```
