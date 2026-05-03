-- Enable realtime for messaging so messages appear instantly
ALTER PUBLICATION supabase_realtime ADD TABLE navi_message_threads;
ALTER PUBLICATION supabase_realtime ADD TABLE navi_messages;
