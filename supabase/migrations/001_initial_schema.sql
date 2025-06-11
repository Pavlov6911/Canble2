-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(32) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  avatar TEXT DEFAULT '',
  discriminator VARCHAR(4) NOT NULL,
  status VARCHAR(20) DEFAULT 'offline' CHECK (status IN ('online', 'away', 'busy', 'invisible', 'offline')),
  custom_status JSONB DEFAULT '{}',
  bio TEXT DEFAULT '',
  banner TEXT DEFAULT '',
  accent_color VARCHAR(7) DEFAULT '#5865F2',
  badges TEXT[] DEFAULT '{}',
  premium_type INTEGER DEFAULT 0,
  premium_since TIMESTAMPTZ,
  flags INTEGER DEFAULT 0,
  public_flags INTEGER DEFAULT 0,
  locale VARCHAR(10) DEFAULT 'en-US',
  mfa_enabled BOOLEAN DEFAULT FALSE,
  verified BOOLEAN DEFAULT FALSE,
  email_verified BOOLEAN DEFAULT FALSE,
  phone VARCHAR(20),
  nsfw_allowed BOOLEAN DEFAULT FALSE,
  analytics_token VARCHAR(255),
  connections JSONB DEFAULT '[]',
  friend_sync BOOLEAN DEFAULT TRUE,
  gif_auto_play BOOLEAN DEFAULT TRUE,
  large_threshold INTEGER DEFAULT 50,
  show_current_game BOOLEAN DEFAULT TRUE,
  restricted_guilds TEXT[] DEFAULT '{}',
  desktop_notifications BOOLEAN DEFAULT TRUE,
  mobile_notifications BOOLEAN DEFAULT TRUE,
  disable_games_tab BOOLEAN DEFAULT FALSE,
  developer_mode BOOLEAN DEFAULT FALSE,
  detect_platform_accounts BOOLEAN DEFAULT TRUE,
  status_settings JSONB DEFAULT '{}',
  custom_activity JSONB DEFAULT '{}',
  client_settings JSONB DEFAULT '{}',
  guild_positions TEXT[] DEFAULT '{}',
  restricted_guild_ids TEXT[] DEFAULT '{}',
  friend_source_flags JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Servers table
CREATE TABLE IF NOT EXISTS servers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT DEFAULT '',
  icon TEXT,
  banner TEXT,
  splash TEXT,
  discovery_splash TEXT,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  permissions_new VARCHAR(20) DEFAULT '0',
  region VARCHAR(50) DEFAULT 'us-west',
  afk_channel_id UUID,
  afk_timeout INTEGER DEFAULT 300,
  widget_enabled BOOLEAN DEFAULT FALSE,
  widget_channel_id UUID,
  verification_level INTEGER DEFAULT 0,
  default_message_notifications INTEGER DEFAULT 0,
  explicit_content_filter INTEGER DEFAULT 0,
  mfa_level INTEGER DEFAULT 0,
  application_id UUID,
  system_channel_id UUID,
  system_channel_flags INTEGER DEFAULT 0,
  rules_channel_id UUID,
  max_presences INTEGER,
  max_members INTEGER DEFAULT 250000,
  vanity_url_code VARCHAR(50),
  premium_tier INTEGER DEFAULT 0,
  premium_subscription_count INTEGER DEFAULT 0,
  preferred_locale VARCHAR(10) DEFAULT 'en-US',
  public_updates_channel_id UUID,
  max_video_channel_users INTEGER DEFAULT 25,
  approximate_member_count INTEGER DEFAULT 0,
  approximate_presence_count INTEGER DEFAULT 0,
  welcome_screen JSONB DEFAULT '{}',
  nsfw_level INTEGER DEFAULT 0,
  stage_instances JSONB DEFAULT '[]',
  stickers JSONB DEFAULT '[]',
  guild_scheduled_events JSONB DEFAULT '[]',
  premium_progress_bar_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Channels table
CREATE TABLE IF NOT EXISTS channels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type INTEGER DEFAULT 0,
  server_id UUID REFERENCES servers(id) ON DELETE CASCADE,
  position INTEGER DEFAULT 0,
  permission_overwrites JSONB DEFAULT '[]',
  name VARCHAR(100),
  topic TEXT,
  nsfw BOOLEAN DEFAULT FALSE,
  last_message_id UUID,
  bitrate INTEGER,
  user_limit INTEGER,
  rate_limit_per_user INTEGER DEFAULT 0,
  recipients JSONB DEFAULT '[]',
  icon TEXT,
  owner_id UUID REFERENCES users(id),
  application_id UUID,
  parent_id UUID REFERENCES channels(id),
  last_pin_timestamp TIMESTAMPTZ,
  rtc_region VARCHAR(50),
  video_quality_mode INTEGER DEFAULT 1,
  message_count INTEGER DEFAULT 0,
  member_count INTEGER DEFAULT 0,
  thread_metadata JSONB DEFAULT '{}',
  member JSONB DEFAULT '{}',
  default_auto_archive_duration INTEGER,
  permissions VARCHAR(20),
  flags INTEGER DEFAULT 0,
  total_message_sent INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content TEXT DEFAULT '',
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  server_id UUID REFERENCES servers(id) ON DELETE CASCADE,
  type INTEGER DEFAULT 0,
  tts BOOLEAN DEFAULT FALSE,
  mention_everyone BOOLEAN DEFAULT FALSE,
  mentions UUID[] DEFAULT '{}',
  mention_roles UUID[] DEFAULT '{}',
  mention_channels JSONB DEFAULT '[]',
  attachments JSONB DEFAULT '[]',
  embeds JSONB DEFAULT '[]',
  reactions JSONB DEFAULT '[]',
  nonce VARCHAR(255),
  pinned BOOLEAN DEFAULT FALSE,
  webhook_id UUID,
  message_type INTEGER DEFAULT 0,
  activity JSONB DEFAULT '{}',
  application JSONB DEFAULT '{}',
  application_id UUID,
  message_reference JSONB DEFAULT '{}',
  flags INTEGER DEFAULT 0,
  referenced_message JSONB DEFAULT '{}',
  interaction JSONB DEFAULT '{}',
  thread JSONB DEFAULT '{}',
  components JSONB DEFAULT '[]',
  sticker_items JSONB DEFAULT '[]',
  stickers JSONB DEFAULT '[]',
  position INTEGER,
  edited_timestamp TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Groups table
CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT DEFAULT '',
  type VARCHAR(20) NOT NULL CHECK (type IN ('community', 'private')),
  icon TEXT,
  banner TEXT,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category VARCHAR(50) DEFAULT 'general',
  tags TEXT[] DEFAULT '{}',
  is_public BOOLEAN DEFAULT TRUE,
  is_discoverable BOOLEAN DEFAULT TRUE,
  max_members INTEGER DEFAULT 100,
  member_count INTEGER DEFAULT 0,
  online_count INTEGER DEFAULT 0,
  verification_level INTEGER DEFAULT 0,
  explicit_content_filter INTEGER DEFAULT 0,
  default_message_notifications INTEGER DEFAULT 0,
  vanity_url VARCHAR(50),
  invite_splash TEXT,
  features TEXT[] DEFAULT '{}',
  approximate_member_count INTEGER DEFAULT 0,
  approximate_presence_count INTEGER DEFAULT 0,
  welcome_screen JSONB DEFAULT '{}',
  nsfw_level INTEGER DEFAULT 0,
  premium_tier INTEGER DEFAULT 0,
  premium_subscription_count INTEGER DEFAULT 0,
  preferred_locale VARCHAR(10) DEFAULT 'en-US',
  rules_channel_id UUID,
  public_updates_channel_id UUID,
  safety_alerts_channel_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Group members table
CREATE TABLE IF NOT EXISTS group_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'moderator', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  permissions JSONB DEFAULT '{}',
  UNIQUE(group_id, user_id)
);

-- Group channels table
CREATE TABLE IF NOT EXISTS group_channels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  type INTEGER DEFAULT 0,
  position INTEGER DEFAULT 0,
  topic TEXT,
  nsfw BOOLEAN DEFAULT FALSE,
  rate_limit_per_user INTEGER DEFAULT 0,
  permission_overwrites JSONB DEFAULT '[]',
  parent_id UUID REFERENCES group_channels(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Roles table
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  server_id UUID REFERENCES servers(id) ON DELETE CASCADE,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  color INTEGER DEFAULT 0,
  hoist BOOLEAN DEFAULT FALSE,
  icon TEXT,
  unicode_emoji TEXT,
  position INTEGER DEFAULT 0,
  permissions VARCHAR(20) DEFAULT '0',
  managed BOOLEAN DEFAULT FALSE,
  mentionable BOOLEAN DEFAULT FALSE,
  tags JSONB DEFAULT '{}',
  flags INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User roles table (many-to-many)
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role_id)
);

-- Server members table
CREATE TABLE IF NOT EXISTS server_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  server_id UUID NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  nick VARCHAR(32),
  avatar TEXT,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  premium_since TIMESTAMPTZ,
  deaf BOOLEAN DEFAULT FALSE,
  mute BOOLEAN DEFAULT FALSE,
  flags INTEGER DEFAULT 0,
  pending BOOLEAN DEFAULT FALSE,
  permissions VARCHAR(20),
  communication_disabled_until TIMESTAMPTZ,
  UNIQUE(server_id, user_id)
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  data JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Friend requests table
CREATE TABLE IF NOT EXISTS friend_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'blocked')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(sender_id, receiver_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_messages_channel_id ON messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_messages_author_id ON messages(author_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_channels_server_id ON channels(server_id);
CREATE INDEX IF NOT EXISTS idx_server_members_server_id ON server_members(server_id);
CREATE INDEX IF NOT EXISTS idx_server_members_user_id ON server_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_sender_id ON friend_requests(sender_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_receiver_id ON friend_requests(receiver_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_servers_updated_at BEFORE UPDATE ON servers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_channels_updated_at BEFORE UPDATE ON channels FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON groups FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();