# Postman API Collection Setup

## Prerequisites
- Postman installed
- Backend server running locally

## Import Steps
1. Open Postman
2. Click "Import" button
3. Select the `ChatBot-API-Collection.postman_collection.json` file
4. Select the `ChatBot-Local-Environment.postman_environment.json` file

## Environment Variables
- `baseUrl`: Your local server URL (default: `http://localhost:3000`)
- `token`: JWT token obtained after login
- `receiverId`: User ID to send/receive messages
- `applicationId`: Application ID for admin messages (optional)

## Authentication Workflow
1. Register a new user via "Register User" endpoint
2. Login via "Login User" endpoint
3. Copy the JWT token from the login response
4. Set the `token` environment variable in Postman
5. Now you can use other endpoints

## Chat Endpoints
- Send Message: Requires receiver ID, optional application ID
- Get Messages: Retrieves messages based on user role

## Troubleshooting
- Ensure backend server is running
- Check console for any error messages
- Verify environment variables are correctly set

## Role-Based Access
- Users: Can send/receive personal messages
- Admins: Can send messages for specific applications
- Superadmin: Can see all messages

Happy Testing!
