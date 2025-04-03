
# Secure Document Vault

A mobile-friendly web application that allows users to securely store, share, and manage their insurance documents.

## Project info

**URL**: https://lovable.dev/projects/654de609-d840-4e89-9054-fa5182081cea

## Features

- **Secure Authentication**: Phone-based OTP authentication for maximum security
- **Document Upload**: Upload and manage insurance documents in PDF format
- **Document Analysis**: Automatic extraction of key information from insurance documents
- **Document Sharing**: Share your documents with others using invite codes
- **Mobile Responsive**: Designed to work great on all devices

## Test Credentials

For development and testing, Supabase provides "test mode" for phone authentication:

- **Test Phone Number**: +11234567890 (or any other number with a + symbol)
- **OTP Code**: 123456 (will always work in test mode)

## How to Use

1. **Sign Up/Login**: Register with your phone number or log in if you already have an account
2. **Upload Documents**: Click the "Upload Document" button on your dashboard to add insurance documents
3. **View & Edit**: View your uploaded documents and edit details if needed
4. **Share Documents**: Share your documents with others by giving them your invite code
5. **Access Shared Documents**: Enter someone else's invite code to access their shared documents

## Technical Implementation

This project is built with:

- Vite + React + TypeScript
- Tailwind CSS
- shadcn/ui components
- Supabase for authentication, database, and storage
- Supabase Edge Functions for document analysis

## Project Structure

- **Authentication**: Phone-based OTP authentication through Supabase Auth
- **Database**: Stores user profiles, insurance documents metadata, and sharing relationships
- **Storage**: Securely stores the actual PDF documents
- **Edge Functions**: Processes and extracts information from uploaded PDF documents

## Database Schema

- **profiles**: Stores user information
- **insurances**: Stores insurance document metadata
- **invite_codes**: Manages sharing capabilities
- **shared_insurances**: Tracks sharing relationships between users

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/654de609-d840-4e89-9054-fa5182081cea) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/654de609-d840-4e89-9054-fa5182081cea) and click on Share -> Publish.
