# 🧪 ShPoint Testing Checklist

## 📅 Test Date: October 1, 2025

### 🎯 **New Features to Test:**

## 1. 🔐 **Access Request System**
- [ ] **Homepage Form**
  - [ ] Form appears for non-authenticated users
  - [ ] Gmail validation works (accepts only Gmail addresses)
  - [ ] Form submission works
  - [ ] Success/error messages display correctly
  - [ ] Form has dark theme colors

- [ ] **Admin Panel**
  - [ ] Access requests appear in Admin > Invitation Requests tab
  - [ ] Admin can see request details (email, name, message, date)
  - [ ] "Invite" button creates user invitation
  - [ ] "Remove" button deletes request
  - [ ] Invitation email is sent when inviting

## 2. 👤 **User Profile System**
- [ ] **User Profile Page** (`/user`)
  - [ ] Page loads correctly
  - [ ] Shows user information (name, email, role, avatar)
  - [ ] All tabs are accessible: Profile, My Games, Inbox, My Stats, My Modified Cards, API Tokens
  - [ ] Logo displays correctly

- [ ] **My Games Tab**
  - [ ] Shows user's game history
  - [ ] Game logs are expandable
  - [ ] Export buttons work (JSON/CSV)
  - [ ] Game details display correctly

- [ ] **Inbox Tab**
  - [ ] Shows inbox messages
  - [ ] Messages can be marked as read/unread
  - [ ] Message content displays correctly

- [ ] **API Tokens Tab**
  - [ ] Shows existing API tokens
  - [ ] Can create new tokens
  - [ ] Token scopes are role-appropriate
  - [ ] Can delete tokens
  - [ ] Tokens are masked for security

## 3. 🎮 **Game Scheduling System**
- [ ] **Play Page** (`/play`)
  - [ ] Shows existing game modes (Hero vs Hero, Strike Team vs Strike Team)
  - [ ] New sections appear: "Challenge & Schedule Games" and "Game Scheduler"
  - [ ] ChallengeSystem component loads
  - [ ] GameScheduler component loads

- [ ] **Challenge System**
  - [ ] Can create challenges
  - [ ] Can view pending challenges
  - [ ] Can accept/reject challenges
  - [ ] Inbox notifications are sent

- [ ] **Game Scheduler**
  - [ ] Can schedule new games
  - [ ] Can view scheduled games
  - [ ] Can start/cancel games
  - [ ] Game reminders work

## 4. 🌐 **Public Games System**
- [ ] **Public Games List**
  - [ ] Shows available public games
  - [ ] Game statuses display correctly (Available, Pending Approval, Full, etc.)
  - [ ] Player counts show correctly
  - [ ] Waitlist information displays

- [ ] **Creating Public Games**
  - [ ] Can create public game with all required fields
  - [ ] Mission selection works
  - [ ] Date/time picker works
  - [ ] Location field works
  - [ ] Max players setting works
  - [ ] Description field works

- [ ] **Joining Public Games**
  - [ ] Can register for available games
  - [ ] Can join waitlist for full games
  - [ ] Registration status shows correctly
  - [ ] Cannot register twice for same game

- [ ] **Game Management (Host)**
  - [ ] Host receives inbox notification when someone registers
  - [ ] Host can approve/reject registrations from inbox
  - [ ] Approved players receive confirmation
  - [ ] Rejected players receive notification

## 5. ⏰ **Reminder System**
- [ ] **Game Reminders**
  - [ ] Can add reminders to scheduled games
  - [ ] Reminder types work (Email, Push, Both)
  - [ ] Can enable/disable reminders
  - [ ] Can remove reminders
  - [ ] Reminder time picker works

- [ ] **Calendar Integration**
  - [ ] Google Calendar link works
  - [ ] Outlook Calendar link works
  - [ ] ICS download works
  - [ ] Calendar events contain correct game information

## 6. 📧 **Notification System**
- [ ] **Inbox Notifications**
  - [ ] Game registration notifications
  - [ ] Challenge notifications
  - [ ] Game approval/rejection notifications
  - [ ] Waitlist promotion notifications

- [ ] **Email Notifications**
  - [ ] Registration confirmations
  - [ ] Game reminders
  - [ ] Challenge notifications
  - [ ] Calendar event emails

## 7. 📚 **FAQ System**
- [ ] **FAQ Page** (`/faq`)
  - [ ] Page loads correctly
  - [ ] New "Game Scheduling" category appears
  - [ ] All new FAQ items display
  - [ ] Search functionality works
  - [ ] Category filtering works
  - [ ] Role-based content filtering works
  - [ ] Dark theme colors are correct

## 8. 🔧 **API & Backend**
- [ ] **API Endpoints**
  - [ ] `/api/v2/public-games` - GET, POST
  - [ ] `/api/v2/public-games/:id/register` - POST
  - [ ] `/api/v2/public-games/:id/registrations` - GET
  - [ ] `/api/v2/public-games/:id/registrations/:registrationId` - PATCH
  - [ ] `/api/v2/scheduled-games/:id/reminders` - POST, PATCH, DELETE
  - [ ] `/api/v2/scheduled-games/:id/calendar` - GET
  - [ ] `/api/v2/access-requests` - GET, POST
  - [ ] `/api/v2/api-tokens` - GET, POST, DELETE

- [ ] **Database Schema**
  - [ ] New fields added to ScheduledGame (isPublic, maxPlayers)
  - [ ] GameRegistration model works
  - [ ] GameReminder model works with isEnabled
  - [ ] AccessRequest model works
  - [ ] ApiToken model works

## 9. 🎨 **UI/UX**
- [ ] **Dark Theme**
  - [ ] All new components use dark theme colors
  - [ ] Forms have proper contrast
  - [ ] Buttons are clearly visible
  - [ ] Text is readable

- [ ] **Responsive Design**
  - [ ] Components work on mobile
  - [ ] Tables are responsive
  - [ ] Forms are usable on small screens

- [ ] **Navigation**
  - [ ] All new routes work
  - [ ] Links in navigation are correct
  - [ ] Breadcrumbs work where applicable

## 10. 🔒 **Security & Authentication**
- [ ] **API Authentication**
  - [ ] Bearer token authentication works
  - [ ] Google OAuth works
  - [ ] Role-based access control works
  - [ ] Unauthorized requests are blocked

- [ ] **Data Validation**
  - [ ] Input validation works on all forms
  - [ ] SQL injection protection
  - [ ] XSS protection

## 🚨 **Critical Issues to Watch For:**
- [ ] Database migration errors
- [ ] Missing environment variables
- [ ] API endpoint 404s
- [ ] Frontend bundle errors
- [ ] Email sending failures
- [ ] Calendar integration failures

## 📝 **Test Results:**
- **Total Tests:** 100+
- **Passed:** ___ / ___
- **Failed:** ___ / ___
- **Critical Issues:** ___ / ___

## 🔄 **Deployment Checklist:**
- [ ] All changes committed to GitHub
- [ ] Database schema updated in production
- [ ] Environment variables configured
- [ ] Frontend builds successfully
- [ ] Backend deploys successfully
- [ ] All services are running
- [ ] DNS/SSL certificates are valid

---

**Tester:** ________________  
**Date:** ________________  
**Version:** v1.3.0  
**Environment:** Production
