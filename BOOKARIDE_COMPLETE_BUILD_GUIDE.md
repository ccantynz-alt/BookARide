# BookaRide NZ - Complete Build Documentation
## Admin Panel & Booking System - Identical Recreation Guide

---

# PART 1: DESIGN SYSTEM

## 1.1 Color Palette

### Primary Colors
```css
/* Gold - Primary Brand Color */
--gold: #D4AF37;
--gold-hover: rgba(212, 175, 55, 0.9);  /* gold/90 */
--gold-light: rgba(212, 175, 55, 0.2);  /* gold/20 */
--gold-muted: rgba(212, 175, 55, 0.6);  /* gold/60 */

/* Dark Theme */
--black: #000000;
--gray-900: #111827;
--gray-800: #1f2937;
--gray-700: #374151;
--gray-600: #4b5563;
--gray-500: #6b7280;
--gray-400: #9ca3af;
--gray-300: #d1d5db;
--gray-200: #e5e7eb;
--gray-100: #f3f4f6;
--gray-50: #f9fafb;
--white: #ffffff;

/* Status Colors */
--green-600: #16a34a;  /* Confirmed/Active */
--green-100: #dcfce7;
--yellow-600: #ca8a04; /* Pending */
--yellow-100: #fef9c3;
--red-600: #dc2626;    /* Cancelled/Error */
--red-100: #fee2e2;
--blue-600: #2563eb;   /* Completed/Info */
--blue-100: #dbeafe;
```

### Tailwind Config (tailwind.config.js)
```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        gold: '#D4AF37',
      },
    },
  },
}
```

---

## 1.2 Typography

### Font Family
```css
font-family: 'Segoe UI', Arial, sans-serif;
```

### Font Sizes
```css
/* Headings */
.text-4xl { font-size: 2.25rem; }  /* Page titles */
.text-3xl { font-size: 1.875rem; } /* Stat numbers */
.text-2xl { font-size: 1.5rem; }   /* Section titles */
.text-xl { font-size: 1.25rem; }   /* Card titles */
.text-lg { font-size: 1.125rem; }  /* Subheadings */

/* Body */
.text-base { font-size: 1rem; }    /* Normal text */
.text-sm { font-size: 0.875rem; }  /* Secondary text */
.text-xs { font-size: 0.75rem; }   /* Captions */
```

### Font Weights
```css
.font-bold { font-weight: 700; }
.font-semibold { font-weight: 600; }
.font-medium { font-weight: 500; }
.font-normal { font-weight: 400; }
```

---

## 1.3 Buttons

### Primary Button (Gold)
```jsx
<Button className="bg-gold hover:bg-gold/90 text-black font-semibold">
  Button Text
</Button>
```
```css
background: #D4AF37;
color: #000000;
font-weight: 600;
padding: 0.5rem 1rem;
border-radius: 0.375rem;
transition: background 150ms;
```

### Outline Button (Gold Border)
```jsx
<Button variant="outline" className="border-gold text-gold hover:bg-gold hover:text-black">
  Button Text
</Button>
```
```css
background: transparent;
border: 1px solid #D4AF37;
color: #D4AF37;
/* On hover */
background: #D4AF37;
color: #000000;
```

### Outline Button (Green - Driver Portal)
```jsx
<Button variant="outline" className="border-green-500 text-green-500 hover:bg-green-500 hover:text-white">
  Driver Portal
</Button>
```

### Outline Button (Blue - Facebook)
```jsx
<Button variant="outline" className="border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white">
  Facebook Strategy
</Button>
```

### Destructive Button (Red)
```jsx
<Button variant="destructive" className="bg-red-600 hover:bg-red-700">
  Delete
</Button>
```

### Ghost Button
```jsx
<Button variant="ghost" className="text-gray-600 hover:text-gray-800">
  Cancel
</Button>
```

---

## 1.4 Cards

### Standard Card
```jsx
<Card>
  <CardContent className="p-6">
    Content here
  </CardContent>
</Card>
```
```css
background: #ffffff;
border: 1px solid #e5e7eb;
border-radius: 0.5rem;
box-shadow: 0 1px 3px rgba(0,0,0,0.1);
```

### Gold Stats Card
```jsx
<Card className="bg-gold border-none">
  <CardContent className="p-6">
    <p className="text-sm text-white/80 mb-1">Label</p>
    <p className="text-3xl font-bold text-white">123</p>
  </CardContent>
</Card>
```

### Dark Card (for modals/dark sections)
```jsx
<Card className="bg-gray-800 border-gray-700">
  <CardContent className="p-4">
    <p className="text-white">Content</p>
  </CardContent>
</Card>
```

---

## 1.5 Status Badges

```jsx
// Confirmed - Green
<span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-600">
  CONFIRMED
</span>

// Pending - Yellow
<span className="px-3 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-600">
  PENDING
</span>

// Cancelled - Red
<span className="px-3 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-600">
  CANCELLED
</span>

// Completed - Blue
<span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-600">
  COMPLETED
</span>
```

---

## 1.6 Form Inputs

### Standard Input
```jsx
<Input
  placeholder="Enter text..."
  className="mt-1"
/>
```
```css
background: #ffffff;
border: 1px solid #d1d5db;
border-radius: 0.375rem;
padding: 0.5rem 0.75rem;
font-size: 0.875rem;
/* Focus state */
border-color: #D4AF37;
outline: none;
ring: 2px solid rgba(212, 175, 55, 0.2);
```

### Search Input with Icon
```jsx
<div className="relative">
  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
  <Input
    placeholder="Search..."
    className="pl-10"
  />
</div>
```

### Select Dropdown
```jsx
<Select value={value} onValueChange={setValue}>
  <SelectTrigger className="w-[180px]">
    <SelectValue placeholder="Select option" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Option 1</SelectItem>
    <SelectItem value="option2">Option 2</SelectItem>
  </SelectContent>
</Select>
```

---

# PART 2: ADMIN PANEL LAYOUT

## 2.1 Page Structure

```
┌─────────────────────────────────────────────────────────────┐
│                      NAVBAR (pt-20)                          │
├─────────────────────────────────────────────────────────────┤
│  HEADER - Dark gradient with title and action buttons        │
│  bg-gradient-to-br from-gray-900 via-black to-gray-900      │
├─────────────────────────────────────────────────────────────┤
│  BREADCRUMB - Gold bar with white text                       │
│  bg-gold px-4 py-3 rounded-lg                               │
├─────────────────────────────────────────────────────────────┤
│  TABS - Navigation tabs                                      │
│  [Bookings] [Analytics] [Customers] [Drivers] [Apps] [Mktg] │
├─────────────────────────────────────────────────────────────┤
│  CONTENT AREA                                                │
│  ┌──────────┬──────────┬──────────┬──────────┐              │
│  │  STAT    │  STAT    │  STAT    │  STAT    │              │
│  │  CARD    │  CARD    │  CARD    │  CARD    │              │
│  │  (Gold)  │  (Gold)  │  (Gold)  │  (Gold)  │              │
│  └──────────┴──────────┴──────────┴──────────┘              │
│                                                              │
│  ┌──────────────────────────────────────────────┐           │
│  │  FILTERS / SEARCH BAR                         │           │
│  └──────────────────────────────────────────────┘           │
│                                                              │
│  ┌──────────────────────────────────────────────┐           │
│  │  DATA TABLE / LIST                            │           │
│  │  - Row 1                                      │           │
│  │  - Row 2                                      │           │
│  │  - Row 3                                      │           │
│  └──────────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────────┘
```

---

## 2.2 Header Section

```jsx
<div className="bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white py-8">
  <div className="container mx-auto px-4">
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-white/70">Manage bookings and customer communications</p>
        <p className="text-white/50 text-xs mt-1">v2024.12.08</p>
      </div>
      <div className="flex gap-2">
        {/* Action Buttons */}
        <Button variant="outline" className="border-green-500 text-green-500 hover:bg-green-500 hover:text-white">
          <Users className="w-4 h-4 mr-2" />
          Driver Portal
        </Button>
        <Button variant="outline" className="border-gold text-gold hover:bg-gold hover:text-black">
          <Settings className="w-4 h-4 mr-2" />
          SEO Management
        </Button>
        <Button variant="outline" className="border-gold text-gold hover:bg-gold hover:text-black">
          Change Password
        </Button>
        <Button variant="outline" className="border-gold text-gold hover:bg-gold hover:text-black">
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>
    </div>
  </div>
</div>
```

---

## 2.3 Breadcrumb Component

```jsx
<nav className="flex items-center space-x-2 text-sm mb-6 bg-gold px-4 py-3 rounded-lg">
  <a href="/admin" className="flex items-center text-white hover:text-white/80 transition-colors">
    <Home className="w-4 h-4" />
    <span className="ml-1">Admin</span>
  </a>
  
  <ChevronRight className="w-4 h-4 text-white/70" />
  
  <span className="flex items-center text-white font-medium">
    <BookOpen className="w-4 h-4 mr-1" />
    Bookings
  </span>
</nav>
```

---

## 2.4 Tabs Navigation

```jsx
<Tabs defaultValue="bookings" className="w-full">
  <TabsList className="grid w-full grid-cols-6 mb-8">
    <TabsTrigger value="bookings" className="flex items-center gap-2">
      <BookOpen className="w-4 h-4" />
      Bookings
    </TabsTrigger>
    <TabsTrigger value="analytics" className="flex items-center gap-2">
      <BarChart3 className="w-4 h-4" />
      Analytics
    </TabsTrigger>
    <TabsTrigger value="customers" className="flex items-center gap-2">
      <Users className="w-4 h-4" />
      Customers
    </TabsTrigger>
    <TabsTrigger value="drivers" className="flex items-center gap-2">
      <Users className="w-4 h-4" />
      Drivers
    </TabsTrigger>
    <TabsTrigger value="applications" className="flex items-center gap-2">
      <FileText className="w-4 h-4" />
      Applications
    </TabsTrigger>
    <TabsTrigger value="marketing" className="flex items-center gap-2">
      <Globe className="w-4 h-4" />
      Marketing
    </TabsTrigger>
  </TabsList>
  
  <TabsContent value="bookings">
    {/* Bookings content */}
  </TabsContent>
</Tabs>
```

---

## 2.5 Stats Cards Row

```jsx
<div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
  {/* Total Bookings */}
  <Card className="bg-gold border-none">
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-white/80 mb-1">Total Bookings</p>
          <p className="text-3xl font-bold text-white">156</p>
        </div>
        <BookOpen className="w-10 h-10 text-white/60" />
      </div>
    </CardContent>
  </Card>
  
  {/* Pending */}
  <Card className="bg-gold border-none">
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-white/80 mb-1">Pending</p>
          <p className="text-3xl font-bold text-white">12</p>
        </div>
        <Clock className="w-10 h-10 text-white/60" />
      </div>
    </CardContent>
  </Card>
  
  {/* Confirmed */}
  <Card className="bg-gold border-none">
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-white/80 mb-1">Confirmed</p>
          <p className="text-3xl font-bold text-white">98</p>
        </div>
        <CheckCircle className="w-10 h-10 text-white/60" />
      </div>
    </CardContent>
  </Card>
  
  {/* Revenue */}
  <Card className="bg-gold border-none">
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-white/80 mb-1">Total Revenue</p>
          <p className="text-3xl font-bold text-white">$24,580.00</p>
        </div>
        <DollarSign className="w-10 h-10 text-white/60" />
      </div>
    </CardContent>
  </Card>
</div>
```

---

## 2.6 Filter/Search Bar

```jsx
<Card className="mb-6">
  <CardContent className="p-6">
    <div className="flex flex-col md:flex-row gap-4">
      {/* Search Input */}
      <div className="flex-1">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            placeholder="Search by name, email, phone, or address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>
      
      {/* Status Filter */}
      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger className="w-[180px]">
          <Filter className="w-4 h-4 mr-2" />
          <SelectValue placeholder="All Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="confirmed">Confirmed</SelectItem>
          <SelectItem value="completed">Completed</SelectItem>
          <SelectItem value="cancelled">Cancelled</SelectItem>
        </SelectContent>
      </Select>
      
      {/* Action Buttons */}
      <Button variant="outline" className="border-gold text-gold hover:bg-gold hover:text-black">
        Export CSV
      </Button>
      <Button variant="outline" className="border-gold text-gold hover:bg-gold hover:text-black">
        <Bell className="w-4 h-4 mr-2" />
        Send Reminders
      </Button>
      <Button className="bg-gold hover:bg-gold/90 text-black font-semibold">
        + Create Booking
      </Button>
    </div>
  </CardContent>
</Card>
```

---

## 2.7 Data Table

```jsx
<Card>
  <CardContent className="p-0">
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-50 border-b">
            <th className="text-left p-4 text-sm font-semibold text-gray-600">
              <input type="checkbox" /> {/* Select all */}
            </th>
            <th className="text-left p-4 text-sm font-semibold text-gray-600">Ref</th>
            <th className="text-left p-4 text-sm font-semibold text-gray-600">Customer</th>
            <th className="text-left p-4 text-sm font-semibold text-gray-600">Route</th>
            <th className="text-left p-4 text-sm font-semibold text-gray-600">Date/Time</th>
            <th className="text-left p-4 text-sm font-semibold text-gray-600">Status</th>
            <th className="text-left p-4 text-sm font-semibold text-gray-600">Driver</th>
            <th className="text-left p-4 text-sm font-semibold text-gray-600">Price</th>
            <th className="text-left p-4 text-sm font-semibold text-gray-600">Actions</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((booking) => (
            <tr key={booking.id} className="border-b hover:bg-gray-50">
              <td className="p-4">
                <input type="checkbox" />
              </td>
              <td className="p-4 font-mono text-sm">{booking.booking_ref}</td>
              <td className="p-4">
                <div>
                  <p className="font-medium">{booking.name}</p>
                  <p className="text-sm text-gray-500">{booking.email}</p>
                </div>
              </td>
              <td className="p-4">
                <div className="text-sm">
                  <p className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-green-500" />
                    {booking.pickupAddress}
                  </p>
                  <p className="flex items-center gap-1 text-gray-500">
                    <MapPin className="w-3 h-3 text-red-500" />
                    {booking.dropoffAddress}
                  </p>
                </div>
              </td>
              <td className="p-4">
                <p className="font-medium">{booking.date}</p>
                <p className="text-sm text-gray-500">{booking.time}</p>
              </td>
              <td className="p-4">
                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                  {booking.status.toUpperCase()}
                </span>
              </td>
              <td className="p-4">
                {booking.driver_name || (
                  <Button size="sm" variant="outline" className="text-xs">
                    Assign
                  </Button>
                )}
              </td>
              <td className="p-4 font-semibold text-gold">
                ${booking.totalPrice.toFixed(2)}
              </td>
              <td className="p-4">
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost">
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost">
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost" className="text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </CardContent>
</Card>
```

---

# PART 3: BOOKING FORM (Customer Facing)

## 3.1 Book Now Page Layout

```
┌─────────────────────────────────────────────────────────────┐
│  HERO SECTION - Dark gradient                                │
│  "Book Your Airport Transfer"                               │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐    │
│  │  BOOKING FORM CARD                                   │    │
│  │  ┌─────────────────────────────────────────────────┐│    │
│  │  │ Pickup Address (Google Autocomplete)            ││    │
│  │  └─────────────────────────────────────────────────┘│    │
│  │  ┌─────────────────────────────────────────────────┐│    │
│  │  │ Dropoff Address (Google Autocomplete)           ││    │
│  │  └─────────────────────────────────────────────────┘│    │
│  │  [+ Add Stop]                                        │    │
│  │                                                      │    │
│  │  ┌──────────────┐  ┌──────────────┐                 │    │
│  │  │ Date Picker  │  │ Time Picker  │                 │    │
│  │  └──────────────┘  └──────────────┘                 │    │
│  │                                                      │    │
│  │  ┌──────────────┐  ┌──────────────┐                 │    │
│  │  │ Passengers   │  │ Luggage      │                 │    │
│  │  └──────────────┘  └──────────────┘                 │    │
│  │                                                      │    │
│  │  ☐ Book Return Trip                                  │    │
│  │                                                      │    │
│  │  ┌─────────────────────────────────────────────────┐│    │
│  │  │ PRICE DISPLAY                                    ││    │
│  │  │ Total: $XXX.XX NZD                     [GOLD]   ││    │
│  │  └─────────────────────────────────────────────────┘│    │
│  │                                                      │    │
│  │  [        Get Quote / Continue Button        ]       │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

---

## 3.2 Price Display Component

```jsx
<div className="bg-gradient-to-r from-gold to-gold/80 rounded-lg p-6 text-center">
  <p className="text-white/80 text-sm mb-1">Estimated Total</p>
  <p className="text-4xl font-bold text-white">${totalPrice.toFixed(2)}</p>
  <p className="text-white/60 text-xs mt-1">NZD</p>
</div>
```

---

# PART 4: MODALS

## 4.1 View Booking Modal

```jsx
<Dialog open={showModal} onOpenChange={setShowModal}>
  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle className="text-xl">Booking Details</DialogTitle>
    </DialogHeader>
    
    <div className="space-y-6">
      {/* Booking Reference */}
      <div className="bg-gold/10 p-4 rounded-lg">
        <p className="text-sm text-gray-600">Reference Number</p>
        <p className="text-2xl font-bold text-gold">{booking.booking_ref}</p>
      </div>
      
      {/* Customer Info */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-gray-500">Customer Name</Label>
          <p className="font-medium">{booking.name}</p>
        </div>
        <div>
          <Label className="text-gray-500">Email</Label>
          <p className="font-medium">{booking.email}</p>
        </div>
        <div>
          <Label className="text-gray-500">Phone</Label>
          <p className="font-medium">{booking.phone}</p>
        </div>
        <div>
          <Label className="text-gray-500">Status</Label>
          <Badge className={getStatusColor(booking.status)}>
            {booking.status.toUpperCase()}
          </Badge>
        </div>
      </div>
      
      {/* Trip Details */}
      <div className="border-t pt-4">
        <h3 className="font-semibold mb-3">Trip Details</h3>
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-green-500 mt-1" />
            <div>
              <p className="text-sm text-gray-500">Pickup</p>
              <p>{booking.pickupAddress}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-red-500 mt-1" />
            <div>
              <p className="text-sm text-gray-500">Dropoff</p>
              <p>{booking.dropoffAddress}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline" onClick={() => setShowModal(false)}>
          Close
        </Button>
        <Button className="bg-gold hover:bg-gold/90 text-black">
          Edit Booking
        </Button>
      </div>
    </div>
  </DialogContent>
</Dialog>
```

---

## 4.2 Assign Driver Modal

```jsx
<Dialog open={showAssignModal} onOpenChange={setShowAssignModal}>
  <DialogContent className="max-w-md">
    <DialogHeader>
      <DialogTitle>Assign Driver</DialogTitle>
    </DialogHeader>
    
    <div className="space-y-4 pt-4">
      <div className="p-3 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600">Booking Reference</p>
        <p className="font-bold">{booking.booking_ref}</p>
      </div>
      
      <div>
        <Label>Select Driver</Label>
        <Select value={selectedDriver} onValueChange={setSelectedDriver}>
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Choose a driver..." />
          </SelectTrigger>
          <SelectContent>
            {drivers.map(driver => (
              <SelectItem key={driver.id} value={driver.id}>
                {driver.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={() => setShowAssignModal(false)}>
          Cancel
        </Button>
        <Button 
          onClick={handleAssign}
          className="bg-gold hover:bg-gold/90 text-black"
        >
          Assign Driver
        </Button>
      </div>
    </div>
  </DialogContent>
</Dialog>
```

---

# PART 5: ICONS (Lucide React)

## Required Icons Import
```jsx
import { 
  // Navigation
  Home, ChevronRight, LogOut, Settings, Menu,
  
  // Actions
  Search, Filter, Eye, Edit2, Trash2, Plus, RefreshCw, Send,
  
  // Status
  CheckCircle, XCircle, Clock, AlertCircle,
  
  // Business
  BookOpen, Users, Car, Calendar, MapPin, Phone, Mail,
  DollarSign, CreditCard, BarChart3, TrendingUp,
  
  // Social
  Facebook, Globe,
  
  // UI
  Bell, FileText, Key, Square, CheckSquare
} from 'lucide-react';
```

---

# PART 6: RESPONSIVE BREAKPOINTS

```css
/* Mobile first approach */
sm: 640px   /* Small screens */
md: 768px   /* Medium screens (tablets) */
lg: 1024px  /* Large screens (laptops) */
xl: 1280px  /* Extra large screens (desktops) */
2xl: 1536px /* 2X large screens */
```

### Common Responsive Patterns
```jsx
// Grid columns
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"

// Flex direction
className="flex flex-col md:flex-row gap-4"

// Hidden on mobile
className="hidden md:block"

// Text sizes
className="text-2xl md:text-3xl lg:text-4xl"
```

---

# PART 7: SHADCN UI COMPONENTS USED

Install these components:
```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add input
npx shadcn-ui@latest add label
npx shadcn-ui@latest add select
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add textarea
npx shadcn-ui@latest add checkbox
npx shadcn-ui@latest add toast
```

---

# PART 8: TOAST NOTIFICATIONS

```jsx
import { toast } from 'sonner';

// Success
toast.success('Booking saved successfully!');

// Error
toast.error('Failed to save booking');

// Loading
toast.loading('Processing...');

// Dismiss
toast.dismiss();
```

---

*Complete Build Documentation - BookaRide NZ - December 2025*
