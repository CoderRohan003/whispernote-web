"use client";
import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/app/app/context/AuthContext";
import { 
  getReminders, 
  toggleReminder, 
  deleteReminder, 
  updateReminderAfterTrigger,
  client,
  DB_ID,
  COLLECTION_ID
} from "@/app/app/lib/appwrite";
import VoiceInput from "@/app/components/VoiceInput";
import { Trash2, Bell, Clock, Calendar, Volume2, X } from "lucide-react";

interface Reminder {
  $id: string;
  title: string;
  triggerTime: string;
  isActive: boolean;
  repeat: string;
}

// Reminder: alarm.mp3 must be in the 'public' folder
const ALARM_SOUND_URL = "/alarm.mp3"; 

export default function Home() {
  // We rely on AuthContext to always provide a valid user object (the shared ID)
  const { user, loading: authLoading } = useAuth(); 
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentAlarm, setCurrentAlarm] = useState<Reminder | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const speechIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // --- 1. Fetch & Realtime ---
  const fetchReminders = async () => {
    if (!user || !user.$id) {
        console.log("[SYNC DEBUG] Skipping fetch: No user ID available yet.");
        return;
    }
    
    // DEBUG: Log User ID on fetch attempt
    console.log(`[SYNC DEBUG] Fetching reminders for User ID: ${user.$id}`);
    
    setLoading(true);
    try {
        const data = await getReminders(user.$id);
        console.log(`[SYNC DEBUG] Fetched ${data.length} reminders from Appwrite.`);
        
        const mapped = data.map((doc: any) => ({
        $id: doc.$id,
        title: doc.title,
        triggerTime: doc.triggerTime,
        isActive: doc.isActive,
        repeat: doc.repeat,
        }));
        setReminders(mapped);
    } catch (err) { 
        console.error(`[SYNC ERROR] Failed to fetch data:`, err); 
    } finally { 
        setLoading(false); 
    }
  };

  useEffect(() => {
    if (authLoading) {
        console.log("[SYNC DEBUG] Auth is still loading...");
        return;
    }
    if (!user) {
        console.log("[SYNC DEBUG] No user found after auth load.");
        return;
    }
    
    console.log("[SYNC DEBUG] Initializing Fetch & Realtime for:", user.$id);
    
    // Initial Fetch
    fetchReminders();

    // Realtime Subscription
    const channel = `databases.${DB_ID}.collections.${COLLECTION_ID}.documents`;
    console.log("[SYNC DEBUG] Subscribing to channel:", channel);

    const unsubscribe = client.subscribe(channel, (response) => {
        const eventType = response.events[0];
        const payload = response.payload as any;
        
        console.log(`[REALTIME EVENT] Type: ${eventType}`, payload);

        // Ensure only current user's documents update the state (i.e., the shared ID)
        if (payload.userId !== user.$id) {
            console.log(`[REALTIME IGNORED] User ID mismatch. Expected: ${user.$id}, Got: ${payload.userId}`);
            return;
        }

        console.log("[REALTIME MATCH] Updating local state...");

        if (eventType.includes("create")) {
            setReminders(prev => {
                // Prevent duplicate keys by filtering out if it already exists
                const exists = prev.some(r => r.$id === payload.$id);
                if (exists) return prev; 

                return [...prev, {
                    $id: payload.$id, title: payload.title, triggerTime: payload.triggerTime, 
                    isActive: payload.isActive, repeat: payload.repeat
                }].sort((a, b) => new Date(a.triggerTime).getTime() - new Date(b.triggerTime).getTime());
            });
        } 
        else if (eventType.includes("update")) {
            setReminders(prev => prev.map(r => r.$id === payload.$id ? {
                ...r, title: payload.title, triggerTime: payload.triggerTime, 
                isActive: payload.isActive, repeat: payload.repeat
            } : r));
        } 
        else if (eventType.includes("delete")) {
            setReminders(prev => prev.filter(r => r.$id !== payload.$id));
        }
    });

    return () => {
        console.log("[SYNC DEBUG] Unsubscribing from realtime.");
        unsubscribe();
    };
  }, [user, authLoading]);

  // --- 2. Alarm Logic ---

  const startAlarm = (reminder: Reminder) => {
    if (currentAlarm) return;
    setCurrentAlarm(reminder);
    
    // 1. Play Audio Loop
    if (audioRef.current) {
        audioRef.current.loop = true;
        audioRef.current.currentTime = 0;
        // NOTE: Browser often blocks audio/speech unless user interacted.
        audioRef.current.play().catch(e => console.warn("Autoplay blocked. User must click/speak once.", e));
    }

    // 2. Start Continuous Speech Loop
    startSpeakingLoop(reminder.title);
  };

  const startSpeakingLoop = (title: string) => {
    if (!('speechSynthesis' in window)) return;
    
    // Clear any previous loop attempt
    if (speechIntervalRef.current) {
        clearInterval(speechIntervalRef.current);
        speechIntervalRef.current = null;
    }

    const speak = () => {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(`Reminder: ${title}`);
      window.speechSynthesis.speak(utterance);
    };

    speak(); // Initial speak attempt

    // Repeat every 4 seconds until stopAlarm is called
    speechIntervalRef.current = setInterval(() => {
       speak();
    }, 4000);
  };

  const stopAlarm = async () => {
    if (!currentAlarm) return;
    const reminderToUpdate = currentAlarm;

    // 1. Stop Noise
    if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
    }
    // Clear interval and reference
    if (speechIntervalRef.current) {
        clearInterval(speechIntervalRef.current);
        speechIntervalRef.current = null;
    }
    window.speechSynthesis.cancel();
    setCurrentAlarm(null); // Clear state, closing the modal

    // 2. Reschedule Logic
    const nextTriggerTime = new Date(reminderToUpdate.triggerTime);
    let shouldBeActive = true;

    if (reminderToUpdate.repeat === 'daily' || reminderToUpdate.repeat === 'indefinite') {
        nextTriggerTime.setDate(nextTriggerTime.getDate() + 1);
        shouldBeActive = true;
    } else if (reminderToUpdate.repeat === 'weekly') {
        nextTriggerTime.setDate(nextTriggerTime.getDate() + 7);
        shouldBeActive = true;
    } else {
        shouldBeActive = false; // 'once' reminders turn off
    }

    // 3. Update Backend (Realtime will handle the list update across devices)
    await updateReminderAfterTrigger(reminderToUpdate.$id, nextTriggerTime.toISOString(), shouldBeActive);
  };

  // Check Schedule every 15s
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      const now = new Date();
      reminders.forEach(reminder => {
        // Prevent triggering if inactive OR if ALREADY ringing (currentAlarm check)
        if (!reminder.isActive || currentAlarm) return;

        const trigger = new Date(reminder.triggerTime);
        const isTriggerTime = 
          now.getHours() === trigger.getHours() && 
          now.getMinutes() === trigger.getMinutes() &&
          now.getDate() === trigger.getDate() && 
          Math.abs(now.getTime() - trigger.getTime()) < 60000; 

        if (isTriggerTime) {
          startAlarm(reminder);
        }
      });
    }, 15000);
    return () => clearInterval(interval);
  }, [user, reminders, currentAlarm]);


  // --- UI Actions ---
  const handleToggle = async (id: string, currentStatus: boolean) => {
    await toggleReminder(id, currentStatus);
  };

  const handleDelete = async (id: string) => {
    console.log(`Deleting reminder: ${id}`); 
    await deleteReminder(id);
  };

  if (authLoading) return <div className="p-10 text-white">Loading...</div>;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-8 font-sans relative">
      
      {/* Hidden Audio Element (Set to loop) */}
      <audio ref={audioRef} src={ALARM_SOUND_URL} loop />

      {/* ALARM OVERLAY MODAL */}
      {currentAlarm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in">
            <div className="bg-slate-900 border border-red-500/50 p-8 rounded-3xl w-full max-w-md text-center shadow-2xl shadow-red-900/50">
                <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                    <Bell className="w-10 h-10 text-red-500" />
                </div>
                <h2 className="text-sm font-bold text-red-400 tracking-widest mb-2">REMINDER</h2>
                <h1 className="text-3xl font-bold text-white mb-8">{currentAlarm.title}</h1>
                
                <button 
                    onClick={stopAlarm}
                    className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-4 rounded-xl transition-all active:scale-95"
                >
                    Turn Off Alarm
                </button>
            </div>
        </div>
      )}

      <div className="max-w-xl mx-auto space-y-8">
        <header className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-purple-400 bg-clip-text">
            WhisperNote
          </h1>
          {/* Display User ID for sync assurance */}
          {user && (
            <span className="text-xs bg-slate-800 px-3 py-1 rounded-full text-slate-400" title={`Shared ID: ${user.$id}`}>
              Shared Account
            </span>
          )}
        </header>

        {user && <VoiceInput onReminderAdded={() => {}} />} 

        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-400 flex items-center gap-2">
            <Calendar className="w-5 h-5" /> Your Reminders
          </h2>

          {loading && reminders.length === 0 ? (
            <p className="text-center text-slate-500 py-10">Syncing...</p>
          ) : reminders.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-slate-800 rounded-xl">
              <p className="text-slate-500">No reminders.</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {reminders.map((reminder) => {
                const dateObj = new Date(reminder.triggerTime);
                const repeatDisplay = reminder.repeat === 'indefinite' ? 'Until Off' : reminder.repeat;

                return (
                  <div key={reminder.$id} className={`relative group flex items-center justify-between p-4 rounded-xl border transition-all ${reminder.isActive ? "bg-slate-900 border-slate-700" : "bg-slate-900/50 border-slate-800 opacity-60"}`}>
                    <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-full ${reminder.isActive ? 'bg-blue-500/10 text-blue-400' : 'bg-slate-700/20 text-slate-600'}`}>
                            <Bell className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className={`font-medium ${reminder.isActive ? 'text-white' : 'text-slate-500 line-through'}`}>
                                {reminder.title}
                            </h3>
                            <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                                <Clock className="w-3 h-3" />
                                <span>{dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                <span className="text-slate-600">|</span>
                                <span>{dateObj.toLocaleDateString()}</span>
                                {reminder.repeat !== 'once' && <span className="text-blue-400 font-bold capitalize">({repeatDisplay})</span>}
                                {reminder.isActive && (
                                    <div title="Alarm Active">
                                        <Volume2 className="w-3 h-3 ml-2 text-green-400" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button onClick={() => handleToggle(reminder.$id, reminder.isActive)} className={`w-10 h-6 rounded-full flex items-center p-1 transition-colors ${reminder.isActive ? 'bg-blue-600' : 'bg-slate-700'}`}>
                            <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${reminder.isActive ? 'translate-x-4' : 'translate-x-0'}`} />
                        </button>
                        <button onClick={() => handleDelete(reminder.$id)} className="text-slate-600 hover:text-red-400 transition-colors">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}