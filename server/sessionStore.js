/*
  SUPABASE SETUP — run this SQL in Supabase SQL editor before starting the server:

  create table sessions (
    id text primary key,
    session_title text,
    contact_name text,
    company_name text,
    source_lang text,
    target_lang text,
    created_at timestamptz default now(),
    ended_at timestamptz,
    duration text,
    total_messages integer default 0
  );

  create table messages (
    id text primary key,
    session_id text references sessions(id),
    speaker_role text,
    original_text text,
    translated_text text,
    timestamp timestamptz default now()
  );
*/

const { createClient } = require('@supabase/supabase-js')
const { nanoid } = require('nanoid')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

async function createSession(contactName, companyName, sourceLang, targetLang, sessionTitle) {
  const { data, error } = await supabase
    .from('sessions')
    .insert({
      id: nanoid(),
      session_title: sessionTitle,
      contact_name: contactName,
      company_name: companyName || null,
      source_lang: sourceLang,
      target_lang: targetLang,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

async function addMessage(sessionId, { speakerRole, originalText, translatedText }) {
  const timestamp = new Date().toISOString()

  const { data: msg, error: msgError } = await supabase
    .from('messages')
    .insert({
      id: nanoid(),
      session_id: sessionId,
      speaker_role: speakerRole,
      original_text: originalText,
      translated_text: translatedText,
      timestamp,
    })
    .select()
    .single()
  if (msgError) throw msgError

  const { data: sess } = await supabase
    .from('sessions')
    .select('total_messages')
    .eq('id', sessionId)
    .single()

  await supabase
    .from('sessions')
    .update({ total_messages: (sess?.total_messages || 0) + 1 })
    .eq('id', sessionId)

  return msg
}

async function getSession(sessionId) {
  const { data: session, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', sessionId)
    .single()
  if (error) throw error

  const { data: messages } = await supabase
    .from('messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('timestamp', { ascending: true })

  return { ...session, messages: messages || [] }
}

async function getAllSessions() {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

async function endSession(sessionId) {
  const { data: sess } = await supabase
    .from('sessions')
    .select('created_at, total_messages')
    .eq('id', sessionId)
    .single()

  const endedAt = new Date()
  const createdAt = new Date(sess.created_at)
  const secs = Math.floor((endedAt - createdAt) / 1000)
  const duration = `${Math.floor(secs / 60)}m ${secs % 60}s`

  const { data, error } = await supabase
    .from('sessions')
    .update({ ended_at: endedAt.toISOString(), duration })
    .eq('id', sessionId)
    .select()
    .single()
  if (error) throw error

  return { ...data, totalMessages: sess.total_messages }
}

async function deleteSession(sessionId) {
  // Delete messages first (FK constraint)
  const { error: msgError } = await supabase
    .from('messages')
    .delete()
    .eq('session_id', sessionId)
  if (msgError) throw msgError

  const { error } = await supabase
    .from('sessions')
    .delete()
    .eq('id', sessionId)
  if (error) throw error
}

module.exports = { createSession, addMessage, getSession, getAllSessions, endSession, deleteSession }
