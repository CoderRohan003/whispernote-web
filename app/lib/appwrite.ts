import { Client, Account, Databases, Query } from 'appwrite';

// 1. Initialize Client
export const client = new Client();

client
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);

// 2. Export Services
export const account = new Account(client);
export const databases = new Databases(client);

// 3. Constants
export const DB_ID = process.env.NEXT_PUBLIC_APPWRITE_DB_ID!;
export const COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ID!;

// 4. Helper Functions

export const addReminder = async (
    userId: string,
    title: string,
    triggerTime: string, // ISO String
    repeat: string = 'once'
) => {
    try {
        const response = await databases.createDocument(
            DB_ID,
            COLLECTION_ID,
            'unique()', // Document ID
            {
                userId,
                title,
                triggerTime,
                repeat,
                isActive: true,
                lastTriggered: null
            }
        );
        return response;
    } catch (error) {
        console.error("Error adding reminder:", error);
        throw error;
    }
};

export const getReminders = async (userId: string) => {
    try {
        const response = await databases.listDocuments(
            DB_ID,
            COLLECTION_ID,
            [
                Query.equal('userId', userId),
                Query.orderAsc('triggerTime'),
                Query.limit(100)
            ]
        );
        return response.documents;
    } catch (error) {
        console.error("Error fetching reminders:", error);
        return [];
    }
};

export const toggleReminder = async (docId: string, currentStatus: boolean) => {
    try {
        const response = await databases.updateDocument(
            DB_ID,
            COLLECTION_ID,
            docId,
            { isActive: !currentStatus }
        );
        return response;
    } catch (error) {
        console.error("Error toggling reminder:", error);
    }
};

export const deleteReminder = async (docId: string) => {
    try {
        await databases.deleteDocument(DB_ID, COLLECTION_ID, docId);
        return true;
    } catch (error) {
        console.error("Error deleting reminder:", error);
        return false;
    }
};

export const updateReminderAfterTrigger = async (docId: string, nextTriggerTime: string, isActive: boolean) => {
    try {
        const response = await databases.updateDocument(
            DB_ID,
            COLLECTION_ID,
            docId,
            {
                triggerTime: nextTriggerTime,
                lastTriggered: new Date().toISOString(),
                isActive: isActive
            }
        );
        return response;
    } catch (error) {
        console.error("Error updating reminder after trigger:", error);
        throw error;
    }
};