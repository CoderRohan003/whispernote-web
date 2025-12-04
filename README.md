Here is your **final, polished, optimized, complete `README.md`** — including the banner, text logo, folder structure, original sections, and everything merged beautifully.

You can **copy–paste this entire file directly into GitHub**.

---

# README.md

```md
<p align="center">
  <img src="https://dummyimage.com/1200x300/1e1e2e/ffffff&text=WhisperNote+%E2%80%93+Your+Voice,+Remembered" alt="WhisperNote Banner"/>
</p>

<h1 align="center">WhisperNote 🎙️🔔</h1>

<p align="center">
  Your Voice, Remembered — Across Web & Mobile.
</p>

---

# 🌟 Overview

**WhisperNote** is a **cross-platform, voice-controlled reminder application** that syncs effortlessly between your web browser and mobile device.  
Speak naturally — WhisperNote takes care of the scheduling, alarms, notifications, and syncing.

---

# ✨ Features

### 🗣️ Natural Language Voice Input  
Simply say things like:
- “Remind me to check emails every day at 9 AM.”
- “Wake me up in 20 minutes.”

### 🔄 Cross-Platform Sync (Web + Mobile)  
Create a reminder on your phone → instantly appears on your laptop  
Powered by **Appwrite Realtime**.

### 🔁 Smart Recurring Reminders  
Supports:
- Daily  
- Weekly  
- Custom patterns  
- **Indefinite reminders** that keep repeating until you manually turn them off  

### ⏰ Intelligent Auto-Scheduling  
Times in the past are automatically moved to the next valid slot.

### 🔊 Alarm + Text-to-Speech  
WhisperNote plays a custom alarm and then speaks the reminder aloud.

### 📱 Background Notifications (Mobile)  
Reminders fire reliably even if the app is closed.

### 📜 Reminder History  
A log of your completed or past reminders.

---

# 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Web Frontend** | Next.js 14, Tailwind CSS, TypeScript |
| **Mobile Frontend** | React Native (Expo), NativeWind |
| **Backend** | Appwrite (DB, Realtime, Auth) |
| **Voice Processing** | Web Speech API / Expo Speech |
| **State Management** | React Context API |

---

# 📂 Folder Structure

```

whispernote-web/
│
├── public/
│   ├── alarm.mp3
│   └── icons/               # App icons & favicons
│
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── reminders/       # Reminder-related routes
│   │
│   ├── components/
│   │   ├── ui/              # Buttons, modals, inputs
│   │   ├── reminders/       # Reminder cards, forms, lists
│   │   └── voice/           # Voice input and transcription UI
│   │
│   ├── context/
│   │   └── ReminderContext.tsx
│   │
│   ├── lib/
│   │   ├── appwrite.ts      # Appwrite SDK config
│   │   ├── schedule.ts      # Time parser + smarter scheduling logic
│   │   └── voice.ts         # Speech recognition utilities
│   │
│   ├── hooks/
│   │   └── useRealtime.ts   # Appwrite realtime syncing
│   │
│   ├── styles/
│   │   └── globals.css
│   │
│   └── types/
│       └── reminder.ts      # Type definitions
│
├── .env.local
├── package.json
└── README.md

````

---

# 🚀 Getting Started (Web Version)

## 🔧 Prerequisites
- **Node.js 18+**
- **Appwrite Cloud account**

---

## 🛠️ Installation

### 1️⃣ Clone the Repo
```bash
git clone https://github.com/your-username/whispernote-web.git
cd whispernote-web
````

### 2️⃣ Install Dependencies

```bash
npm install
```

### 3️⃣ Add Environment Variables

Create **`.env.local`**:

```
NEXT_PUBLIC_APPWRITE_ENDPOINT="https://cloud.appwrite.io/v1"
NEXT_PUBLIC_APPWRITE_PROJECT_ID="your_project_id"
NEXT_PUBLIC_APPWRITE_DB_ID="your_database_id"
NEXT_PUBLIC_APPWRITE_COLLECTION_ID="your_collection_id"
```

### 4️⃣ Add Your Alarm Sound

Copy your `alarm.mp3` into:

```
/public
```

### 5️⃣ Run the Dev Server

```bash
npm run dev
```

Now open:

```
http://localhost:3000
```

---

# 📱 Mobile App

Mobile version repo:


### 🔁 Shared Anonymous Sync Note

To sync reminders across devices, both apps must use the same fallback ID:

```
FALLBACK_USER_ID=shared_value_here
```

(Or whatever your own shared anonymous ID logic uses.)


# 🙌 Thanks for Using WhisperNote!

