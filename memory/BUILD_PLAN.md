# AI-Powered Corporate Guest & Meeting Room Management System
## Complete Build Plan

---

## 1. SYSTEM OVERVIEW

**Purpose**: Corporate system for managing guests, visitors, and meeting room bookings with AI-powered assistance, smart recommendations, and predictive analytics.

**Tech Stack**:
- Frontend: React + Tailwind CSS + Shadcn UI
- Backend: FastAPI + Python
- Database: MongoDB
- AI: Claude Sonnet 4.5 (via Emergent LLM key)
- Integrations: Google Calendar API

---

## 2. USER ROLES & PERMISSIONS

### 2.1 Admin
- Full system access
- Manage users (create, edit, delete employees and receptionists)
- Manage meeting rooms (add, edit, delete, configure)
- View all analytics and reports
- Override bookings and guest records
- System configuration

### 2.2 Employee
- Book meeting rooms
- Invite guests to meetings
- View own bookings and guest invitations
- Cancel/modify own bookings
- Chat with AI assistant for booking help
- View room availability

### 2.3 Receptionist
- Check-in/check-out guests
- View daily visitor schedule
- Manage walk-in visitors
- Print visitor badges
- View real-time room occupancy
- Approve/reject visitor access

---

## 3. DATA MODELS (MongoDB Collections)

### 3.1 users
```
{
  email: String (unique, indexed)
  password_hash: String
  full_name: String
  role: String (enum: 'admin', 'employee', 'receptionist')
  department: String
  phone: String
  is_active: Boolean
  created_at: DateTime
  updated_at: DateTime
}
```

### 3.2 meeting_rooms
```
{
  room_name: String (unique)
  room_code: String (unique, e.g., "MR-101")
  capacity: Number
  floor: Number
  amenities: Array[String] (e.g., ["Projector", "Whiteboard", "Video Conferencing"])
  equipment: Array[String]
  is_active: Boolean
  images: Array[String] (URLs)
  created_at: DateTime
  updated_at: DateTime
}
```

### 3.3 bookings
```
{
  room_id: ObjectId (ref: meeting_rooms)
  booked_by: ObjectId (ref: users)
  title: String
  description: String
  start_time: DateTime (indexed)
  end_time: DateTime (indexed)
  attendees_internal: Array[ObjectId] (refs: users)
  attendees_external: Array[String] (emails)
  status: String (enum: 'confirmed', 'cancelled', 'completed')
  google_calendar_event_id: String
  ai_suggested: Boolean
  created_at: DateTime
  updated_at: DateTime
}
```

### 3.4 guests
```
{
  full_name: String
  email: String
  phone: String
  company: String
  purpose: String
  host_employee: ObjectId (ref: users)
  meeting_id: ObjectId (ref: bookings, optional)
  visit_date: DateTime (indexed)
  expected_arrival: DateTime
  expected_departure: DateTime
  actual_arrival: DateTime
  actual_departure: DateTime
  status: String (enum: 'expected', 'checked_in', 'checked_out', 'cancelled')
  visitor_badge_number: String
  photo_url: String (optional)
  id_proof_type: String
  notes: String
  checked_in_by: ObjectId (ref: users)
  checked_out_by: ObjectId (ref: users)
  created_at: DateTime
  updated_at: DateTime
}
```

### 3.5 ai_chat_history
```
{
  user_id: ObjectId (ref: users)
  session_id: String
  messages: Array[{
    role: String (enum: 'user', 'assistant')
    content: String
    timestamp: DateTime
  }]
  context: Object (booking preferences, room requirements)
  created_at: DateTime
  updated_at: DateTime
}
```

### 3.6 room_analytics
```
{
  room_id: ObjectId (ref: meeting_rooms)
  date: Date (indexed)
  total_bookings: Number
  total_hours_booked: Number
  utilization_percentage: Number
  peak_hours: Array[Number]
  average_attendees: Number
  no_show_count: Number
  created_at: DateTime
}
```

---

## 4. ALL SCREENS/PAGES BY ROLE

### 4.1 Common (All Users)
1. **Login Page** (`/login`)
   - Email/password form
   - Role-based redirect after login

2. **Dashboard** (`/dashboard`)
   - Role-specific dashboard (different for Admin, Employee, Receptionist)

### 4.2 Admin Screens
3. **Admin Dashboard** (`/admin/dashboard`)
   - System overview stats
   - Today's bookings count
   - Active guests count
   - Room utilization chart
   - Recent activities

4. **User Management** (`/admin/users`)
   - List all users
   - Add/edit/delete users
   - Filter by role, department
   - Activate/deactivate users

5. **Meeting Room Management** (`/admin/rooms`)
   - List all rooms
   - Add/edit/delete rooms
   - Configure amenities
   - Upload room images

6. **Analytics & Reports** (`/admin/analytics`)
   - Room utilization trends
   - Booking patterns
   - Peak usage times
   - Department-wise usage
   - Predictive analytics (AI-powered forecasts)
   - Export reports

7. **All Bookings** (`/admin/bookings`)
   - View all bookings (past, present, future)
   - Filter by room, user, date
   - Override/cancel bookings

8. **Visitor Log** (`/admin/visitors`)
   - Complete visitor history
   - Filter by date, host, status
   - Export visitor logs

### 4.3 Employee Screens
9. **Employee Dashboard** (`/employee/dashboard`)
   - Upcoming meetings
   - Today's invited guests
   - Quick book button
   - AI assistant widget

10. **Book Meeting Room** (`/employee/book`)
    - Search available rooms
    - Filter by capacity, amenities, floor
    - Calendar view of availability
    - AI chatbot assistance
    - Add meeting details
    - Invite internal/external attendees

11. **My Bookings** (`/employee/bookings`)
    - View own bookings
    - Edit/cancel bookings
    - Add/remove attendees
    - View Google Calendar sync status

12. **Invite Guests** (`/employee/guests`)
    - Create guest invitation
    - Link to meeting booking
    - Guest details form
    - Expected arrival/departure

13. **AI Assistant** (`/employee/ai-chat`)
    - Full-screen chatbot interface
    - Smart room recommendations
    - Booking assistance
    - Answer queries about availability

### 4.4 Receptionist Screens
14. **Receptionist Dashboard** (`/receptionist/dashboard`)
    - Today's expected visitors
    - Currently checked-in guests
    - Real-time room occupancy
    - Quick check-in button

15. **Guest Check-In** (`/receptionist/check-in`)
    - Search guest by name/email/phone
    - Verify guest details
    - Capture photo (optional)
    - Assign visitor badge
    - Print badge
    - Mark as checked-in

16. **Guest Check-Out** (`/receptionist/check-out`)
    - List checked-in guests
    - Search and check-out
    - Record departure time

17. **Walk-In Visitors** (`/receptionist/walk-in`)
    - Register unscheduled visitors
    - Quick form
    - Assign host employee
    - Check-in immediately

18. **Today's Visitors** (`/receptionist/visitors`)
    - Daily visitor schedule
    - Filter by status, host, time
    - View meeting room assignments

19. **Room Status** (`/receptionist/rooms`)
    - Real-time room occupancy
    - Current bookings
    - Upcoming bookings

---

## 5. API ROUTES

### 5.1 Authentication
- `POST /api/auth/register` - Register new user (admin only)
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/profile` - Update profile

### 5.2 Users (Admin only)
- `GET /api/users` - List all users (with filters)
- `POST /api/users` - Create user
- `GET /api/users/:id` - Get user details
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `PATCH /api/users/:id/toggle-status` - Activate/deactivate

### 5.3 Meeting Rooms
- `GET /api/rooms` - List all rooms (with filters)
- `POST /api/rooms` - Create room (admin only)
- `GET /api/rooms/:id` - Get room details
- `PUT /api/rooms/:id` - Update room (admin only)
- `DELETE /api/rooms/:id` - Delete room (admin only)
- `GET /api/rooms/availability` - Check availability (date, time, capacity)

### 5.4 Bookings
- `GET /api/bookings` - List bookings (role-based access)
- `POST /api/bookings` - Create booking
- `GET /api/bookings/:id` - Get booking details
- `PUT /api/bookings/:id` - Update booking
- `DELETE /api/bookings/:id` - Cancel booking
- `GET /api/bookings/my-bookings` - Employee's own bookings
- `GET /api/bookings/conflicts` - Check booking conflicts

### 5.5 Guests/Visitors
- `GET /api/guests` - List guests (role-based access)
- `POST /api/guests` - Create guest invitation
- `GET /api/guests/:id` - Get guest details
- `PUT /api/guests/:id` - Update guest
- `DELETE /api/guests/:id` - Delete guest
- `POST /api/guests/:id/check-in` - Check-in guest (receptionist)
- `POST /api/guests/:id/check-out` - Check-out guest (receptionist)
- `GET /api/guests/today` - Today's visitors
- `GET /api/guests/expected` - Expected visitors

### 5.6 AI Assistant
- `POST /api/ai/chat` - Chat with AI assistant
- `POST /api/ai/recommend-room` - Get smart room recommendations
- `GET /api/ai/chat-history` - Get user's chat history

### 5.7 Analytics (Admin only)
- `GET /api/analytics/room-utilization` - Room utilization stats
- `GET /api/analytics/booking-trends` - Booking trends over time
- `GET /api/analytics/predictive` - AI-powered predictive analytics
- `GET /api/analytics/department-usage` - Department-wise usage
- `GET /api/analytics/visitor-stats` - Visitor statistics

### 5.8 Google Calendar Integration
- `POST /api/calendar/sync` - Sync booking to Google Calendar
- `DELETE /api/calendar/event/:id` - Remove calendar event
- `GET /api/calendar/auth-url` - Get Google OAuth URL
- `POST /api/calendar/callback` - Handle OAuth callback

### 5.9 Dashboard
- `GET /api/dashboard/admin` - Admin dashboard data
- `GET /api/dashboard/employee` - Employee dashboard data
- `GET /api/dashboard/receptionist` - Receptionist dashboard data

---

## 6. AUTHENTICATION FLOW

### 6.1 JWT-Based Authentication
1. User submits email/password to `/api/auth/login`
2. Backend validates credentials (bcrypt password comparison)
3. If valid, generate JWT token with payload: `{user_id, email, role, exp}`
4. Return token + user profile to frontend
5. Frontend stores token in localStorage
6. All subsequent requests include token in `Authorization: Bearer <token>` header
7. Backend middleware validates token and extracts user info
8. Role-based access control (RBAC) checks role before allowing access

### 6.2 Admin Seeding
- Create default admin account on first run
- Credentials stored in `/app/memory/test_credentials.md`

### 6.3 Protected Routes
- Frontend route guards check user role
- Backend middleware enforces role permissions
- Unauthorized access redirects to login or shows 403

---

## 7. AI FEATURES IMPLEMENTATION

### 7.1 AI Chatbot (Claude Sonnet 4.5)
**Purpose**: Assist employees in booking rooms, answering queries

**Capabilities**:
- Understand natural language requests: "Book a room for 10 people tomorrow at 2pm"
- Extract booking parameters (date, time, capacity, amenities)
- Suggest available rooms based on requirements
- Answer questions about room features, availability
- Guide through booking process
- Maintain conversation context

**Implementation**:
- Integration: Claude Sonnet 4.5 via Emergent LLM key
- Context: Include user's department, past booking preferences, available rooms
- Session management: Store chat history per user session
- Function calling: AI can trigger room search, availability checks

### 7.2 Smart Room Recommendations
**Purpose**: Suggest optimal rooms based on meeting requirements

**Algorithm**:
- Input: Meeting duration, attendee count, required amenities, department
- Scoring system:
  - Capacity match (exact > slightly over > under)
  - Amenity match (all required > partial)
  - Location (same floor as host's department preferred)
  - Historical preference (rooms user booked before)
  - Availability in requested time slot
- Output: Ranked list of top 3-5 room suggestions

**AI Enhancement**:
- Use Claude to analyze meeting title/description
- Infer required amenities (e.g., "client presentation" → projector needed)
- Suggest optimal duration based on meeting type

### 7.3 Predictive Analytics
**Purpose**: Forecast room utilization, identify trends

**Metrics**:
- Predict peak booking times for next week/month
- Identify underutilized rooms
- Forecast capacity needs
- Detect booking patterns (recurring meetings, seasonal trends)

**Implementation**:
- Collect historical booking data (room_analytics collection)
- Daily aggregation of bookings per room
- Use Claude to analyze trends and generate insights
- Visualize predictions on admin analytics dashboard

---

## 8. GOOGLE CALENDAR INTEGRATION

### 8.1 OAuth Flow
1. Admin configures Google Cloud project credentials
2. User initiates calendar sync from booking page
3. OAuth consent screen → user authorizes app
4. Store refresh token per user

### 8.2 Sync Functionality
- **Create Event**: When booking confirmed, create Google Calendar event
- **Update Event**: When booking modified, update calendar event
- **Delete Event**: When booking cancelled, remove calendar event
- **Bidirectional Sync**: Optionally, import user's calendar to check conflicts

### 8.3 Event Details
- Title: Meeting room booking title
- Description: Room name, attendees, purpose
- Location: Room name/code
- Attendees: Internal and external email addresses

---

## 9. KEY ASSUMPTIONS & DESIGN DECISIONS

### 9.1 Assumptions
1. **Single Location**: System manages rooms in one office building
2. **Time Slots**: 15-minute granularity for bookings
3. **Business Hours**: Default 8 AM - 6 PM (configurable by admin)
4. **Booking Lead Time**: Users can book up to 3 months in advance
5. **Badge System**: Physical visitor badges with numeric IDs
6. **No-Show Handling**: Manual marking by receptionist (no automatic detection)
7. **Visitor Access**: Guests don't have system login (managed by host employee)

### 9.2 Design Decisions
1. **Role-Based Access**: Three distinct roles with separate dashboards
2. **Real-Time Updates**: Use polling (5-second interval) for receptionist dashboard
3. **Conflict Prevention**: Database-level checks before booking confirmation
4. **AI Context Window**: Last 10 messages per chat session
5. **Analytics Calculation**: Daily cron job aggregates room usage data
6. **Guest Photos**: Optional (not mandatory for check-in)
7. **Mobile Responsive**: All screens optimized for tablet/mobile
8. **Dark/Light Mode**: Follow design agent's recommendation (likely light for corporate use)

### 9.3 Scalability Considerations
- Index MongoDB collections on frequently queried fields (date, room_id, user_id)
- Pagination for all list endpoints (default 20 items per page)
- Lazy loading for analytics charts
- Cache room availability queries (5-minute TTL)

---

## 10. FRONTEND ARCHITECTURE

### 10.1 Routing Structure
```
/login
/dashboard → redirects based on role
  /admin/dashboard
  /admin/users
  /admin/rooms
  /admin/bookings
  /admin/visitors
  /admin/analytics
  /employee/dashboard
  /employee/book
  /employee/bookings
  /employee/guests
  /employee/ai-chat
  /receptionist/dashboard
  /receptionist/check-in
  /receptionist/check-out
  /receptionist/walk-in
  /receptionist/visitors
  /receptionist/rooms
```

### 10.2 Key Components
- `<ProtectedRoute>` - Role-based route guard
- `<Sidebar>` - Role-specific navigation
- `<RoomCard>` - Display room with amenities
- `<BookingCalendar>` - Interactive calendar for availability
- `<GuestCheckInForm>` - Check-in workflow
- `<AIChat>` - Chatbot interface
- `<AnalyticsChart>` - Reusable chart component
- `<VisitorBadge>` - Printable badge layout

### 10.3 State Management
- User auth state: Context API + localStorage
- Booking form: Local component state
- Real-time data (receptionist): Polling with useEffect
- AI chat: Separate context for conversation history

---

## 11. BACKEND ARCHITECTURE

### 11.1 Project Structure
```
/app/backend/
  server.py                 # Main FastAPI app
  requirements.txt
  .env
  /models/
    user.py
    room.py
    booking.py
    guest.py
  /routes/
    auth.py
    users.py
    rooms.py
    bookings.py
    guests.py
    ai.py
    analytics.py
    calendar.py
    dashboard.py
  /middleware/
    auth_middleware.py      # JWT validation
    rbac.py                 # Role-based access control
  /services/
    ai_service.py           # Claude integration
    calendar_service.py     # Google Calendar API
    analytics_service.py    # Predictive analytics logic
  /utils/
    db.py                   # MongoDB connection
    password.py             # Bcrypt hashing
    validators.py
```

### 11.2 Middleware Stack
1. CORS middleware (allow frontend origin)
2. JWT authentication middleware
3. Role-based access control
4. Request logging
5. Error handling

---

## 12. DATABASE INDEXES

```
users:
  - email (unique)
  - role

meeting_rooms:
  - room_code (unique)
  - is_active

bookings:
  - room_id + start_time + end_time (compound, for conflict checking)
  - booked_by
  - status
  - start_time

guests:
  - visit_date
  - status
  - host_employee
  - email

room_analytics:
  - room_id + date (compound, unique)
```

---

## 13. DEVELOPMENT PHASES

### Phase 1: Foundation (Auth & Basic Setup)
- JWT authentication system
- User CRUD (admin only)
- Login/dashboard routing
- Role-based access control

### Phase 2: Meeting Room Management
- Room CRUD (admin)
- Room listing with filters
- Availability checking algorithm
- Basic booking creation (employee)

### Phase 3: Guest Management
- Guest invitation (employee)
- Check-in/check-out flow (receptionist)
- Walk-in visitor registration
- Today's visitors dashboard

### Phase 4: AI Integration
- Claude Sonnet 4.5 integration
- AI chatbot for booking assistance
- Smart room recommendations
- Chat history management

### Phase 5: Analytics & Predictions
- Room utilization tracking
- Booking trends visualization
- AI-powered predictive analytics
- Admin reports

### Phase 6: Google Calendar Integration
- OAuth setup
- Bidirectional calendar sync
- Event management

### Phase 7: Polish & Testing
- UI/UX refinements
- Comprehensive testing
- Performance optimization

---

## 14. THIRD-PARTY INTEGRATIONS NEEDED

### 14.1 Claude Sonnet 4.5 (AI)
- **Purpose**: Chatbot, recommendations, analytics
- **Authentication**: Emergent LLM key (no separate API key needed)
- **Endpoint**: Via emergentintegrations library
- **Action**: Call integration_playbook_expert_v2 during implementation

### 14.2 Google Calendar API
- **Purpose**: Sync bookings to user calendars
- **Authentication**: OAuth 2.0
- **Setup Required**: Google Cloud project, enable Calendar API, create OAuth credentials
- **Action**: Call integration_playbook_expert_v2 during implementation

### 14.3 Email Notifications (Deferred)
- **Purpose**: Booking confirmations, reminders
- **Status**: Skipped for now, can add later
- **Options**: Resend or SendGrid

---

## 15. TESTING STRATEGY

### 15.1 Backend Testing
- Test all API endpoints with curl
- Verify JWT authentication
- Test role-based access control
- Check booking conflict prevention
- Validate AI responses

### 15.2 Frontend Testing
- Screenshot testing for all screens
- Test role-specific routing
- Verify booking flow end-to-end
- Test guest check-in/check-out
- AI chatbot interaction testing

### 15.3 Integration Testing
- Google Calendar sync (create, update, delete events)
- AI chatbot with actual Claude API
- Cross-role workflows (employee books → receptionist checks in guest)

---

## 16. SECURITY CONSIDERATIONS

1. **Password Security**: Bcrypt hashing with salt
2. **JWT Tokens**: Short expiration (24 hours), secure secret key
3. **Role Validation**: Backend enforces permissions (never trust frontend)
4. **Input Sanitization**: Validate all user inputs
5. **API Rate Limiting**: Prevent abuse (future enhancement)
6. **HTTPS**: Production deployment uses SSL
7. **Environment Variables**: Never hardcode secrets

---

## 17. UI/UX APPROACH

- **Design System**: Follow design_agent guidelines (will be generated)
- **Color Scheme**: Professional corporate theme (blues, grays, whites)
- **Typography**: Clean, readable fonts (per design agent)
- **Responsiveness**: Mobile-first approach
- **Accessibility**: ARIA labels, keyboard navigation
- **Interactions**: Smooth transitions, loading states, error messages
- **Data Visualization**: Charts for analytics (Chart.js or Recharts)

---

## 18. SUCCESS METRICS

The system will be considered successful when:

1. ✅ All three roles can log in and access role-specific dashboards
2. ✅ Employees can book meeting rooms without conflicts
3. ✅ Receptionists can check in/out guests smoothly
4. ✅ Admin can view real-time analytics
5. ✅ AI chatbot provides helpful booking assistance
6. ✅ Google Calendar syncs bookings correctly
7. ✅ Smart room recommendations work accurately
8. ✅ Predictive analytics show meaningful insights
9. ✅ All screens are responsive and visually polished
10. ✅ No critical bugs in end-to-end testing

---

## END OF BUILD PLAN

**Next Steps**:
1. Review this plan and provide feedback
2. Approve to proceed with implementation
3. I'll call integration agents for Claude and Google Calendar
4. I'll call design agent for UI/UX guidelines
5. Start Phase 1 development

**Estimated Implementation**: Full MVP with all features across all 7 phases.
