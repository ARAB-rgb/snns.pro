import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || 'https://mqjnsvglvrpdmtgzmidl.supabase.co';
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xam5zdmdsdnJwZG10Z3ptaWRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2Mjc4MDksImV4cCI6MjA5ODIwMzgwOX0.O0nmU9w62Epdw9hTN1GRov8iuoujXbnvBX-EAMZ2jXc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// SQL Setup Script that the user can run in Supabase SQL Editor
export const SUPABASE_SQL_SCHEMA = `-- 1. جدول المستخدمين (users)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT,
  avatar TEXT,
  email TEXT,
  avatar_type TEXT DEFAULT 'emoji',
  avatar_url TEXT,
  status TEXT DEFAULT 'online',
  role TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- جدول ملفات التعريف (profiles)
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  name TEXT,
  avatar TEXT,
  email TEXT,
  avatar_type TEXT DEFAULT 'emoji',
  avatar_url TEXT,
  status TEXT DEFAULT 'online',
  role TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. جدول جهات الاتصال (contacts)
CREATE TABLE IF NOT EXISTS contacts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  avatar TEXT,
  status TEXT DEFAULT 'online',
  last_seen TEXT,
  role TEXT,
  bio TEXT,
  is_group BOOLEAN DEFAULT FALSE,
  members TEXT[], -- قائمة المعرفات للأعضاء
  visibility TEXT DEFAULT 'public',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. جدول الرسائل (messages)
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  sender_id TEXT NOT NULL,
  sender_name TEXT,
  text TEXT,
  timestamp TEXT,
  type TEXT DEFAULT 'text',
  media_url TEXT,
  duration NUMERIC,
  file_name TEXT,
  file_size TEXT,
  status TEXT DEFAULT 'sent',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. جدول سجل المكالمات (calls)
CREATE TABLE IF NOT EXISTS calls (
  id TEXT PRIMARY KEY,
  contact_id TEXT NOT NULL,
  type TEXT DEFAULT 'voice', -- video or audio
  direction TEXT, -- incoming, outgoing, missed
  timestamp TEXT,
  duration TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- تفعيل الصلاحيات لجميع الجداول (لتسهيل القراءة والكتابة من خلال Anon Key)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anonymous read" ON users;
CREATE POLICY "Allow anonymous read" ON users FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow anonymous write" ON users;
CREATE POLICY "Allow anonymous write" ON users FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow anonymous read" ON profiles;
CREATE POLICY "Allow anonymous read" ON profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow anonymous write" ON profiles;
CREATE POLICY "Allow anonymous write" ON profiles FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow anonymous read" ON contacts;
CREATE POLICY "Allow anonymous read" ON contacts FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow anonymous write" ON contacts;
CREATE POLICY "Allow anonymous write" ON contacts FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow anonymous read" ON messages;
CREATE POLICY "Allow anonymous read" ON messages FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow anonymous write" ON messages;
CREATE POLICY "Allow anonymous write" ON messages FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow anonymous read" ON calls;
CREATE POLICY "Allow anonymous read" ON calls FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow anonymous write" ON calls;
CREATE POLICY "Allow anonymous write" ON calls FOR ALL USING (true);
`;

/**
 * Safely inserts or updates a user profile in Supabase
 */
export async function syncUserToSupabase(user: {
  id: string;
  name: string;
  avatar: string;
  email: string;
  avatarType: 'emoji' | 'image_url';
  avatarUrl: string;
  status: 'online' | 'offline' | 'away';
  role?: string;
}) {
  try {
    const { error } = await supabase.from('users').upsert({
      id: user.id,
      name: user.name,
      avatar: user.avatar,
      email: user.email,
      avatar_type: user.avatarType,
      avatar_url: user.avatarUrl,
      status: user.status,
      role: user.role || 'مستخدم مسجل'
    });
    if (error) console.warn('Supabase users upsert notice:', error.message);
    return !error;
  } catch (err) {
    console.error('Supabase users error:', err);
    return false;
  }
}

/**
 * Safely inserts or updates a user profile in Supabase profiles table
 */
export async function syncProfileToSupabase(user: {
  id: string;
  name: string;
  avatar: string;
  email: string;
  avatarType: 'emoji' | 'image_url';
  avatarUrl: string;
  status: 'online' | 'offline' | 'away';
  role?: string;
}) {
  try {
    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      name: user.name,
      avatar: user.avatar,
      email: user.email,
      avatar_type: user.avatarType,
      avatar_url: user.avatarUrl,
      status: user.status,
      role: user.role || 'مستخدم مسجل'
    });
    if (error) console.warn('Supabase profiles upsert notice:', error.message);
    return !error;
  } catch (err) {
    console.error('Supabase profiles error:', err);
    return false;
  }
}

/**
 * Safely upserts contacts to Supabase
 */
export async function syncContactToSupabase(contact: any) {
  try {
    const { error } = await supabase.from('contacts').upsert({
      id: contact.id,
      name: contact.name,
      avatar: contact.avatar,
      status: contact.status,
      last_seen: contact.lastSeen || '',
      role: contact.role || '',
      bio: contact.bio || '',
      is_group: contact.isGroup || false,
      members: contact.members || [],
      visibility: contact.visibility || 'public'
    });
    if (error) console.warn('Supabase contacts upsert notice:', error.message);
    return !error;
  } catch (err) {
    console.error('Supabase contacts error:', err);
    return false;
  }
}

/**
 * Safely inserts a message to Supabase
 */
export async function syncMessageToSupabase(message: any) {
  try {
    const { error } = await supabase.from('messages').insert({
      id: message.id,
      sender_id: message.senderId,
      sender_name: message.senderName,
      text: message.text,
      timestamp: message.timestamp,
      type: message.type,
      media_url: message.mediaUrl || '',
      duration: message.duration || null,
      file_name: message.fileName || '',
      file_size: message.fileSize || '',
      status: message.status || 'sent'
    });
    if (error) console.warn('Supabase messages insert notice:', error.message);
    return !error;
  } catch (err) {
    console.error('Supabase messages error:', err);
    return false;
  }
}

/**
 * Safely inserts a call record to Supabase
 */
export async function syncCallToSupabase(call: any) {
  try {
    const { error } = await supabase.from('calls').insert({
      id: call.id,
      contact_id: call.contactId,
      type: call.type,
      direction: call.direction,
      timestamp: call.timestamp,
      duration: call.duration || ''
    });
    if (error) console.warn('Supabase calls insert notice:', error.message);
    return !error;
  } catch (err) {
    console.error('Supabase calls error:', err);
    return false;
  }
}

/**
 * Checks connection and returns the counts of records in the tables
 */
export async function checkSupabaseTables() {
  const result = {
    connected: false,
    users: 0,
    contacts: 0,
    messages: 0,
    calls: 0,
    errors: {} as Record<string, string>
  };

  try {
    // Simple ping check
    const { data, error: pingError } = await supabase.from('users').select('count', { count: 'exact', head: true });
    if (pingError) {
      result.errors.users = pingError.message;
    } else {
      result.connected = true;
      result.users = data ? data.length : 0;
    }

    const { error: contactsError } = await supabase.from('contacts').select('count', { count: 'exact', head: true });
    if (contactsError) result.errors.contacts = contactsError.message;

    const { error: messagesError } = await supabase.from('messages').select('count', { count: 'exact', head: true });
    if (messagesError) result.errors.messages = messagesError.message;

    const { error: callsError } = await supabase.from('calls').select('count', { count: 'exact', head: true });
    if (callsError) result.errors.calls = callsError.message;

  } catch (err: any) {
    result.errors.general = err.message || String(err);
  }

  return result;
}
