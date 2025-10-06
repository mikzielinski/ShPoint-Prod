# 🧪 Character System Testing Guide

This guide helps you test the character collection, creation, and editing functionality that was recently fixed.

## 🚀 Quick Start

### 1. **HTML Test Page** (Recommended)
- Open `character-test.html` in your browser
- Fill in your server URL, dev secret, character ID, and user ID
- Click the test buttons to run individual tests or "Run All Tests"

### 2. **Node.js Script**
```bash
# Edit the script with your values
nano test-character-endpoints.js

# Run the tests
node test-character-endpoints.js
```

## 🔧 Configuration

### Required Values:
- **Server URL**: Your Render app URL (e.g., `https://your-app.onrender.com`)
- **Dev Secret**: The secret key for dev endpoints (`dev-secret-key-2025`)
- **Character ID**: A character ID from your JSON files (e.g., `luke-skywalker`)
- **User ID**: Your user ID from the database

### Finding Your Values:

#### Server URL:
- Check your Render dashboard
- Look for your app's URL

#### Dev Secret:
- Default: `dev-secret-key-2025`
- Can be changed in server environment variables

#### Character ID:
- Look in `apps/server/characters_assets/` folder
- Use any folder name (e.g., `luke-skywalker`, `darth-vader`)

#### User ID:
- Check your database or use the health endpoint
- Or use the admin panel to find user IDs

## 🧪 Available Tests

### **Character System Tests:**
1. **Test Character System** - Checks if character exists in DB and JSON files
2. **Test Create Character** - Creates character from JSON if missing
3. **Test Collection** - Tests adding character to user's collection
4. **Test Edit Character** - Tests editing character data

### **Real API Tests:**
1. **Test Real Collection API** - Tests the actual collection endpoint
2. **Test Real Update API** - Tests the actual character update endpoint
3. **Test Character Sync** - Triggers character sync from JSON to DB

## 📊 Understanding Results

### Success Response:
```json
{
  "ok": true,
  "message": "Test successful",
  "data": { ... }
}
```

### Error Response:
```json
{
  "ok": false,
  "error": "Error description",
  "details": "Additional error info"
}
```

## 🔍 Test Scenarios

### **Scenario 1: Character Not in Database**
- Character exists in JSON files but not in database
- Expected: Auto-creation from JSON should work
- Test: "Test Create Character" → "Test Collection"

### **Scenario 2: Character Already in Database**
- Character exists in both JSON and database
- Expected: Should use existing database entry
- Test: "Test Character System" → "Test Collection"

### **Scenario 3: Character Editing**
- Edit character data through the API
- Expected: Should update database entry
- Test: "Test Edit Character"

### **Scenario 4: Collection Management**
- Add character to user's collection
- Expected: Should create/update collection entry
- Test: "Test Collection"

## 🚨 Troubleshooting

### **Common Issues:**

#### 1. **"Character not found"**
- Check if character ID exists in `characters_assets/` folder
- Verify the character has `data.json` file

#### 2. **"User not found"**
- Make sure you're using a valid user ID
- Check if user exists in database

#### 3. **"Dev secret invalid"**
- Verify the dev secret key matches server configuration
- Check server environment variables

#### 4. **"Server not responding"**
- Check if server is running
- Verify the server URL is correct
- Check server logs for errors

### **Debug Steps:**
1. Test server health: `GET /health`
2. Check character system: `GET /api/dev/test-character-system?characterId=YOUR_ID`
3. Verify dev access: Check if dev endpoints respond
4. Check server logs for detailed error messages

## 📝 Test Checklist

- [ ] Server is running and accessible
- [ ] Dev secret key is correct
- [ ] Character ID exists in JSON files
- [ ] User ID is valid
- [ ] Character system test passes
- [ ] Character creation test passes
- [ ] Collection test passes
- [ ] Edit test passes
- [ ] Real API tests pass

## 🎯 Expected Outcomes

After running all tests successfully, you should see:
- ✅ Characters automatically created from JSON when missing
- ✅ Collection entries created/updated properly
- ✅ Character editing working without JSON fallback
- ✅ All real API endpoints functioning correctly

## 📞 Support

If tests fail:
1. Check server logs for detailed error messages
2. Verify all configuration values are correct
3. Test individual endpoints to isolate issues
4. Check database connectivity and permissions

---

**Happy Testing! 🎉**