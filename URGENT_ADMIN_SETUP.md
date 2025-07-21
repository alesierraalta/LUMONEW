# 🚨 URGENT: Create Admin User Now

## The browser should have opened to: https://supabase.com/dashboard/project/hnbtninlyzpdemyudaqg/auth/users

## Follow these EXACT steps:

### 1. 🔑 Login to Supabase
- If you're not logged in, login with your Supabase account

### 2. ➕ Create Admin User
- You should see the "Authentication > Users" page
- Click the **"Add user"** button (green button on the right)

### 3. 📝 Fill the Form with EXACT details:
```
Email: alesierraalta@gmail.com
Password: admin123
Email Confirm: ✅ CHECK THIS BOX
Auto Confirm User: ✅ CHECK THIS BOX
```

### 4. 💾 Create User
- Click **"Create user"** button
- You should see a success message

### 5. ✅ Test Login
- Go to: http://localhost:3000/auth/login
- Login with:
  - Email: alesierraalta@gmail.com
  - Password: admin123

## 🎯 Expected Result:
- Login should work without 400 error
- You'll be redirected to the dashboard
- You can access admin features at: http://localhost:3000/auth/admin-signup

## ❌ If you still get 400 error:
- Double-check both checkboxes were selected
- Wait 30 seconds and try again
- Check the user appears in the Supabase Auth users list

---
**The 400 error will disappear once the user is created in Supabase Auth!**