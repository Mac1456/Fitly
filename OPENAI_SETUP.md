# 🔐 OpenAI API Key - Secure Setup Guide

Your OpenAI API key has been secured! The key is now stored safely in the main process and never exposed to the renderer where it could be accessed by users.

## 🚨 Security Features Implemented

✅ **API key stored in main process only** (not accessible via DevTools)  
✅ **IPC communication** between renderer and main process  
✅ **Multiple secure storage options** (environment variables & local file)  
✅ **Automatic gitignore** protection for local key files  
✅ **No API key exposure** in source code or browser inspection  

## 📋 Setup Options

### Option 1: Environment Variable (Recommended for Production)

**Windows (PowerShell):**
```powershell
setx OPENAI_API_KEY "your-api-key-here"
```

**Windows (Command Prompt):**
```cmd
set OPENAI_API_KEY=your-api-key-here
```

**Mac/Linux (Terminal):**
```bash
export OPENAI_API_KEY="your-api-key-here"
```

**To make it permanent on Mac/Linux, add to your shell profile:**
```bash
echo 'export OPENAI_API_KEY="your-api-key-here"' >> ~/.bashrc
# or ~/.zshrc for zsh users
```

### Option 2: Local File (For Development)

1. Create file: `src/openai-key.local.txt`
2. Put your API key in the file (one line, no extra text)
3. The file is automatically protected by .gitignore

**Example:**
```bash
echo "your-api-key-here" > src/openai-key.local.txt
```

## 🔑 Getting Your OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in to your account
3. Navigate to "API Keys" section
4. Click "Create new secret key"
5. Copy the key (you won't see it again!)
6. Set up billing (OpenAI requires payment info)

## 💰 Cost Estimates

- **Onboarding chat:** ~$0.002-0.005 per conversation
- **Meal analysis:** ~$0.001-0.003 per meal
- **Very affordable** for personal use!

## 🔄 How to Restart After Setup

After adding your API key:

1. **If using environment variable:** Restart the Fitly app completely
2. **If using local file:** The app will detect it automatically

## 🛡️ Security Best Practices

### ✅ DO:
- Use environment variables for production
- Keep your API key private and secure
- Monitor your OpenAI usage dashboard
- Set spending limits in OpenAI dashboard

### ❌ DON'T:
- Share your API key with anyone
- Commit API keys to version control
- Use API keys in client-side code
- Hardcode keys in source files

## 🔍 Verification

To verify your setup is working:

1. Start the Fitly app
2. Check the console logs for: `🔐 OpenAI API key loaded from...`
3. Try the conversational onboarding or meal analysis features
4. Look for AI-powered responses

## 🚨 If Something Goes Wrong

**API key not detected:**
- Restart the app after setting environment variable
- Check file path: `src/openai-key.local.txt`
- Verify no extra spaces or characters in the key

**API calls failing:**
- Check your OpenAI account has billing set up
- Verify the API key is valid and active
- Check your usage limits in OpenAI dashboard

**Security concerns:**
- The API key is never stored in the renderer process
- The key never appears in DevTools or browser inspection
- All API calls are made securely from the main process

## 📞 Support

If you need help with the setup, check the console logs in the app for detailed debugging information. All operations are thoroughly logged for troubleshooting.

---

**Your API key is now 100% secure and ready to use! 🎉** 