-- Function to increment group member count
CREATE OR REPLACE FUNCTION increment_group_member_count(group_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE groups 
  SET member_count = member_count + 1,
      approximate_member_count = member_count + 1,
      updated_at = NOW()
  WHERE id = group_id;
END;
$$ LANGUAGE plpgsql;

-- Function to decrement group member count
CREATE OR REPLACE FUNCTION decrement_group_member_count(group_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE groups 
  SET member_count = GREATEST(member_count - 1, 0),
      approximate_member_count = GREATEST(member_count - 1, 0),
      updated_at = NOW()
  WHERE id = group_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update group member count based on actual members
CREATE OR REPLACE FUNCTION sync_group_member_count(group_id UUID)
RETURNS VOID AS $$
DECLARE
  actual_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO actual_count
  FROM group_members
  WHERE group_members.group_id = sync_group_member_count.group_id;
  
  UPDATE groups 
  SET member_count = actual_count,
      approximate_member_count = actual_count,
      updated_at = NOW()
  WHERE id = group_id;
END;
$$ LANGUAGE plpgsql;

-- Function to increment server member count
CREATE OR REPLACE FUNCTION increment_server_member_count(server_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE servers 
  SET approximate_member_count = approximate_member_count + 1,
      updated_at = NOW()
  WHERE id = server_id;
END;
$$ LANGUAGE plpgsql;

-- Function to decrement server member count
CREATE OR REPLACE FUNCTION decrement_server_member_count(server_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE servers 
  SET approximate_member_count = GREATEST(approximate_member_count - 1, 0),
      updated_at = NOW()
  WHERE id = server_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update channel message count
CREATE OR REPLACE FUNCTION increment_channel_message_count(channel_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE channels 
  SET message_count = message_count + 1,
      total_message_sent = total_message_sent + 1,
      updated_at = NOW()
  WHERE id = channel_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's groups with member info
CREATE OR REPLACE FUNCTION get_user_groups(user_id UUID)
RETURNS TABLE (
  group_id UUID,
  group_name VARCHAR(100),
  group_description TEXT,
  group_type VARCHAR(20),
  group_icon TEXT,
  group_banner TEXT,
  owner_id UUID,
  member_role VARCHAR(20),
  joined_at TIMESTAMPTZ,
  member_count INTEGER,
  online_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    g.id,
    g.name,
    g.description,
    g.type,
    g.icon,
    g.banner,
    g.owner_id,
    gm.role,
    gm.joined_at,
    g.member_count,
    g.online_count
  FROM groups g
  JOIN group_members gm ON g.id = gm.group_id
  WHERE gm.user_id = get_user_groups.user_id
  ORDER BY gm.joined_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's servers with member info
CREATE OR REPLACE FUNCTION get_user_servers(user_id UUID)
RETURNS TABLE (
  server_id UUID,
  server_name VARCHAR(100),
  server_description TEXT,
  server_icon TEXT,
  server_banner TEXT,
  owner_id UUID,
  nick VARCHAR(32),
  joined_at TIMESTAMPTZ,
  member_count INTEGER,
  presence_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.name,
    s.description,
    s.icon,
    s.banner,
    s.owner_id,
    sm.nick,
    sm.joined_at,
    s.approximate_member_count,
    s.approximate_presence_count
  FROM servers s
  JOIN server_members sm ON s.id = sm.server_id
  WHERE sm.user_id = get_user_servers.user_id
  ORDER BY sm.joined_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to search messages with pagination
CREATE OR REPLACE FUNCTION search_messages(
  search_query TEXT,
  channel_id UUID DEFAULT NULL,
  server_id UUID DEFAULT NULL,
  author_id UUID DEFAULT NULL,
  limit_count INTEGER DEFAULT 50,
  offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
  message_id UUID,
  content TEXT,
  author_id UUID,
  author_username VARCHAR(32),
  author_avatar TEXT,
  channel_id UUID,
  channel_name VARCHAR(100),
  server_id UUID,
  created_at TIMESTAMPTZ,
  edited_timestamp TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.content,
    m.author_id,
    u.username,
    u.avatar,
    m.channel_id,
    c.name,
    m.server_id,
    m.created_at,
    m.edited_timestamp
  FROM messages m
  JOIN users u ON m.author_id = u.id
  LEFT JOIN channels c ON m.channel_id = c.id
  WHERE 
    (search_query IS NULL OR m.content ILIKE '%' || search_query || '%')
    AND (search_messages.channel_id IS NULL OR m.channel_id = search_messages.channel_id)
    AND (search_messages.server_id IS NULL OR m.server_id = search_messages.server_id)
    AND (search_messages.author_id IS NULL OR m.author_id = search_messages.author_id)
  ORDER BY m.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get recent messages for a channel
CREATE OR REPLACE FUNCTION get_channel_messages(
  channel_id UUID,
  limit_count INTEGER DEFAULT 50,
  before_message_id UUID DEFAULT NULL
)
RETURNS TABLE (
  message_id UUID,
  content TEXT,
  author_id UUID,
  author_username VARCHAR(32),
  author_discriminator VARCHAR(4),
  author_avatar TEXT,
  message_type INTEGER,
  attachments JSONB,
  embeds JSONB,
  reactions JSONB,
  pinned BOOLEAN,
  edited_timestamp TIMESTAMPTZ,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.content,
    m.author_id,
    u.username,
    u.discriminator,
    u.avatar,
    m.type,
    m.attachments,
    m.embeds,
    m.reactions,
    m.pinned,
    m.edited_timestamp,
    m.created_at
  FROM messages m
  JOIN users u ON m.author_id = u.id
  WHERE 
    m.channel_id = get_channel_messages.channel_id
    AND (before_message_id IS NULL OR m.created_at < (
      SELECT created_at FROM messages WHERE id = before_message_id
    ))
  ORDER BY m.created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's friend requests
CREATE OR REPLACE FUNCTION get_user_friend_requests(user_id UUID)
RETURNS TABLE (
  request_id UUID,
  sender_id UUID,
  sender_username VARCHAR(32),
  sender_discriminator VARCHAR(4),
  sender_avatar TEXT,
  receiver_id UUID,
  receiver_username VARCHAR(32),
  receiver_discriminator VARCHAR(4),
  receiver_avatar TEXT,
  status VARCHAR(20),
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    fr.id,
    fr.sender_id,
    sender.username,
    sender.discriminator,
    sender.avatar,
    fr.receiver_id,
    receiver.username,
    receiver.discriminator,
    receiver.avatar,
    fr.status,
    fr.created_at
  FROM friend_requests fr
  JOIN users sender ON fr.sender_id = sender.id
  JOIN users receiver ON fr.receiver_id = receiver.id
  WHERE fr.sender_id = get_user_friend_requests.user_id 
     OR fr.receiver_id = get_user_friend_requests.user_id
  ORDER BY fr.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's notifications
CREATE OR REPLACE FUNCTION get_user_notifications(
  user_id UUID,
  limit_count INTEGER DEFAULT 50,
  offset_count INTEGER DEFAULT 0,
  unread_only BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
  notification_id UUID,
  type VARCHAR(50),
  title VARCHAR(255),
  message TEXT,
  data JSONB,
  read BOOLEAN,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    n.id,
    n.type,
    n.title,
    n.message,
    n.data,
    n.read,
    n.created_at
  FROM notifications n
  WHERE 
    n.user_id = get_user_notifications.user_id
    AND (NOT unread_only OR n.read = FALSE)
  ORDER BY n.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql;

-- Function to mark notifications as read
CREATE OR REPLACE FUNCTION mark_notifications_read(
  user_id UUID,
  notification_ids UUID[] DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  IF notification_ids IS NULL THEN
    -- Mark all notifications as read for the user
    UPDATE notifications 
    SET read = TRUE, updated_at = NOW()
    WHERE notifications.user_id = mark_notifications_read.user_id AND read = FALSE;
  ELSE
    -- Mark specific notifications as read
    UPDATE notifications 
    SET read = TRUE, updated_at = NOW()
    WHERE notifications.user_id = mark_notifications_read.user_id 
      AND id = ANY(notification_ids) 
      AND read = FALSE;
  END IF;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to update last_message_id in channels
CREATE OR REPLACE FUNCTION update_channel_last_message()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE channels 
    SET last_message_id = NEW.id,
        updated_at = NOW()
    WHERE id = NEW.channel_id;
    
    -- Also increment message count
    PERFORM increment_channel_message_count(NEW.channel_id);
    
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating last message
DROP TRIGGER IF EXISTS trigger_update_channel_last_message ON messages;
CREATE TRIGGER trigger_update_channel_last_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_channel_last_message();

-- Trigger function to sync group member count when members are added/removed
CREATE OR REPLACE FUNCTION sync_group_member_count_trigger()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM increment_group_member_count(NEW.group_id);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM decrement_group_member_count(OLD.group_id);
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for group member count
DROP TRIGGER IF EXISTS trigger_group_member_insert ON group_members;
CREATE TRIGGER trigger_group_member_insert
  AFTER INSERT ON group_members
  FOR EACH ROW
  EXECUTE FUNCTION sync_group_member_count_trigger();

DROP TRIGGER IF EXISTS trigger_group_member_delete ON group_members;
CREATE TRIGGER trigger_group_member_delete
  AFTER DELETE ON group_members
  FOR EACH ROW
  EXECUTE FUNCTION sync_group_member_count_trigger();