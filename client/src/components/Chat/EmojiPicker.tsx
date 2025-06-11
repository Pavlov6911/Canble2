import React from 'react';
import { Box, Paper, Typography, IconButton } from '@mui/material';
import { styled } from '@mui/material/styles';

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  onClose: () => void;
}

const EmojiButton = styled(IconButton)(({ theme }) => ({
  fontSize: '1.5rem',
  padding: theme.spacing(0.5),
  '&:hover': {
    backgroundColor: theme.palette.action.hover
  }
}));

const emojiCategories = {
  'Smileys & People': [
    '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
    '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
    '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩',
    '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣',
    '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬'
  ],
  'Animals & Nature': [
    '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯',
    '🦁', '🐮', '🐷', '🐽', '🐸', '🐵', '🙈', '🙉', '🙊', '🐒',
    '🐔', '🐧', '🐦', '🐤', '🐣', '🐥', '🦆', '🦅', '🦉', '🦇',
    '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜'
  ],
  'Food & Drink': [
    '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈',
    '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦',
    '🥬', '🥒', '🌶️', '🫑', '🌽', '🥕', '🫒', '🧄', '🧅', '🥔',
    '🍠', '🥐', '🥖', '🍞', '🥨', '🥯', '🧀', '🥚', '🍳', '🧈'
  ],
  'Activities': [
    '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱',
    '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳',
    '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛼', '🛷',
    '⛸️', '🥌', '🎿', '⛷️', '🏂', '🪂', '🏋️', '🤼', '🤸', '⛹️'
  ],
  'Objects': [
    '⌚', '📱', '📲', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '🖲️', '🕹️',
    '🗜️', '💽', '💾', '💿', '📀', '📼', '📷', '📸', '📹', '🎥',
    '📽️', '🎞️', '📞', '☎️', '📟', '📠', '📺', '📻', '🎙️', '🎚️',
    '🎛️', '🧭', '⏱️', '⏲️', '⏰', '🕰️', '⌛', '⏳', '📡', '🔋'
  ]
};

const EmojiPicker: React.FC<EmojiPickerProps> = ({ onEmojiSelect, onClose }) => {
  const [selectedCategory, setSelectedCategory] = React.useState('Smileys & People');

  return (
    <Paper
      elevation={8}
      sx={{
        position: 'absolute',
        bottom: '100%',
        right: 0,
        width: 350,
        height: 400,
        mb: 1,
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1000
      }}
    >
      {/* Category tabs */}
      <Box
        sx={{
          display: 'flex',
          borderBottom: 1,
          borderColor: 'divider',
          overflowX: 'auto'
        }}
      >
        {Object.keys(emojiCategories).map((category) => (
          <Box
            key={category}
            onClick={() => setSelectedCategory(category)}
            sx={{
              px: 2,
              py: 1,
              cursor: 'pointer',
              borderBottom: selectedCategory === category ? 2 : 0,
              borderColor: 'primary.main',
              backgroundColor: selectedCategory === category ? 'action.selected' : 'transparent',
              '&:hover': {
                backgroundColor: 'action.hover'
              },
              minWidth: 'fit-content',
              whiteSpace: 'nowrap'
            }}
          >
            <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>
              {category}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Emoji grid */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          p: 1
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 0.5
          }}
        >
          {emojiCategories[selectedCategory as keyof typeof emojiCategories].map((emoji, index) => (
            <EmojiButton
              key={index}
              onClick={() => {
                onEmojiSelect(emoji);
                onClose();
              }}
              size="small"
            >
              {emoji}
            </EmojiButton>
          ))}
        </Box>
      </Box>

      {/* Search bar placeholder */}
      <Box
        sx={{
          p: 1,
          borderTop: 1,
          borderColor: 'divider'
        }}
      >
        <Typography variant="caption" color="text.secondary">
          Click an emoji to insert it
        </Typography>
      </Box>
    </Paper>
  );
};

export default EmojiPicker;