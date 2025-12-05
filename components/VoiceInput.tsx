"use client";
import { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { parseVoiceCommand } from "@/app/app/lib/timeParser";
import { addReminder } from "@/app/app/lib/appwrite";
import { useAuth } from "@/app/app/context/AuthContext";

export default function VoiceInput({ onReminderAdded }: { onReminderAdded: () => void }) {
    const { user } = useAuth();
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [processing, setProcessing] = useState(false);
    const [feedback, setFeedback] = useState("");

    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        if (typeof window !== "undefined") {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            if (SpeechRecognition) {
                const recognition = new SpeechRecognition();
                recognition.continuous = false;
                recognition.interimResults = true;
                recognition.lang = "en-US";

                recognition.onresult = (event: any) => {
                    let interimTranscript = "";
                    let finalTranscript = "";

                    for (let i = event.resultIndex; i < event.results.length; ++i) {
                        if (event.results[i].isFinal) {
                            finalTranscript += event.results[i][0].transcript;
                            handleCommand(finalTranscript);
                        } else {
                            interimTranscript += event.results[i][0].transcript;
                        }
                    }
                    setTranscript(finalTranscript || interimTranscript);
                };

                recognition.onerror = (event: any) => {
                    console.error("Speech Error:", event.error);
                    setIsListening(false);
                    setFeedback("Microphone Error.");
                };

                recognition.onend = () => setIsListening(false);
                recognitionRef.current = recognition;
            }
        }
    }, []);

    const startListening = () => {
        if (!recognitionRef.current) {
            setFeedback("Use Chrome browser.");
            return;
        }
        if (!user) {
            setFeedback("Login First");
            return;
        }
        setFeedback("Listening...");
        setTranscript("");
        setIsListening(true);
        recognitionRef.current.start();
    };

    const stopListening = () => {
        if (recognitionRef.current) recognitionRef.current.stop();
        setIsListening(false);
    };

    const handleCommand = async (text: string) => {
        if (!text.trim()) return;
        stopListening();
        setProcessing(true);
        setTranscript(text);

        const { title, date, repeat } = parseVoiceCommand(text);

        if (!title) {
            setFeedback("No title heard.");
            setProcessing(false);
            return;
        }

        setFeedback(`Saving "${title}" (${repeat})...`);

        try {
            if (!user) throw new Error("User not found");
            // Pass the repeat type from the parser
            await addReminder(user.$id, title, date.toISOString(), repeat);
            setFeedback("Reminder Set! ✅");
            onReminderAdded();
        } catch (error: any) {
            console.error("Save Error:", error);
            setFeedback("Error saving.");
        } finally {
            setProcessing(false);
            setTimeout(() => {
                setFeedback("");
                setTranscript("");
            }, 3000);
        }
    };

    return (
        <div className="flex flex-col items-center gap-4 p-6 bg-slate-800 rounded-2xl shadow-xl w-full max-w-md mx-auto border border-slate-700">
            <div className="h-6 text-center">
                <p className={`text-sm font-medium ${processing ? 'text-yellow-400' : 'text-slate-300'}`}>
                    {feedback || (isListening ? "Listening..." : "Tap mic to speak")}
                </p>
            </div>

            <button
                onClick={isListening ? stopListening : startListening}
                disabled={processing}
                className={`
            relative flex items-center justify-center w-20 h-20 rounded-full transition-all duration-300
            ${isListening ? "bg-red-500 scale-110" : "bg-blue-600 hover:bg-blue-500 shadow-lg"}
            ${processing ? "opacity-50 cursor-not-allowed" : ""}
        `}
            >
                {processing ? (
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                ) : isListening ? (
                    <MicOff className="w-8 h-8 text-white" />
                ) : (
                    <Mic className="w-8 h-8 text-white" />
                )}
            </button>

            <div className="min-h-5 w-full text-center">
                {transcript && (
                    <p className="text-lg text-white font-medium animate-pulse">"{transcript}"</p>
                )}
            </div>
        </div>
    );
}